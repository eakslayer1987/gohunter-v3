/**
 * Opponent simulation engine for the multiplayer-feel HUD on /play.
 *
 * Real backend matchmaking isn't wired up yet, but the page needs the
 * opponent to feel "alive" — score should jump in believable bursts
 * (not a linear drift), the LIVE_FEED should show their actions, and
 * the end-of-mission DEBRIEF should compare against a final number
 * the player can lose to.
 *
 * Deterministic per-match: the same matchId yields the same opponent
 * curve. Means the player can refresh /play mid-match and the
 * opponent state stays consistent.
 */

const OPPONENT_NAMES = [
  'NeonHunter88',
  'BangkokRiver',
  'CoinSamurai',
  'SiamGhost',
  'GoldenTuk',
] as const;

const OPPONENT_TRIBES = ['wolf', 'lion', 'falcon', 'shark'] as const;

export interface OpponentProfile {
  name: string;
  tribe: (typeof OPPONENT_TRIBES)[number];
  tribeEmoji: string;
  /** Their target final score for this match. Player aims to beat this. */
  targetScore: number;
  /** Skill tier — drives event cadence + variance. */
  skill: 'rookie' | 'pro' | 'elite';
}

export interface OpponentEvent {
  /** Seconds since match start when this event fires. */
  at: number;
  kind: 'deploy' | 'pin' | 'hint' | 'score' | 'streak' | 'abandon';
  /** Score awarded by this event (only for 'score' kind). */
  delta?: number;
  /** Free-text snippet to render in LIVE_FEED. */
  text: string;
}

/** Stable hash so {string} → number is reproducible across renders. */
function strHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — small + deterministic. Same seed → same sequence. */
function makePrng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TRIBE_EMOJI: Record<(typeof OPPONENT_TRIBES)[number], string> = {
  wolf: '🐺',
  lion: '🦁',
  falcon: '🦅',
  shark: '🦈',
};

/** Roll an opponent for a given match. The matchId seed makes the
 *  same fight reproducible — refresh /play mid-mission, the player
 *  still faces the same hunter at the same numbers. */
export function rollOpponent(matchId: string): OpponentProfile {
  const seed = strHash(matchId || 'default');
  const rand = makePrng(seed);
  const name = OPPONENT_NAMES[Math.floor(rand() * OPPONENT_NAMES.length)];
  const tribe = OPPONENT_TRIBES[Math.floor(rand() * OPPONENT_TRIBES.length)];

  // Skill weighting: 50% rookie, 35% pro, 15% elite — beatable on
  // average but the elite roll keeps the player honest.
  const r = rand();
  const skill: OpponentProfile['skill'] =
    r < 0.5 ? 'rookie' : r < 0.85 ? 'pro' : 'elite';

  // Target score range scales with skill. Player scoring ~1000 base
  // with mid-tier streak/tribe bonuses should beat rookie ~70% of
  // the time and elite ~20%.
  const targetByTier: Record<OpponentProfile['skill'], [number, number]> = {
    rookie: [2200, 3500],
    pro: [3800, 5400],
    elite: [5500, 7800],
  };
  const [lo, hi] = targetByTier[skill];
  const targetScore = Math.round(lo + rand() * (hi - lo));

  return {
    name,
    tribe,
    tribeEmoji: TRIBE_EMOJI[tribe],
    targetScore,
    skill,
  };
}

/** Build the full event timeline for an opponent over `matchSeconds`
 *  (typically 180 = 3 min). Bursts of score are clustered around
 *  "scoring moments" with smaller events between to keep LIVE_FEED
 *  feeling busy. */
export function buildOpponentTimeline(
  opp: OpponentProfile,
  matchId: string,
  matchSeconds: number,
): OpponentEvent[] {
  const seed = strHash(matchId + ':timeline') ^ strHash(opp.name);
  const rand = makePrng(seed);
  const events: OpponentEvent[] = [];

  // Always-fire opening event so LIVE_FEED has content from second 0.
  events.push({
    at: 0,
    kind: 'deploy',
    text: `${opp.name} deployed ${opp.tribeEmoji}`,
  });

  // Pin placement around 20-50 s in
  const pinAt = 20 + rand() * 30;
  if (pinAt < matchSeconds) {
    events.push({
      at: Math.round(pinAt),
      kind: 'pin',
      text: `${opp.name} dropped pin`,
    });
  }

  // 1-3 hint events for rookie/pro, 0-1 for elite (they don't need them)
  const hintCount =
    opp.skill === 'elite'
      ? Math.floor(rand() * 2)
      : 1 + Math.floor(rand() * 3);
  for (let i = 0; i < hintCount; i++) {
    const at = 25 + rand() * (matchSeconds * 0.6);
    if (at < matchSeconds) {
      events.push({
        at: Math.round(at),
        kind: 'hint',
        text: `${opp.name} decrypted clue`,
      });
    }
  }

  // 3-6 score bursts, distributed across the match. Sum approximates
  // target with elite hitting closer to their ceiling.
  const burstCount = 3 + Math.floor(rand() * 4);
  const avgBurst = Math.round(opp.targetScore / burstCount);
  for (let i = 0; i < burstCount; i++) {
    // Spread bursts: first one early, last one near end of match.
    const at = Math.round(
      (matchSeconds * (i + 1)) / (burstCount + 1) + (rand() - 0.5) * 12,
    );
    if (at < 0 || at >= matchSeconds) continue;
    const variance = 0.6 + rand() * 0.8; // 0.6..1.4 × avg
    const delta = Math.max(60, Math.round(avgBurst * variance));
    events.push({
      at,
      kind: 'score',
      delta,
      text: `${opp.name} locked +${delta.toLocaleString()}`,
    });
  }

  // Occasional streak callout, elite only
  if (opp.skill === 'elite' && rand() < 0.45) {
    events.push({
      at: Math.round(matchSeconds * 0.55 + rand() * 30),
      kind: 'streak',
      text: `${opp.name} 🔥 STREAK x3`,
    });
  }

  // Rookies occasionally abandon (player gets to feel they pulled ahead)
  if (opp.skill === 'rookie' && rand() < 0.18) {
    events.push({
      at: Math.round(matchSeconds * 0.75 + rand() * 20),
      kind: 'abandon',
      text: `${opp.name} aborted contract`,
    });
  }

  // Sort ascending by time so consumers can read sequentially.
  events.sort((a, b) => a.at - b.at);
  return events;
}

/** Compute the opponent's running score at a point in time, given the
 *  timeline. Sum of all 'score' deltas that have fired by then. */
export function opponentScoreAt(timeline: OpponentEvent[], elapsedSec: number): number {
  let total = 0;
  for (const e of timeline) {
    if (e.at > elapsedSec) break;
    if (e.kind === 'score' && e.delta) total += e.delta;
  }
  return total;
}

/** Final score = sum of every score event in the timeline.
 *  Cached snapshot so DEBRIEF doesn't depend on render timing. */
export function opponentFinalScore(timeline: OpponentEvent[]): number {
  return timeline.reduce(
    (sum, e) => sum + (e.kind === 'score' && e.delta ? e.delta : 0),
    0,
  );
}

/** Return only events that have fired by `elapsedSec` — newest last.
 *  /play uses this to feed LIVE_FEED with a rolling tail. */
export function recentOpponentEvents(
  timeline: OpponentEvent[],
  elapsedSec: number,
  limit = 5,
): OpponentEvent[] {
  const fired = timeline.filter((e) => e.at <= elapsedSec);
  return fired.slice(-limit);
}
