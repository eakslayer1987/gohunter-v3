'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import Bar from '@/components/ui/Bar';
import { StreetViewWalker } from '@/components/game/StreetViewWalker';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import {
  distanceMeters,
  scoreFromDistance,
  computeTotalScore,
  formatTime,
} from '@/lib/utils';
import { getTribe } from '@/data/tribes';
import { getPetStageMeta } from '@/data/pets';

const HAS_STREET_VIEW = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const GameMap = dynamic(() => import('@/components/game/GameMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center font-mono text-cyber-cyan text-[10px]">
      ▸ INIT_GRID...
    </div>
  ),
});

// Fake opponent for multiplayer-style HUD ambience — replace with real
// player feed when the BE catches up. Stable values + a slow score
// drift so the HUD reads "live".
const OPPONENT_NAME = 'NeonHunter88';
const OPPONENT_BASE_SCORE = 6000;

// Static seed for LIVE_FEED — cycles 3 events to give the sidebar a
// sense of activity without needing a real BE feed.
const FEED_EVENTS: Array<{ name: string; verb: string; value: string }> = [
  { name: 'NeonHunter88', verb: 'locked', value: '+940' },
  { name: 'CoinSamurai', verb: 'locked', value: '+720' },
  { name: 'BangkokRiver', verb: 'deployed', value: 'CLASSIC_GRID' },
  { name: 'SiamGhost', verb: 'locked', value: '+1,120' },
  { name: 'GoldenTuk', verb: 'aborted', value: 'NIGHT_HUNT' },
];

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

  const cur = missions[idx];
  const tribe = getTribe(player.tribe);
  const petMeta = getPetStageMeta(pet.stage);

  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [skillFlash, setSkillFlash] = useState(false);
  const [feedIdx, setFeedIdx] = useState(0);

  useEffect(() => {
    if (!matchId || !cur) {
      router.push('/');
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [matchId, cur, router]);

  // LIVE_FEED rotates through fake events every 4s.
  useEffect(() => {
    const id = setInterval(
      () => setFeedIdx((n) => (n + 1) % FEED_EVENTS.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

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
  // Opponent slowly drifts up by a few points per tick — pure flavour.
  const opponentScore =
    OPPONENT_BASE_SCORE + Math.floor((now - startedAt) / 1000) * 3;

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

  const onHint = () => useHint();
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
        {/* ─── TOP BAR ─── HUNT_MODE | CONTRACT | spacer | TIMER | EXIT */}
        <div className="hud flex items-center gap-3 px-4 py-2.5 flex-wrap">
          <button
            type="button"
            className="btn-ghost !py-1.5 !px-3 !text-[11px]"
            onClick={() => toast.info('▸ HUNT_MODE_ACTIVE')}
          >
            ▸ HUNT_MODE
          </button>
          <div className="font-display text-[12px] sm:text-[13px] text-cyber-cyan font-bold tracking-cyber">
            CONTRACT_{String(idx + 1).padStart(2, '0')} · {matchCodename}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 font-mono">
            <span className="text-cyber-cyan/65 text-[10px] tracking-widest2">// TIMER</span>
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

        {/* ─── MAIN — left sidebar + center street view ─── */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-3 flex-1 min-h-0 pb-20 lg:pb-0">
          {/* ─── LEFT SIDEBAR ─── */}
          <div className="flex flex-col gap-3 order-2 lg:order-1">
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
                  ▸ CLUE_0{visibleClues.length + 1}_LOCKED · COST 50CR
                </button>
              )}
            </div>

            {/* PIN_ENERGY_RESERVE */}
            <div className="hud p-3">
              <div className="flex items-center mb-2">
                <span className="dl">// PIN_ENERGY_RESERVE</span>
                <span className="flex-1" />
                <span className="font-mono text-[10px] text-cyber-cyan tabular-nums">
                  {pinEnergy} / 20
                </span>
              </div>
              <Bar value={pinEnergy} max={20} height={4} />
              <div className="font-mono text-[9px] text-white/45 mt-1.5">
                ▸ DRAG = -1 / 100M
              </div>
            </div>

            {/* COMPANION_SKILL */}
            <button
              type="button"
              onClick={onSkill}
              disabled={!petSkillReady()}
              className="hud p-3 text-left transition hover:bg-cyber-cyan/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="dl mb-2">// COMPANION_SKILL</div>
              <div className="flex items-center gap-2">
                <span className="text-[18px]">{petMeta.emoji}</span>
                <span className="font-display text-[12px] text-cyber-cyan font-bold tracking-cyber">
                  {pet.skill.name}
                </span>
                <span className="flex-1" />
                <span className="font-mono text-[10px] text-cyber-gold">
                  · {pet.skill.cooldown}s CD
                </span>
              </div>
            </button>

            {/* LIVE_FEED */}
            <div className="hud g p-3">
              <div className="dl mb-2 text-cyber-gold/70">// LIVE_FEED</div>
              <ul className="flex flex-col gap-1 font-mono text-[10px]">
                {[0, 1, 2].map((offset) => {
                  const ev = FEED_EVENTS[(feedIdx + offset) % FEED_EVENTS.length];
                  return (
                    <li key={offset} className="flex items-center gap-1.5">
                      <span className="text-cyber-gold/70">▸</span>
                      <span className="text-cyber-cyan">{ev.name}</span>
                      <span className="text-white/55">{ev.verb}</span>
                      <span className="text-cyber-gold">{ev.value}</span>
                    </li>
                  );
                })}
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
            {/* TOP_LABEL — // STREET_VIEW_FEED ... */}
            <div className="absolute top-2.5 left-3.5 z-[6] font-mono text-[10px] text-cyber-cyan/75 tracking-widest2 pointer-events-none">
              // STREET_VIEW_FEED · BANGKOK.GRID · MISSION_{String(idx + 1).padStart(2, '0')}
            </div>

            {/* STREET VIEW or fallback MAP */}
            {HAS_STREET_VIEW ? (
              <StreetViewWalker
                initialLat={cur.location.lat}
                initialLng={cur.location.lng}
                initialHeading={0}
              />
            ) : (
              <div className="absolute inset-0">
                <GameMap />
                <div className="absolute top-10 left-3.5 z-[5]">
                  <Pill variant="gold">▸ FALLBACK_MAP</Pill>
                </div>
              </div>
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

            {/* OPPONENT SCORE BADGE — top-right */}
            <PlayerScoreBadge
              side="right"
              tribeEmoji="🦈"
              name={OPPONENT_NAME}
              score={opponentScore}
              accent="red"
            />

            {/* ZOOM TOOLS — bottom-left vertical cluster */}
            <div className="hidden sm:flex absolute bottom-3 left-3 z-[6] flex-col gap-1">
              <ToolButton label="+" title="Zoom in (stub)" onClick={() => toast.info('▸ ZOOM_IN // RESERVED')} />
              <ToolButton label="−" title="Zoom out (stub)" onClick={() => toast.info('▸ ZOOM_OUT // RESERVED')} />
              <ToolButton label="↺" title="Recenter (stub)" onClick={() => toast.info('▸ RECENTER // RESERVED')} />
              <ToolButton label="⚑" title="Drop marker (stub)" onClick={() => toast.info('▸ MARKER // RESERVED')} />
            </div>

            {/* TACTICAL_MAP minimap — bottom-right (lg+; hidden on mobile
                because the sticky LOCK bar handles fire there) */}
            <div className="hidden lg:flex absolute bottom-3 right-3 z-[6] flex-col">
              <TacticalMapCard
                onGuess={onSubmit}
                hasPin={!!cur.pinPosition}
                pinCoords={cur.pinPosition}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile fire bar — same as before */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2 px-3 py-2 backdrop-blur-md"
        style={{
          background: 'rgba(5,3,10,0.92)',
          borderTop: '1px solid rgba(253,24,3,0.45)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex flex-col leading-tight">
          <span className="font-mono text-[9px] text-cyber-gold/70 tracking-cyber">▸ TIME</span>
          <span className="font-display text-cyber-gold text-lg font-bold tabular-nums">
            {formatTime(remaining)}
          </span>
        </div>
        <div className="flex-1" />
        <Button variant="red" onClick={onSubmit} className="!py-2.5 !px-5 !text-[12px]">
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

function ToolButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-9 h-9 flex items-center justify-center text-cyber-cyan font-display text-[14px] hover:bg-cyber-cyan/15 transition"
      style={{
        background: 'rgba(5,3,10,0.85)',
        border: '1px solid rgba(34,211,238,0.4)',
        clipPath:
          'polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)',
      }}
    >
      {label}
    </button>
  );
}

interface TacticalMapProps {
  onGuess: () => void;
  hasPin: boolean;
  pinCoords?: { lat: number; lng: number };
}

function TacticalMapCard({ onGuess, hasPin, pinCoords }: TacticalMapProps) {
  return (
    <div
      className="flex flex-col"
      style={{
        width: 300,
        background: 'rgba(5,3,10,0.92)',
        border: '1px solid rgba(34,211,238,0.55)',
        clipPath:
          'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
        boxShadow: '0 0 18px rgba(34,211,238,0.35), 0 8px 22px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center px-3 py-1.5 border-b border-cyber-cyan/20">
        <span className="font-mono text-[10px] text-cyber-cyan tracking-widest2">
          <span className="inline-block w-1.5 h-1.5 bg-cyber-cyan rounded-full mr-1.5 align-middle animate-pulse-dot" />
          TACTICAL_MAP
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[9px] text-white/55 tabular-nums">
          {pinCoords
            ? `${pinCoords.lat.toFixed(2)}°N · ${pinCoords.lng.toFixed(2)}°E`
            : '13.74°N · 100.56°E'}
        </span>
      </div>
      <div className="relative h-[180px]">
        <GameMap />
      </div>
      <div className="flex items-stretch px-2 py-1.5 gap-2 border-t border-cyber-cyan/20">
        <span className="font-mono text-[9px] text-white/45 self-center flex-1">
          ▸ {hasPin ? 'PIN_LOCKED' : 'CLICK TO PLACE PIN'}
        </span>
        <button
          type="button"
          onClick={onGuess}
          disabled={!hasPin}
          className="btn-red !py-1.5 !px-4 !text-[11px] disabled:opacity-50"
        >
          ▸ GUESS
        </button>
      </div>
    </div>
  );
}
