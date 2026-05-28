'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import HudCard from '@/components/ui/HudCard';
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

// Detected once at module load — switching modes mid-session would
// require a restart anyway (env vars only re-read on dev server boot).
const HAS_STREET_VIEW = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Pin-placement map. In street view mode it's a small left panel
// (player pins on top-down while exploring street view). In fallback
// mode it's the dominant center surface — same instance, the cyber pin
// + 500m ring + click-to-set semantics work in both layouts.
const GameMap = dynamic(() => import('@/components/game/GameMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center font-mono text-cyber-cyan text-[10px]">
      ▸ INIT_GRID...
    </div>
  ),
});

export default function PlayPage() {
  const router = useRouter();
  const matchId = useGameStore((s) => s.currentMatchId);
  const missions = useGameStore((s) => s.missionsInMatch);
  const idx = useGameStore((s) => s.currentMissionIndex);
  const player = useGameStore((s) => s.player);
  const pinEnergy = useGameStore((s) => s.pinEnergy);
  const useHint = useGameStore((s) => s.useHint);
  const extendTime = useGameStore((s) => s.extendTime);
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
  // Auto-expand intel in fallback mode — without street view, clues
  // are the primary signal again. With street view, keep collapsed so
  // it doesn't compete for attention with the pano.
  const [intelOpen, setIntelOpen] = useState(!HAS_STREET_VIEW);

  useEffect(() => {
    if (!matchId || !cur) {
      router.push('/');
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [matchId, cur, router]);

  const totalSeconds = cur?.duration ?? 180;
  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = Math.max(0, totalSeconds - elapsed);

  // Auto-submit on time up — fallback pin at Bangkok center if the player
  // never placed one, otherwise /result would bounce back to the lobby.
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
  const onExtend = (s: number) => extendTime(s);
  const onSkill = () => {
    if (usePetSkill()) {
      setSkillFlash(true);
      setTimeout(() => setSkillFlash(false), 1500);
    }
  };

  const skillReady = petSkillReady();

  // Intel card body — shared between LEFT panel (fallback mode) and
  // RIGHT panel (street view mode). Default-open state varies by mode.
  const intelCard = (
    <HudCard accent="violet" className="p-3">
      <button
        type="button"
        onClick={() => setIntelOpen((v) => !v)}
        className="w-full flex items-center gap-2"
      >
        <span className="w-1.5 h-1.5 bg-cyber-violet rounded-full animate-pulse-dot" />
        <span className="font-display text-[10px] text-cyber-violet font-bold tracking-cyber">
          INTEL_BRIEFING
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[9px] text-white/50">
          {visibleClues.length}/{cur.location.clues.length} {intelOpen ? '▾' : '▸'}
        </span>
      </button>
      {intelOpen && (
        <div className="mt-2.5">
          {visibleClues.map((c, i) => (
            <div
              key={i}
              className="px-2.5 py-2 mb-1.5"
              style={{
                background: 'rgba(167,139,250,.08)',
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
      )}
    </HudCard>
  );

  const pinEnergyCard = (
    <HudCard className="p-3">
      <div className="dl mb-2">// PIN_ENERGY_RESERVE</div>
      <div className="flex items-center gap-2 mb-1">
        <Bar value={pinEnergy} max={20} className="flex-1" height={6} />
        <span className="font-mono text-[11px] text-cyber-cyan">{pinEnergy} / 20</span>
      </div>
      <div className="font-mono text-[9px] text-white/50">▸ DRAG = -1 / 100M</div>
    </HudCard>
  );

  return (
    <main className="cyber-screen relative min-h-screen">
      <div className="scanline-overlay" />

      <div className="relative z-10 p-3 sm:p-4 flex flex-col gap-3 min-h-screen">
        {/* TOP HUD */}
        <div className="hud flex items-center gap-3 px-4 py-2.5 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => {
              exitMatch();
              router.push('/');
            }}
            className="!py-1.5 !px-3 !text-[11px]"
          >
            ← ABORT
          </Button>
          <div className="dl hidden sm:block">// MISSION_ACTIVE</div>
          <div className="font-display text-[13px] text-cyber-cyan font-bold tracking-cyber">
            CONTRACT {String(idx + 1).padStart(2, '0')} / {String(missions.length).padStart(2, '0')}
          </div>
          {!HAS_STREET_VIEW && (
            <Pill variant="gold" className="!text-[9px]">
              ▸ FALLBACK_MAP
            </Pill>
          )}
          <div className="flex-1" />
          <Pill variant="cyan">⚡ {player.stamina}</Pill>
          <Pill variant="gold">🪙 {player.credits.toLocaleString()}</Pill>
          {player.streak > 0 && <Pill variant="red">🔥 {player.streak}</Pill>}
          <Pill variant="violet">
            {tribe.emoji} {tribe.name}
          </Pill>
        </div>

        {/* MAIN GRID — layout swaps based on whether street view is available.
            Stacks on mobile/tablet, becomes 3-col on lg.
            pb-20 reserves space for the sticky mobile fire bar. */}
        <div className="grid lg:grid-cols-[300px_1fr_280px] gap-3 flex-1 min-h-0 pb-20 lg:pb-0">
          {/* ─── LEFT ─── */}
          <div className="flex flex-col gap-3 order-2 lg:order-1">
            {HAS_STREET_VIEW ? (
              <>
                {/* Street view mode — LEFT is the guess map (mini). */}
                <HudCard accent="cyan" className="relative flex-1 min-h-[280px] lg:min-h-0 overflow-hidden">
                  <div className="absolute top-2.5 left-3.5 z-[5]">
                    <div className="dl">▸ GUESS_MAP // CLICK_TO_PIN</div>
                  </div>
                  <div className="absolute inset-0 z-0">
                    <GameMap />
                  </div>
                  <div className="absolute bottom-2 left-3 right-3 z-[5] font-mono text-[9px] text-cyber-cyan/70">
                    {cur.pinPosition
                      ? `▸ PIN: ${cur.pinPosition.lat.toFixed(4)}, ${cur.pinPosition.lng.toFixed(4)}`
                      : '▸ TAP MAP TO LOCK TARGET'}
                  </div>
                </HudCard>
                {pinEnergyCard}
              </>
            ) : (
              <>
                {/* Fallback mode — no street view, clues are the primary
                    signal so intel takes the LEFT slot pre-expanded. */}
                {intelCard}
                {pinEnergyCard}
              </>
            )}
          </div>

          {/* ─── CENTER ─── */}
          <HudCard className="relative min-h-[420px] lg:min-h-0 order-1 lg:order-2 overflow-hidden p-2">
            {HAS_STREET_VIEW ? (
              <StreetViewWalker
                initialLat={cur.location.lat}
                initialLng={cur.location.lng}
                initialHeading={0}
              />
            ) : (
              <>
                <div className="absolute top-2.5 left-3.5 z-[5]">
                  <div className="dl">▸ BANGKOK_GRID // SECTOR_HUNT</div>
                </div>
                <div className="absolute top-2.5 right-3.5 z-[5] text-right">
                  <div className="font-mono text-[10px] text-cyber-cyan">
                    {cur.pinPosition
                      ? `${cur.pinPosition.lat.toFixed(4)}°N · ${cur.pinPosition.lng.toFixed(4)}°E`
                      : '— · —'}
                  </div>
                </div>
                <div className="absolute inset-0 z-0">
                  <GameMap />
                </div>
                <div className="absolute bottom-2.5 left-3.5 z-[5]">
                  <div className="font-mono text-[10px] text-cyber-cyan/70">
                    ▸ TAP TO LOCK · CLICK AGAIN TO ADJUST (uses energy)
                  </div>
                </div>
              </>
            )}
            {skillFlash && (
              <div className="absolute inset-0 z-[10] pointer-events-none flex items-center justify-center">
                <div className="font-display text-cyber-cyan text-xl tracking-cyber animate-pulse-dot">
                  ▸ {pet.skill.name} DEPLOYED
                </div>
              </div>
            )}
          </HudCard>

          {/* ─── RIGHT: Timer / Skill / [Intel if street view] / Extend / LOCK ─── */}
          <div className="flex flex-col gap-3 order-3">
            <HudCard accent="gold" className="p-4 text-center">
              <div className="font-display text-[10px] text-cyber-gold font-bold tracking-cyber mb-1">
                ▸ TIME_REMAINING
              </div>
              <div className="font-display shimmer-text text-4xl sm:text-[46px] font-extrabold leading-none tabular-nums">
                {formatTime(remaining)}
              </div>
              <Bar
                value={remaining}
                max={totalSeconds}
                className="mt-2.5"
                fillClassName="!bg-gradient-to-r from-cyber-cyan to-cyber-gold"
              />
              <div className="font-mono text-[9px] text-cyber-gold/60 mt-2">
                ▸ EXTENDED: {cur.timeExtensions}x
              </div>
            </HudCard>

            <HudCard accent="violet" className="p-3.5">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="relative w-[38px] h-[38px] shrink-0">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(34,211,238,0.5), transparent 70%)',
                    }}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center text-[22px] animate-hover-float"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.8))' }}
                  >
                    {petMeta.emoji}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-display text-[11px] text-cyber-cyan font-bold tracking-cyber truncate">
                    {pet.skill.name}
                  </div>
                  <div className="font-mono text-[9px] text-white/55 truncate">
                    ▸ {petMeta.stage} · cd {pet.skill.cooldown}s
                  </div>
                </div>
                <div className="flex-1" />
                <Pill variant={skillReady ? 'green' : 'red'}>{skillReady ? 'READY' : 'CD'}</Pill>
              </div>
              <Button
                variant="ghost"
                onClick={onSkill}
                disabled={!skillReady}
                className="w-full !text-center !flex !justify-center"
              >
                ⟶ DEPLOY SKILL
              </Button>
            </HudCard>

            {/* Intel card only on RIGHT in street view mode — fallback
                mode shows it expanded on LEFT instead. */}
            {HAS_STREET_VIEW && intelCard}

            <HudCard className="p-2.5">
              <div className="dl mb-1.5">// EXTEND_TIME</div>
              <div className="grid grid-cols-3 gap-1">
                <Button variant="ghost" onClick={() => onExtend(30)} className="!py-1.5 !px-0 !text-[9px] !justify-center !flex">
                  +30S
                </Button>
                <Button variant="ghost" onClick={() => onExtend(60)} className="!py-1.5 !px-0 !text-[9px] !justify-center !flex">
                  +60S
                </Button>
                <Button variant="ghost" onClick={() => onExtend(90)} className="!py-1.5 !px-0 !text-[9px] !justify-center !flex">
                  +90S
                </Button>
              </div>
            </HudCard>

            <Button variant="red" onClick={onSubmit} className="w-full !py-3.5">
              ▸ LOCK_TARGET // FIRE
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky mobile fire bar — visible only when the desktop right
          panel's LOCK_TARGET is off-screen (i.e. on mobile/tablet).
          Player always has timer + fire in thumb reach. */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2 px-3 py-2 backdrop-blur-md"
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
