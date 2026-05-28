export type TribeId = 'wolf' | 'lion' | 'falcon' | 'shark';

export interface Tribe {
  id: TribeId;
  name: string;
  emoji: string;
  color: string;
  bonus: { type: 'speed' | 'power' | 'vision' | 'hunt'; value: number };
  bonusLabel: string;
}

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  district: string;
  clues: string[];
}

export interface ScoreBreakdown {
  total: number;
  base: number;
  speedBonus: number;
  noHintBonus: number;
  streakBonus: number;
  tribeBonus: number;
}

export interface Mission {
  id: string;
  location: Location;
  startedAt: number;
  duration: number; // seconds
  hintsUsed: number;
  timeExtensions: number;
  pinPosition?: { lat: number; lng: number };
  dragCost: number;
  completed: boolean;
  score?: number;
  distanceMeters?: number;
  /** Cached scoring breakdown at submit time — source of truth for /result so SPEED_BONUS doesn't get recomputed against remainingSeconds=0 (bug fix from audit). */
  breakdown?: ScoreBreakdown;
  /** Seconds left on the clock when the player submitted — preserved so /result can display real speed without recomputing. */
  remainingSecondsAtSubmit?: number;
  /** Match.reward bonus credits granted when this submit completed the
   *  match — only set on the final mission. /result reads this to show
   *  the CONTRACT_COMPLETE_BONUS pill + extra row in the breakdown. */
  matchCompletionBonus?: number;
}

export type MatchType = 'flash' | 'classic' | 'night' | 'raid';
export type AccentColor = 'cyan' | 'violet' | 'gold' | 'red';

export interface Match {
  id: string;
  type: MatchType;
  codename: string; // FLASH_LUNCH, CLASSIC_GRID, NIGHT_HUNT, RAID_OPEN
  window: string;
  missionCount: number;
  staminaCost: number;
  reward: number;
  accent: AccentColor;
  badge: string;
}

export type PetStage = 'S1' | 'S2' | 'S3' | 'S4';

export interface Pet {
  name: string;
  stage: PetStage;
  level: number;
  happiness: number;
  exp: number;
  expToNext: number;
  skill: {
    name: string;
    description: string;
    cooldown: number;
    lastUsed: number;
  };
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  streak: number;
  tribe: TribeId;
  previousRank?: number;
}

export interface RunHistoryEntry {
  /** Unique id — `run-{timestamp}-{random}` so concurrent submits in the
   *  same ms still get distinct ids in the unlikely test scenario. */
  id: string;
  matchId: string;
  matchCodename: string;
  completedAt: number;
  totalScore: number;
  matchBonus: number;
  /** Per-mission credits (floor(score/20)) + matchBonus = full payout. */
  creditEarned: number;
  /** Tribe active at submit — feeds TRIBE_ROVER achievement. Optional
   *  so persisted entries from before this field shipped still load. */
  tribeUsed?: TribeId;
  rounds: Array<{
    locationName: string;
    locationDistrict: string;
    score: number;
    distanceMeters: number;
    tier: 'S' | 'A' | 'B' | 'C';
  }>;
}

export interface Achievement {
  id: string;
  /** Display name in cyber upper-case (e.g. "FIRST_BLOOD"). */
  name: string;
  /** One-line "how to unlock" hint in Thai. */
  description: string;
  /** Emoji used as card icon — kept stringly so the catalog stays
   *  declarative and we don't need an icon component pipeline. */
  icon: string;
  /** ms timestamp; undefined = still locked. */
  unlockedAt?: number;
}

export interface PlayerState {
  nickname: string;
  agentId: string;
  tribe: TribeId;
  stamina: number;
  maxStamina: number;
  credits: number; // was: coins
  streak: number;
  totalScore: number;
  weeklyScore: number;
  xp: number;
  xpToNext: number;
  level: number;
  lastLogin: number;
  loginStreak: number;
  /** Wall-clock timestamp the regen timer was last reconciled — optional so
   *  persisted state from before stamina regen shipped rehydrates cleanly. */
  lastStaminaRegenAt?: number;
}
