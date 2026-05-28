'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import HudCard from '@/components/ui/HudCard';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import CyberBackdrop from '@/components/ui/CyberBackdrop';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { formatDistance } from '@/lib/utils';

const TIER_COLOR: Record<string, string> = {
  S: '#FBBF24',
  A: '#22D3EE',
  B: '#A78BFA',
  C: '#FD7A6F',
};

export default function RunsPage() {
  const router = useRouter();
  const runs = useGameStore((s) => s.runHistory);
  const clearRunHistory = useGameStore((s) => s.clearRunHistory);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Aggregate stats — folded into one pass so a long history stays cheap.
  const stats = useMemo(() => {
    if (runs.length === 0) {
      return { total: 0, best: 0, avg: 0, totalCR: 0 };
    }
    let best = 0;
    let sum = 0;
    let cr = 0;
    for (const r of runs) {
      if (r.totalScore > best) best = r.totalScore;
      sum += r.totalScore;
      cr += r.creditEarned;
    }
    return {
      total: runs.length,
      best,
      avg: Math.round(sum / runs.length),
      totalCR: cr,
    };
  }, [runs]);

  const onClear = () => {
    if (!confirm('▸ DELETE ALL RUNS? (cannot undo)')) return;
    clearRunHistory();
    setExpandedId(null);
    toast.success('▸ ARCHIVE_PURGED');
  };

  return (
    <main className="cyber-screen relative min-h-screen">
      <div className="scanline-overlay" />
      <CyberBackdrop accent="violet" />

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="!py-1.5 !px-3 !text-[11px]"
          >
            ← BACK
          </Button>
          <div className="font-display text-cyber-violet text-xl font-bold tracking-cyber">
            MY_RUNS
          </div>
          <div className="font-mono text-[10px] text-white/45">
            // ARCHIVE · {runs.length}/50
          </div>
          <div className="flex-1" />
          {runs.length > 0 && (
            <Button
              variant="ghost"
              onClick={onClear}
              className="!py-1.5 !px-3 !text-[10px] !text-cyber-red !border-cyber-red/45"
            >
              ✕ PURGE_ARCHIVE
            </Button>
          )}
        </div>

        {/* STATS BAR */}
        {runs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <StatCard label="RUNS" value={stats.total} color="#A78BFA" />
            <StatCard label="BEST_SCORE" value={stats.best.toLocaleString()} color="#FBBF24" />
            <StatCard label="AVG_SCORE" value={stats.avg.toLocaleString()} color="#22D3EE" />
            <StatCard label="TOTAL_CR" value={stats.totalCR.toLocaleString()} color="#4ade80" />
          </div>
        )}

        {/* LIST */}
        {runs.length === 0 ? (
          <HudCard className="p-10 text-center">
            <div className="font-display text-cyber-cyan text-sm tracking-cyber mb-2">
              ▸ NO_RUNS_RECORDED
            </div>
            <div className="font-mono text-[11px] text-white/55 mb-5">
              ยังไม่มี match ที่จบ — กลับไป DEPLOY contract ก่อน
            </div>
            <Button onClick={() => router.push('/')}>▸ RETURN_TO_GRID</Button>
          </HudCard>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {runs.map((run) => {
              const expanded = expandedId === run.id;
              const tierCounts = run.rounds.reduce<Record<string, number>>(
                (acc, r) => {
                  acc[r.tier] = (acc[r.tier] ?? 0) + 1;
                  return acc;
                },
                {},
              );
              return (
                <li key={run.id}>
                  <HudCard accent="violet" className="p-3.5">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : run.id)}
                      className="w-full text-left"
                    >
                      {/* Row 1: codename + time + caret. Always visible. */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="font-display text-cyber-violet text-[12px] sm:text-[13px] font-bold tracking-cyber truncate">
                          {run.matchCodename}
                        </div>
                        <div className="font-mono text-[10px] text-white/45 truncate">
                          {formatTimestamp(run.completedAt)}
                        </div>
                        <div className="flex-1" />
                        <span className="font-mono text-[14px] text-white/45 w-3 text-right shrink-0">
                          {expanded ? '▾' : '▸'}
                        </span>
                      </div>
                      {/* Row 2: tiers + score chips. Wraps below codename on mobile. */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(['S', 'A', 'B', 'C'] as const).map((t) =>
                          tierCounts[t] ? (
                            <span
                              key={t}
                              className="font-display text-[10px] font-bold px-1.5 py-0.5"
                              style={{
                                color: TIER_COLOR[t],
                                border: `1px solid ${TIER_COLOR[t]}66`,
                                background: `${TIER_COLOR[t]}10`,
                              }}
                            >
                              {t}×{tierCounts[t]}
                            </span>
                          ) : null,
                        )}
                        <div className="flex-1" />
                        <Pill variant="gold">
                          SCORE {run.totalScore.toLocaleString()}
                        </Pill>
                        {run.matchBonus > 0 && (
                          <Pill variant="green">+{run.matchBonus}CR</Pill>
                        )}
                      </div>
                    </button>

                    {expanded && (
                      <div className="mt-3 pt-3 border-t border-cyber-violet/20">
                        <div className="dl mb-2">// ROUND_BY_ROUND</div>
                        <ol className="flex flex-col gap-1">
                          {run.rounds.map((r, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 py-1.5 px-2 font-mono text-[10px]"
                              style={{
                                background: 'rgba(255,255,255,0.025)',
                                borderLeft: `2px solid ${TIER_COLOR[r.tier]}`,
                              }}
                            >
                              <span className="text-white/45 w-6">
                                R{String(i + 1).padStart(2, '0')}
                              </span>
                              <span
                                className="font-display tracking-cyber font-bold w-5"
                                style={{ color: TIER_COLOR[r.tier] }}
                              >
                                {r.tier}
                              </span>
                              <span className="flex-1 text-white/80 truncate">
                                {r.locationName}
                                <span className="text-white/40 ml-1.5">
                                  // {r.locationDistrict}
                                </span>
                              </span>
                              <span className="text-cyber-cyan tabular-nums">
                                {formatDistance(r.distanceMeters)}
                              </span>
                              <span className="text-cyber-gold tabular-nums w-14 text-right">
                                {r.score.toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ol>
                        <div className="flex justify-between mt-2.5 pt-2 border-t border-white/10 font-mono text-[10px]">
                          <span className="text-white/55">
                            ▸ CREDITS_EARNED // {run.creditEarned.toLocaleString()}CR
                          </span>
                          <span className="text-cyber-gold tabular-nums">
                            TOTAL {run.totalScore.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </HudCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      className="p-3 text-center"
      style={{
        background: `${color}0a`,
        border: `1px solid ${color}40`,
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
      }}
    >
      <div className="font-mono text-[9px] text-white/50">{label}</div>
      <div
        className="font-display text-xl font-bold mt-0.5 tabular-nums"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}

function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `วันนี้ ${time}`;
  const dateStr = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
  return `${dateStr} ${time}`;
}
