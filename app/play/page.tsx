'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import Bar from '@/components/ui/Bar';
import { StreetViewWalker } from '@/components/game/StreetViewWalker';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/store/toastStore';
import {
  distanceMeters,
  scoreFromDistance,
  computeTotalScore,
  formatTime,
} from '@/lib/utils';
import { getTribe } from '@/data/tribes';
import { getPetStageMeta } from '@/data/pets';

const HAS_STREET_VIEW_KEY = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const GameMap = dynamic(() => import('@/components/game/GameMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center font-mono text-cyber-cyan text-[10px]">
      ▸ INIT_GRID...
    </div>
  ),
});

import {
  rollOpponent,
  buildOpponentTimeline,
  opponentScoreAt,
  opponentFinalScore,
  recentOpponentEvents,
  type OpponentEvent,
} from '@/lib/opponent';

export default function PlayPage() {
  const router = useRouter();
  const matchId = useGameStore((s) => s.currentMatchId);
  const missions = useGameStore((s) => s.missionsInMatch);
  const idx = useGameStore((s) => s.currentMissionIndex);
  const player = useGameStore((s) => s.player);
  const pinEnergy = useGameStore((s) => s.pinEnergy);
  const useHint = useGameStore((s) => s.useHint);
  const submitMission = useGameStore((s) => s.submitMission);
  const setPin = useGameStore((s) => s.setPin);
  const exitMatch = useGameStore((s) => s.exitMatch);
  const usePetSkill = useGameStore((s) => s.usePetSkill);
  const petSkillReady = useGameStore((s) => s.petSkillReady);
  const pet = useGameStore((s) => s.pet);
  const testMode = useSettingsStore((s) => s.testMode);
  const playViewMode = useSettingsStore((s) => s.playViewMode);
  const setPlayViewMode = useSettingsStore((s) => s.setPlayViewMode);

  const cur = missions[idx];
  const tribe = getTribe(player.tribe);
  const petMeta = getPetStageMeta(pet.stage);

  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [skillFlash, setSkillFlash] = useState(false);

  /** Roll a deterministic opponent for this match. The matchId seed
   *  means refresh keeps the same fight; null matchId (pre-deploy)
   *  falls back to a placeholder so the HUD doesn't flicker. */
  const opponent = useMemo(() => rollOpponent(matchId ?? 'preview'), [matchId]);
  const opponentTimeline = useMemo(
    () => buildOpponentTimeline(opponent, matchId ?? 'preview', cur?.duration ?? 180),
    [opponent, matchId, cur?.duration],
  );

  /** Sidebar collapse state — when true, the left HUD panel hides and
   *  the map stretches to the full content width. Persisted to
   *  localStorage so it survives navigation. */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /** Tactical map expand state. Collapsed = corner minimap (240×150);
   *  expanded = overlay covering most of the screen so the player can
   *  precisely place / drag a pin. Not persisted — re-collapses on
   *  page navigation. */
  const [mapExpanded, setMapExpanded] = useState(false);

  /** Resolved view mode after considering both the persisted user
   *  preference (playViewMode) and the default (Street View when the
   *  API key is present). Starts false on SSR/first paint to avoid
   *  hydration mismatch; useEffect flips to the right value once
   *  settings have rehydrated. */
  const [useStreetView, setUseStreetView] = useState(false);
  useEffect(() => {
    if (playViewMode === 'streetview') setUseStreetView(true);
    else if (playViewMode === 'map') setUseStreetView(false);
    else setUseStreetView(HAS_STREET_VIEW_KEY); // null → follow default
  }, [playViewMode]);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem('coin-hunter.play.sidebarCollapsed');
      if (v === '1') setSidebarCollapsed(true);
    } catch {
      /* private mode / SSR — ignore */
    }
  }, []);
  const toggleSidebar = () => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(
          'coin-hunter.play.sidebarCollapsed',
          next ? '1' : '0',
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  /** Track Zustand persist rehydration. Default false so SSR/prerender
   *  (where `useGameStore.persist` is undefined) doesn't crash. On
   *  client mount we check hasHydrated() immediately; if true we flip
   *  state to true, otherwise we subscribe to onFinishHydration. This
   *  prevents the prod-build race where the guard below saw the
   *  initial null match before persist rehydrated and bounced the
   *  user back to lobby. Dev builds were slow enough to hide the bug. */
  const [storeHydrated, setStoreHydrated] = useState(false);
  useEffect(() => {
    const persist = useGameStore.persist;
    if (!persist) return;
    if (persist.hasHydrated()) {
      setStoreHydrated(true);
      return;
    }
    const unsub = persist.onFinishHydration(() => setStoreHydrated(true));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!storeHydrated) return;
    if (!matchId || !cur) {
      router.push('/');
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [storeHydrated, matchId, cur, router]);

  // LIVE_FEED auto-updates via the same `now` tick — opponent events
  // come from the timeline so no separate rotation interval needed.

  // Esc collapses the expanded tactical map — matches the modal
  // dismissal pattern used elsewhere (Modal component, TopBar menu).
  useEffect(() => {
    if (!mapExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMapExpanded(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mapExpanded]);

  const totalSeconds = cur?.duration ?? 180;
  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = Math.max(0, totalSeconds - elapsed);

  useEffect(() => {
    if (remaining !== 0 || !cur) return;
    if (!cur.pinPosition) {
      setPin(13.7563, 100.5018);
      return;
    }
    onSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, cur?.pinPosition]);

  const visibleClues = cur ? cur.location.clues.slice(0, 1 + cur.hintsUsed) : [];

  // Player score badge = run total so far (sum of completed missions
  // in the current match). 0 on round 1.
  const runScoreSoFar = useMemo(
    () => missions.reduce((sum, m) => sum + (m.score ?? 0), 0),
    [missions],
  );
  // Opponent score = cumulative deltas from the timeline up to now.
  // Reads as believable bursts in the HUD instead of a linear drift.
  const elapsedSec = Math.floor((now - startedAt) / 1000);
  const opponentScore = useMemo(
    () => opponentScoreAt(opponentTimeline, elapsedSec),
    [opponentTimeline, elapsedSec],
  );
  const liveFeed: OpponentEvent[] = useMemo(
    () => recentOpponentEvents(opponentTimeline, elapsedSec, 4),
    [opponentTimeline, elapsedSec],
  );

  // While the persisted match state is still rehydrating, render a
  // simple loader instead of redirecting. Once hydration finishes
  // the guard above either keeps us here (match present) or routes
  // back to lobby.
  if (!storeHydrated) {
    return (
      <main className="cyber-screen min-h-screen flex items-center justify-center">
        <div className="font-mono text-cyber-cyan text-[12px] tracking-widest2">
          ▸ INIT_GRID...
        </div>
      </main>
    );
  }
  if (!cur) return null;

  const onSubmit = () => {
    if (!cur.pinPosition) {
      toast.warn('▸ NO_TARGET // ปักหมุดบนแผนที่ก่อน');
      return;
    }
    const dist = distanceMeters(
      cur.pinPosition.lat,
      cur.pinPosition.lng,
      cur.location.lat,
      cur.location.lng,
    );
    const band = scoreFromDistance(dist);
    const breakdown = computeTotalScore({
      base: band.base,
      remainingSeconds: remaining,
      totalSeconds,
      hintsUsed: cur.hintsUsed,
      streak: player.streak,
      tribe: player.tribe,
      distanceMeters: dist,
    });
    submitMission({
      score: breakdown.total,
      distance: dist,
      remainingSeconds: remaining,
      breakdown,
    });
    router.push('/result');
  };

  const onHint = () => {
    const ok = useHint();
    if (!ok) {
      const credits = useGameStore.getState().player.credits;
      toast.error(`▸ NEED 50CR // YOU HAVE ${credits.toLocaleString()}CR`);
    }
  };
  const onSkill = () => {
    if (usePetSkill()) {
      setSkillFlash(true);
      setTimeout(() => setSkillFlash(false), 1500);
    } else {
      toast.warn('▸ SKILL_ON_COOLDOWN');
    }
  };
  const onExit = () => {
    exitMatch();
    router.push('/');
  };

  const matchCodename =
    matchId === 'flash'
      ? 'FLASH_LUNCH'
      : matchId === 'classic'
      ? 'CLASSIC_GRID'
      : matchId === 'night'
      ? 'NIGHT_HUNT'
      : matchId === 'raid'
      ? 'RAID_OPEN'
      : 'UNKNOWN';

  return (
    <main className="cyber-screen relative min-h-screen">
      <div className="scanline-overlay" />

      <div className="relative z-10 p-3 sm:p-4 flex flex-col gap-3 min-h-screen">
        {/* ─── TOP BAR ─── toggle | HUNT_MODE | CONTRACT | spacer | TIMER | EXIT */}
        <div className="hud flex items-center gap-3 px-4 py-2.5 flex-wrap">
          {/* Sidebar collapse toggle — chevron flips depending on state.
              Visible only on lg+ where the sidebar actually takes a
              dedicated column; on mobile the sidebar stacks below the
              map and there's nothing to collapse. */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar — expand map'}
            aria-label="Toggle sidebar"
            className="hidden lg:flex w-8 h-8 items-center justify-center text-cyber-cyan hover:bg-cyber-cyan/15 transition shrink-0"
            style={{
              background: 'rgba(34,211,238,0.05)',
              border: '1px solid rgba(34,211,238,0.35)',
              clipPath:
                'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {sidebarCollapsed ? (
                <path d="M9 6l6 6-6 6" />
              ) : (
                <path d="M15 6l-6 6 6 6" />
              )}
            </svg>
          </button>

          {/* HUNT_MODE pill — purely informational, no longer an
              interactive button (clicking it just toasted, which was
              noise). Combined with the CONTRACT label so the strip
              reads as one piece of state. */}
          <div
            className="inline-flex items-center gap-2 px-2.5 py-1 font-display font-bold text-[10px] sm:text-[11px] tracking-widest2"
            style={{
              background: 'rgba(167,139,250,0.10)',
              border: '1px solid rgba(167,139,250,0.45)',
              color: 'var(--cy-violet)',
              clipPath:
                'polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-violet animate-pulse-dot" />
            HUNT_MODE
          </div>
          <div className="font-display text-[12px] sm:text-[13px] text-cyber-cyan font-bold tracking-cyber truncate">
            {matchCodename} · {String(idx + 1).padStart(2, '0')}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 font-mono">
            <span className="hidden sm:inline text-cyber-cyan/65 text-[10px] tracking-widest2">// TIMER</span>
            <span
              className="font-display text-cyber-cyan text-[18px] sm:text-[22px] font-bold tabular-nums"
              style={{ textShadow: '0 0 12px rgba(34,211,238,0.6)' }}
            >
              {formatTime(remaining)}
            </span>
          </div>
          <button
            type="button"
            className="btn-ghost !py-1.5 !px-3 !text-[11px]"
            onClick={onExit}
          >
            // EXIT
          </button>
        </div>

        {/* ─── MAIN — left sidebar + center street view. Grid swaps to
            single-column when sidebar is collapsed so the map fills
            the row. Mobile (below lg) always stacks. */}
        <div
          className={`grid gap-3 flex-1 min-h-0 pb-20 lg:pb-0 ${
            sidebarCollapsed ? 'lg:grid-cols-[1fr]' : 'lg:grid-cols-[280px_1fr]'
          }`}
        >
          {/* ─── LEFT SIDEBAR — fully hidden when collapsed ─── */}
          <div
            className={`flex-col gap-3 order-2 lg:order-1 ${
              sidebarCollapsed ? 'hidden' : 'flex'
            }`}
          >
            {/* INTEL_BRIEFING */}
            <div className="hud v p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 bg-cyber-violet rounded-full animate-pulse-dot" />
                <span className="font-display text-[10px] text-cyber-violet font-bold tracking-cyber">
                  INTEL_BRIEFING
                </span>
                <span className="flex-1" />
                <span className="font-mono text-[9px] text-white/45">
                  {visibleClues.length}/{cur.location.clues.length}
                </span>
              </div>
              {visibleClues.map((c, i) => (
                <div
                  key={i}
                  className="px-2.5 py-2 mb-1.5"
                  style={{
                    background: 'rgba(167,139,250,0.08)',
                    borderLeft: '2px solid #A78BFA',
                  }}
                >
                  <div className="font-mono text-[8px] text-cyber-violet mb-0.5">
                    ▸ CLUE_0{i + 1}_DECRYPTED
                  </div>
                  <div className="text-[11px] leading-[1.5]">{c}</div>
                </div>
              ))}
              {visibleClues.length < cur.location.clues.length && (
                <button
                  onClick={onHint}
                  className="w-full px-2 py-2 mt-1 text-center font-mono text-[9px] text-cyber-violet/70 hover:text-cyber-violet transition"
                  style={{
                    background: 'rgba(0,0,0,.4)',
                    border: '1px dashed rgba(167,139,250,.35)',
                  }}
                >
                  ▸ CLUE_0{visibleClues.length + 1}_LOCKED · {testMode ? 'FREE [∞ TEST]' : 'COST 50CR'}
                </button>
              )}
            </div>

            {/* PIN_ENERGY + COMPANION_SKILL — compacted into a single
                 HUD card. Top half is the energy bar, bottom is the
                 pet skill trigger. Halves the sidebar's vertical
                 footprint vs the two separate cards we shipped first. */}
            <div className="hud p-3">
              {/* Energy half */}
              <div className="flex items-center mb-1.5">
                <span className="font-mono text-[9px] text-cyber-cyan/70 tracking-cyber">
                  ⚡ PIN_ENERGY
                </span>
                <span className="flex-1" />
                <span className="font-mono text-[10px] text-cyber-cyan tabular-nums">
                  {pinEnergy} / 20
                </span>
              </div>
              <Bar value={pinEnergy} max={20} height={3} />
              <div className="font-mono text-[8px] text-white/35 mt-1">
                ▸ DRAG = -1 / 100M
              </div>

              {/* Divider */}
              <div className="h-px my-2.5 bg-white/10" />

              {/* Companion skill half — tap to use */}
              <button
                type="button"
                onClick={onSkill}
                disabled={!petSkillReady()}
                className="w-full flex items-center gap-2 text-left transition hover:bg-cyber-cyan/5 disabled:opacity-50 disabled:cursor-not-allowed -mx-1 px-1 py-0.5"
              >
                <span className="text-[16px] leading-none shrink-0">{petMeta.emoji}</span>
                <span className="font-display text-[11px] text-cyber-cyan font-bold tracking-cyber truncate">
                  {pet.skill.name}
                </span>
                <span className="flex-1" />
                <span className="font-mono text-[9px] text-cyber-gold shrink-0">
                  {pet.skill.cooldown}s CD
                </span>
              </button>
            </div>

            {/* LIVE_FEED — pulls from the opponent timeline so the
                player sees their rival's actions in real time. Empty
                state shows opponent name as the only live entry. */}
            <div className="hud g p-3">
              <div className="flex items-center mb-2">
                <span className="dl text-cyber-gold/70">// LIVE_FEED</span>
                <span className="flex-1" />
                <span className="font-mono text-[8px] text-white/40 tracking-cyber">
                  vs {opponent.tribeEmoji} {opponent.skill.toUpperCase()}
                </span>
              </div>
              <ul className="flex flex-col gap-1 font-mono text-[10px] min-h-[60px]">
                {liveFeed.length === 0 ? (
                  <li className="flex items-center gap-1.5 text-white/40">
                    <span className="text-cyber-gold/70">▸</span>
                    {opponent.name} preparing...
                  </li>
                ) : (
                  liveFeed.map((ev, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-cyber-gold/70">▸</span>
                      <span className="text-white/85 flex-1 truncate">{ev.text}</span>
                      <span className="text-white/35 text-[8px] tabular-nums">
                        {ev.at}s
                      </span>
                    </li>
                  ))
                )}
                <li className="flex items-center gap-1.5 mt-1 pt-1 border-t border-white/10">
                  <span className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse-dot" />
                  <span className="text-cyber-green text-[9px]">
                    2,841 agents live
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* ─── CENTER — street view stage with HUD overlays ─── */}
          <div
            className="relative min-h-[440px] lg:min-h-0 order-1 lg:order-2 overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(5,3,10,0.4) 0%, transparent 14%, transparent 80%, rgba(5,3,10,0.6) 100%)',
              border: '1px solid rgba(34,211,238,0.35)',
            }}
          >
            {/* STREET VIEW or MAP view. Default: Street View when the
                API key is present. User can flip back to MapLibre via
                the toggle pill below if Street View is blocked /
                blank / their key's referrer restrictions exclude this
                host. */}
            {useStreetView ? (
              <StreetViewWalker
                initialLat={cur.location.lat}
                initialLng={cur.location.lng}
                initialHeading={0}
              />
            ) : (
              <div className="absolute inset-0">
                <GameMap />
              </div>
            )}

            {/* View-mode toggle — top-left, above stage label. Clicking
                swaps between Street View and the top-down MapLibre
                map. Disabled (greyed) when there's no API key at all,
                since there's nothing to toggle to. */}
            {HAS_STREET_VIEW_KEY && (
              <button
                type="button"
                onClick={() => {
                  // Persist the user's pick — survives refresh + nav.
                  setPlayViewMode(useStreetView ? 'map' : 'streetview');
                }}
                title={
                  useStreetView
                    ? 'Switch to top-down map (if Street View is blank)'
                    : 'Switch back to Street View'
                }
                className="absolute top-10 left-3.5 z-[6] flex items-center gap-1.5 px-3 py-1 font-display font-bold text-[10px] tracking-cyber transition hover:bg-cyber-cyan/15 cursor-pointer"
                style={{
                  background: useStreetView
                    ? 'rgba(34,211,238,0.10)'
                    : 'rgba(251,191,36,0.10)',
                  border: `1px solid ${useStreetView ? 'rgba(34,211,238,0.55)' : 'rgba(251,191,36,0.55)'}`,
                  color: useStreetView ? 'var(--cy-cyan)' : 'var(--cy-gold)',
                  clipPath:
                    'polygon(7px 0, calc(100% - 7px) 0, 100% 50%, calc(100% - 7px) 100%, 7px 100%, 0 50%)',
                  boxShadow: useStreetView
                    ? '0 0 10px rgba(34,211,238,0.3)'
                    : '0 0 10px rgba(251,191,36,0.3)',
                }}
              >
                {useStreetView ? '▸ STREET_VIEW' : '▸ MAP_VIEW'}
                <span className="text-[9px] opacity-70">[ swap ]</span>
              </button>
            )}

            {/* Skill flash overlay */}
            {skillFlash && (
              <div className="absolute inset-0 z-[10] pointer-events-none flex items-center justify-center">
                <div className="font-display text-cyber-cyan text-xl tracking-cyber animate-pulse-dot">
                  ▸ {pet.skill.name} DEPLOYED
                </div>
              </div>
            )}

            {/* PLAYER SCORE BADGE — top-left */}
            <PlayerScoreBadge
              side="left"
              tribeEmoji={tribe.emoji}
              name={player.nickname.toUpperCase().replace(/ /g, '_')}
              score={runScoreSoFar}
              accent="cyan"
            />

            {/* OPPONENT SCORE BADGE — top-right. Uses the rolled
                opponent's name + tribe so the player sees a different
                rival each match. */}
            <PlayerScoreBadge
              side="right"
              tribeEmoji={opponent.tribeEmoji}
              name={opponent.name}
              score={opponentScore}
              accent="red"
            />

            {/* Zoom / pan tools dropped — they were stubs that just
                toasted RESERVED and added visual noise. Real
                navigation is via Street View's native chrome and
                MapLibre's NavigationControl. */}

            {/* TACTICAL_MAP minimap. Collapsed = corner inset.
                Expanded = full-screen overlay with backdrop.
                Hidden on mobile (sticky LOCK bar handles fire there). */}
            <TacticalMapCard
              onGuess={onSubmit}
              hasPin={!!cur.pinPosition}
              pinCoords={cur.pinPosition}
              expanded={mapExpanded}
              onExpand={() => setMapExpanded(true)}
              onCollapse={() => setMapExpanded(false)}
            />
          </div>
        </div>
      </div>

      {/* Sticky mobile fire bar. Mobile users can't see the corner
          TacticalMap (it's lg+ only) so we add a MAP button that
          opens the expand-overlay full-screen — that's where they
          place their pin. Pin status shows "▸ READY" / "▸ NO PIN"
          inline so they know whether LOCK_TARGET will work. */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch gap-2 px-2 py-2 backdrop-blur-md"
        style={{
          background: 'rgba(5,3,10,0.92)',
          borderTop: '1px solid rgba(253,24,3,0.45)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.6)',
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex flex-col leading-tight justify-center">
          <span className="font-mono text-[9px] text-cyber-gold/70 tracking-cyber">▸ TIME</span>
          <span className="font-display text-cyber-gold text-lg font-bold tabular-nums">
            {formatTime(remaining)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMapExpanded(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-3 cursor-pointer transition hover:bg-cyber-cyan/15"
          style={{
            background: cur.pinPosition
              ? 'rgba(74,222,128,0.10)'
              : 'rgba(34,211,238,0.10)',
            border: `1px solid ${cur.pinPosition ? 'rgba(74,222,128,0.55)' : 'rgba(34,211,238,0.55)'}`,
            clipPath:
              'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)',
            color: cur.pinPosition ? 'var(--cy-green)' : 'var(--cy-cyan)',
          }}
          aria-label="Open tactical map"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 20l-5.5-2.5V4L9 6.5 15 4l6 2.5v13.5L15 17z" />
            <line x1="9" y1="6.5" x2="9" y2="20" />
            <line x1="15" y1="4" x2="15" y2="17" />
          </svg>
          <span className="font-display font-bold text-[9px] tracking-cyber">
            {cur.pinPosition ? 'READY' : 'PIN'}
          </span>
        </button>
        <Button
          variant="red"
          onClick={onSubmit}
          disabled={!cur.pinPosition}
          className="!py-2.5 !px-4 !text-[12px] !flex-1 !flex !items-center !justify-center disabled:!opacity-50"
        >
          ▸ LOCK_TARGET // FIRE
        </Button>
      </div>
    </main>
  );
}

/* ─── Inline HUD components ─── */

interface BadgeProps {
  side: 'left' | 'right';
  tribeEmoji: string;
  name: string;
  score: number;
  accent: 'cyan' | 'red';
}

function PlayerScoreBadge({ side, tribeEmoji, name, score, accent }: BadgeProps) {
  const colour = accent === 'cyan' ? '#22D3EE' : '#FD1803';
  const glow = accent === 'cyan' ? 'rgba(34,211,238,0.45)' : 'rgba(253,24,3,0.45)';
  return (
    <div
      className="absolute z-[6] flex items-center gap-2 px-3 py-1.5"
      style={{
        top: 12,
        [side]: 12,
        background: 'rgba(5,3,10,0.85)',
        border: `1px solid ${glow}`,
        clipPath:
          'polygon(7px 0, calc(100% - 7px) 0, 100% 50%, calc(100% - 7px) 100%, 7px 100%, 0 50%)',
        boxShadow: `0 0 12px ${glow}`,
        backdropFilter: 'blur(6px)',
        flexDirection: side === 'right' ? 'row-reverse' : 'row',
      }}
    >
      <span
        className="flex items-center justify-center text-[14px]"
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: `${colour}33`,
          border: `1px solid ${glow}`,
        }}
      >
        {tribeEmoji}
      </span>
      <span
        className="font-display text-[11px] font-bold tracking-cyber"
        style={{ color: colour }}
      >
        {name}
      </span>
      <span className="font-mono text-[10px] text-white/60 tabular-nums">
        SCORE {score.toLocaleString()}
      </span>
    </div>
  );
}

interface TacticalMapProps {
  onGuess: () => void;
  hasPin: boolean;
  pinCoords?: { lat: number; lng: number };
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

/** TacticalMapCard — two modes:
 *
 *  COLLAPSED — slim 240×150 inset at the lower-right corner of the
 *    /play stage. Click the header or hit the expand icon to grow.
 *
 *  EXPANDED — full-overlay above the street view with a dark backdrop,
 *    Esc / X / backdrop-click dismiss, large GUESS button. Designed so
 *    the player can place a pin precisely without squinting.
 *
 *  The single underlying <GameMap /> instance is wrapped in
 *  ResizeObserver inside the GameMap component so MapLibre's canvas
 *  reflows automatically on every box change. */
function TacticalMapCard({
  onGuess,
  hasPin,
  pinCoords,
  expanded,
  onExpand,
  onCollapse,
}: TacticalMapProps) {
  const coordsLabel = pinCoords
    ? `${pinCoords.lat.toFixed(2)}°N · ${pinCoords.lng.toFixed(2)}°E`
    : '13.74°N · 100.56°E';

  if (expanded) {
    // OVERLAY MODE — covers most of the play stage on desktop
    // (absolute, scoped to the parent), or the entire viewport on
    // mobile (fixed). Mobile users don't have a corner minimap so the
    // overlay is their only way to place a pin; making it full-screen
    // means thumbs reach the whole map.
    return (
      <>
        <div
          aria-hidden
          onClick={onCollapse}
          className="fixed lg:absolute inset-0 z-[55] lg:z-[15] backdrop-blur-sm"
          style={{ background: 'rgba(5,3,10,0.78)' }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tactical map"
          className="fixed lg:absolute z-[56] lg:z-[16] flex flex-col"
          style={{
            top: 'env(safe-area-inset-top, 5%)',
            left: '2%',
            right: '2%',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
            background: 'rgba(5,3,10,0.96)',
            border: '1px solid rgba(34,211,238,0.7)',
            clipPath:
              'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)',
            boxShadow:
              '0 0 36px rgba(34,211,238,0.45), 0 0 80px rgba(167,139,250,0.25)',
          }}
        >
          {/* Header — title + coords + close */}
          <div className="flex items-center px-4 py-2.5 border-b border-cyber-cyan/30 shrink-0">
            <span className="font-mono text-[11px] text-cyber-cyan tracking-widest2 flex items-center">
              <span className="inline-block w-1.5 h-1.5 bg-cyber-cyan rounded-full mr-2 animate-pulse-dot" />
              TACTICAL_MAP // EXPANDED
            </span>
            <span className="flex-1" />
            <span className="font-mono text-[10px] text-white/65 tabular-nums mr-3 hidden sm:inline">
              {coordsLabel}
            </span>
            <button
              type="button"
              onClick={onCollapse}
              title="Close (Esc)"
              aria-label="Close map"
              className="w-7 h-7 flex items-center justify-center text-cyber-cyan hover:bg-cyber-cyan/15 transition"
              style={{
                background: 'rgba(34,211,238,0.05)',
                border: '1px solid rgba(34,211,238,0.4)',
                clipPath: 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>

          {/* Map canvas — flex-1 so it grabs all remaining vertical space */}
          <div className="relative flex-1 min-h-0">
            <GameMap />
            {/* Instruction overlay — shown until the player drops a pin
                so they know what to do. Auto-clears once hasPin. */}
            {!hasPin && (
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 font-mono text-[11px] text-cyber-cyan tracking-widest2 pointer-events-none"
                style={{
                  background: 'rgba(5,3,10,0.85)',
                  border: '1px solid rgba(34,211,238,0.45)',
                  clipPath:
                    'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
                  boxShadow: '0 0 14px rgba(34,211,238,0.3)',
                }}
              >
                ▸ CLICK ON THE MAP TO DROP A PIN
              </div>
            )}
          </div>

          {/* Footer — status + GUESS button (big in this mode) */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-t border-cyber-cyan/30 shrink-0">
            <span className="font-mono text-[11px] text-white/65 tabular-nums sm:hidden">
              {coordsLabel}
            </span>
            <span
              className="font-mono text-[11px] tracking-widest2"
              style={{
                color: hasPin ? 'var(--cy-green)' : 'rgba(255,255,255,0.5)',
              }}
            >
              ▸ {hasPin ? 'PIN_LOCKED · READY_TO_FIRE' : 'CLICK MAP TO PLACE PIN'}
            </span>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => {
                onCollapse();
                onGuess();
              }}
              disabled={!hasPin}
              className="btn-red !py-2.5 !px-6 !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ▸ LOCK_TARGET // FIRE
            </button>
          </div>
        </div>
      </>
    );
  }

  // COLLAPSED MODE — corner inset. Hidden on mobile because the sticky
  // bottom LOCK bar handles guessing there.
  return (
    <div
      className="hidden lg:flex absolute bottom-3 right-3 z-[6] flex-col"
      style={{
        width: 240,
        background: 'rgba(5,3,10,0.92)',
        border: '1px solid rgba(34,211,238,0.55)',
        clipPath:
          'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
        boxShadow: '0 0 18px rgba(34,211,238,0.35), 0 8px 22px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header — full-width clickable to open the expanded view. */}
      <button
        type="button"
        onClick={onExpand}
        title="Expand map (click) — easier pin placement"
        className="flex items-center px-2.5 py-1.5 border-b border-cyber-cyan/20 cursor-pointer hover:bg-cyber-cyan/10 transition text-left"
        style={{ background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
      >
        <span className="font-mono text-[9px] text-cyber-cyan tracking-widest2">
          <span className="inline-block w-1.5 h-1.5 bg-cyber-cyan rounded-full mr-1.5 align-middle animate-pulse-dot" />
          TACTICAL_MAP
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[8px] text-white/55 tabular-nums">
          {coordsLabel}
        </span>
      </button>

      <div className="relative h-[150px]">
        <GameMap />

        {/* Floating EXPAND button — sits in the top-right corner of the
            map canvas itself so it's visible regardless of where the
            user's eye lands. Pulses gently on hover. Click bubbling is
            stopped so we don't double-fire onto the underlying map
            (which has its own click-to-pin handler). */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          title="Expand map for precision pin placement"
          aria-label="Expand map"
          className="absolute top-1.5 right-1.5 z-[5] w-9 h-9 flex items-center justify-center text-cyber-cyan font-display text-[10px] tracking-cyber hover:bg-cyber-cyan/25 hover:scale-105 transition"
          style={{
            background: 'rgba(5,3,10,0.85)',
            border: '1.5px solid rgba(34,211,238,0.7)',
            clipPath:
              'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
            boxShadow: '0 0 12px rgba(34,211,238,0.55)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>

        {/* Hint chip dropped — the floating EXPAND button is a strong
            enough affordance on its own once the minimap has a
            character. */}
      </div>

      <div className="flex items-stretch px-2 py-1.5 gap-2 border-t border-cyber-cyan/20">
        <span className="font-mono text-[9px] text-white/45 self-center flex-1">
          ▸ {hasPin ? 'PIN_LOCKED' : 'CLICK TO PIN'}
        </span>
        <button
          type="button"
          onClick={onGuess}
          disabled={!hasPin}
          className="btn-red !py-1 !px-3 !text-[10px] disabled:opacity-50"
        >
          ▸ GUESS
        </button>
      </div>
    </div>
  );
}
