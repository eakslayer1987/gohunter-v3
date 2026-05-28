'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import HudCard from '@/components/ui/HudCard';
import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import Bar from '@/components/ui/Bar';
import Counter from '@/components/ui/Counter';
import CyberBackdrop from '@/components/ui/CyberBackdrop';
import Particles from '@/components/ui/Particles';
import ShareCard from '@/components/result/ShareCard';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { getTribe } from '@/data/tribes';
import { scoreFromDistance, computeTotalScore, formatDistance } from '@/lib/utils';
import { playScoreReveal } from '@/lib/sound';
import type { ScoreBreakdown } from '@/types';

const ResultMap = dynamic(() => import('@/components/result/ResultMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center font-mono text-cyber-cyan">
      ▸ RENDERING_TACTICAL_REPLAY...
    </div>
  ),
});

export default function ResultPage() {
  const router = useRouter();
  const missions = useGameStore((s) => s.missionsInMatch);
  const idx = useGameStore((s) => s.currentMissionIndex);
  const player = useGameStore((s) => s.player);
  const nextMission = useGameStore((s) => s.nextMission);
  const exitMatch = useGameStore((s) => s.exitMatch);

  const cur = missions[idx];

  // All hooks MUST be called before any early return below — React
  // rules of hooks. Previously the share state hooks lived after the
  // `if (!cur) return null` guard which is a real (silent in prod)
  // bug; consolidated here.
  const [hasRender, setHasRender] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHasRender(true);
    // Score reveal SFX fires once when DEBRIEF mounts — pairs with
    // the shimmer counter so the player gets audio + visual together.
    playScoreReveal();
  }, []);

  useEffect(() => {
    if (!cur || !cur.completed || !cur.pinPosition) {
      router.push('/');
    }
  }, [cur, router]);

  if (!cur || !cur.completed || !cur.pinPosition) return null;

  const dist = cur.distanceMeters ?? 0;
  const band = scoreFromDistance(dist);
  // Prefer the breakdown cached at submit time so SPEED_BONUS reflects the
  // actual remaining clock — recomputing here with remainingSeconds=0 always
  // zeroed it out and made TOTAL_CR diverge from the submitted score (audit #2).
  // Fall back to recompute only if persisted state predates the cache field.
  const breakdown: ScoreBreakdown =
    cur.breakdown ??
    computeTotalScore({
      base: band.base,
      remainingSeconds: cur.remainingSecondsAtSubmit ?? 0,
      totalSeconds: cur.duration,
      hintsUsed: cur.hintsUsed,
      streak: player.streak,
      tribe: player.tribe,
      distanceMeters: dist,
    });
  const tierLabel = band.band;

  const runTotal = missions.reduce((sum, m) => sum + (m.score ?? 0), 0);
  const precision = Math.max(0, Math.min(100, 100 - (dist / 1000) * 100));

  const onNext = () => {
    const hasNext = nextMission();
    if (hasNext) {
      router.push('/play');
    } else {
      exitMatch();
      router.push('/');
    }
  };

  const onExit = () => {
    exitMatch();
    router.push('/');
  };

  const tribe = getTribe(player.tribe);
  // Mission doesn't track its own completedAt — share card just labels
  // with "right now" since the player is looking at it live.
  const dateLabel = new Date().toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });

  const onShare = async () => {
    if (sharing || !shareRef.current) return;
    setSharing(true);
    try {
      // html-to-image lazy-imported so it stays out of the initial
      // /result bundle — most players never click SHARE.
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(shareRef.current, {
        pixelRatio: 1,
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'coin-hunter-result.png', {
        type: 'image/png',
      });
      // Prefer Web Share API with files when available (mobile + some
      // desktop). Fall back to download a tag on desktop browsers
      // that lack share or refuse files.
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
      };
      if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({
            files: [file],
            title: 'COIN HUNTER',
            text: '▸ ตามล่าเหรียญลับใน Bangkok Grid',
          });
          toast.success('▸ SHARED');
        } catch (err) {
          // AbortError = user cancelled, silent
          if ((err as Error).name !== 'AbortError') throw err;
        }
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `coin-hunter-${Date.now()}.png`;
        a.click();
        toast.success('▸ IMAGE_DOWNLOADED');
      }
    } catch (err) {
      console.error(err);
      toast.error('▸ SHARE_FAILED');
    } finally {
      setSharing(false);
    }
  };

  return (
    <main className="cyber-screen relative min-h-screen">
      <div className="scanline-overlay" />
      <CyberBackdrop accent="gold" />
      <Particles count={4} />

      <div className="relative z-10 p-4 sm:p-6 max-w-[1400px] mx-auto">
        {/* TOP BAR */}
        <HudCard accent="gold" className="px-5 py-3 flex items-center gap-3.5 flex-wrap">
          <Pill variant="gold">▸ DEBRIEF</Pill>
          <div className="font-display text-[13px] text-cyber-gold font-bold tracking-cyber">
            CONTRACT_{String(idx + 1).padStart(2, '0')} // COMPLETE
          </div>
          {cur.matchCompletionBonus ? (
            <Pill variant="green">
              ▸ MATCH_BONUS +{cur.matchCompletionBonus}CR
            </Pill>
          ) : null}
          <div className="flex-1" />
          <div className="font-mono text-[10px] text-white/65">
            ▸ TARGET: <span className="text-cyber-gold">{cur.location.name.toUpperCase().replace(/ /g, '_')}</span>
          </div>
          <Pill variant="cyan">RUN TOTAL // {runTotal.toLocaleString()}</Pill>
        </HudCard>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4 mt-3.5">
          {/* TACTICAL REPLAY */}
          <HudCard className="p-4">
            <div className="dl mb-3">// TACTICAL_REPLAY · DIST {formatDistance(dist)}</div>
            <div className="relative h-[420px] lg:h-[540px] bg-base-deep">
              {hasRender && (
                <ResultMap
                  guess={cur.pinPosition}
                  target={{
                    lat: cur.location.lat,
                    lng: cur.location.lng,
                    name: cur.location.name,
                  }}
                />
              )}
            </div>
          </HudCard>

          {/* STATS PANEL */}
          <div className="flex flex-col gap-3">
            <HudCard accent="gold" className="p-5 text-center relative overflow-hidden">
              <div
                className="absolute top-1/2 left-1/2 w-72 h-72 border border-cyber-gold rounded-full opacity-30 animate-pulse-ring"
                style={{ transform: 'translate(-50%, -50%)' }}
              />
              <div className="relative">
                <div className="font-mono text-[9px] text-cyber-gold mb-1">▸ RANK_TIER_{band.tier}</div>
                <div className="font-display text-[11px] text-cyber-cyan font-bold tracking-widest2 mb-1.5">
                  {tierLabel}
                </div>
                <div className="font-display shimmer-text text-5xl sm:text-[72px] font-extrabold leading-none">
                  <Counter value={breakdown.total} />
                </div>
                <div className="font-mono text-[10px] text-white/55 mt-2">▸ XP CREDITS EARNED</div>

                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[9px] text-white/55">PRECISION</span>
                    <span className="font-mono text-[9px] text-cyber-gold">
                      {formatDistance(dist)} // {Math.round(precision)}%
                    </span>
                  </div>
                  <Bar value={precision} fillClassName="!bg-gradient-to-r from-cyber-gold to-cyber-green" />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div
                    className="py-2 px-1 border"
                    style={{
                      background: 'rgba(34,211,238,0.07)',
                      borderColor: 'rgba(34,211,238,0.35)',
                    }}
                  >
                    <div className="font-mono text-[8px] text-cyber-cyan/75">DIST</div>
                    <div className="font-display text-[15px] text-cyber-cyan font-bold mt-0.5">
                      {Math.round(dist)}M
                    </div>
                  </div>
                  <div
                    className="py-2 px-1 border"
                    style={{
                      background: 'rgba(253,24,3,0.07)',
                      borderColor: 'rgba(253,24,3,0.35)',
                    }}
                  >
                    <div className="font-mono text-[8px] text-cyber-red/75">STREAK</div>
                    <div className="font-display text-[15px] font-bold mt-0.5" style={{ color: '#FD7A6F' }}>
                      🔥 {player.streak}
                    </div>
                  </div>
                  <div
                    className="py-2 px-1 border"
                    style={{
                      background: 'rgba(167,139,250,0.07)',
                      borderColor: 'rgba(167,139,250,0.35)',
                    }}
                  >
                    <div className="font-mono text-[8px] text-cyber-violet/75">RANK</div>
                    <div className="font-display text-[15px] text-cyber-violet font-bold mt-0.5">
                      #47 ▲2
                    </div>
                  </div>
                </div>
              </div>
            </HudCard>

            <HudCard className="p-3.5">
              <div className="dl mb-2.5">// SCORE_BREAKDOWN</div>
              <Row label="BASE_SCORE" value={breakdown.base} color="#fff" />
              <Row label="+ SPEED_BONUS" value={breakdown.speedBonus} color="#22D3EE" muted />
              <Row label="+ NO_HINT_BONUS" value={breakdown.noHintBonus} color="#4ade80" muted />
              <Row label="+ STREAK_BONUS" value={breakdown.streakBonus} color="#FD7A2F" muted />
              <Row label={`+ TRIBE [${player.tribe.toUpperCase()}]`} value={breakdown.tribeBonus} color="#FD1803" muted />
              {cur.matchCompletionBonus ? (
                <Row
                  label="+ CONTRACT_COMPLETE"
                  value={cur.matchCompletionBonus}
                  color="#4ade80"
                />
              ) : null}
              <div
                className="h-px my-2.5"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)',
                }}
              />
              <div className="flex justify-between py-1 text-sm">
                <span className="font-display text-cyber-gold font-bold">▸ TOTAL_CR</span>
                <span className="font-display text-cyber-gold font-bold">
                  {(breakdown.total + (cur.matchCompletionBonus ?? 0)).toLocaleString()}
                </span>
              </div>
            </HudCard>

            <Button
              variant="ghost"
              onClick={onShare}
              disabled={sharing}
              className="w-full !py-2.5 !justify-center !flex"
            >
              {sharing ? '▸ RENDERING_CARD...' : '▸ SHARE_RESULT // PNG'}
            </Button>

            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <Button variant="ghost" onClick={onExit} className="!py-3.5 !justify-center !flex">
                // EXIT
              </Button>
              <Button onClick={onNext}>
                ▸ {idx + 1 >= missions.length ? 'FINISH_RUN' : 'NEXT_CONTRACT'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Offscreen ShareCard — html-to-image needs the node mounted in
          the DOM to snapshot. Position fixed at -9999px keeps it
          rendered but invisible. */}
      <div
        aria-hidden
        style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}
      >
        <ShareCard
          ref={shareRef}
          score={breakdown.total + (cur.matchCompletionBonus ?? 0)}
          tier={band.tier}
          distanceLabel={formatDistance(dist)}
          targetName={cur.location.name}
          runTotal={runTotal}
          tribeEmoji={tribe.emoji}
          tribeName={tribe.name}
          dateLabel={dateLabel}
        />
      </div>
    </main>
  );
}

function Row({ label, value, color, muted }: { label: string; value: number; color: string; muted?: boolean }) {
  return (
    <div className="flex justify-between py-1 text-xs">
      <span className={`font-mono ${muted ? 'text-white/55' : 'text-white/75'}`}>{label}</span>
      <span className="font-mono" style={{ color }}>
        {value > 0 ? `+${value.toLocaleString()}` : value === 0 && muted ? '+0' : value.toLocaleString()}
      </span>
    </div>
  );
}
