'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import HudCard from '@/components/ui/HudCard';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import Bar from '@/components/ui/Bar';
import CyberBackdrop from '@/components/ui/CyberBackdrop';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { getTribe } from '@/data/tribes';
import { getPetStageMeta, nextStageMeta } from '@/data/pets';
import JellyCat from '@/components/lobby/JellyCat';

const TIER_COLOR: Record<string, string> = {
  S: '#FBBF24',
  A: '#22D3EE',
  B: '#A78BFA',
  C: '#FD7A6F',
};

const TRIBE_LORE: Record<string, string> = {
  wolf: 'Speed-focused — โบนัสคูณบนเวลาที่เหลือ. ดีที่สุดสำหรับ match ที่กดเร็วได้',
  lion: 'Power-focused — โบนัสคูณบน base score ถ้าระยะ ≤200m. ดีสำหรับ pinpoint hunter',
  falcon: 'Vision-focused — โบนัสคูณบน no-hint bonus. ดีถ้าเล่นโดยไม่ใช้ hint',
  shark: 'Hunt-focused — โบนัสคูณบน streak bonus. ดีสำหรับการเล่นยาว ติด streak',
};

export default function ProfilePage() {
  const router = useRouter();
  const player = useGameStore((s) => s.player);
  const pet = useGameStore((s) => s.pet);
  const runHistory = useGameStore((s) => s.runHistory);
  const achievements = useGameStore((s) => s.achievements);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const ensureAgentId = useGameStore((s) => s.ensureAgentId);
  const refreshLeaderboard = useGameStore((s) => s.refreshLeaderboard);
  const regenStamina = useGameStore((s) => s.regenStamina);
  const addStamina = useGameStore((s) => s.addStamina);
  const addCredits = useGameStore((s) => s.addCredits);

  // Profile lives outside the lobby flow — keep the housekeeping that
  // normally happens on lobby mount so stats reflect current reality.
  useEffect(() => {
    ensureAgentId();
    refreshLeaderboard();
    regenStamina();
  }, [ensureAgentId, refreshLeaderboard, regenStamina]);

  const tribe = getTribe(player.tribe);

  /** Find this player's leaderboard rank. refreshLeaderboard sorts by
   *  weeklyScore and tags the "me" entry. If absent for any reason
   *  (e.g. first-ever mount), fall back to placeholder "--". */
  const myRank = (() => {
    const idx = leaderboard.findIndex((e) => e.id === 'me');
    return idx >= 0 ? idx + 1 : null;
  })();

  const onDevRefill = () => {
    addStamina(player.maxStamina);
    addCredits(2000);
    toast.success(`▸ DEV_REFILL // +${player.maxStamina}⚡ +2000CR`);
  };

  const stats = useMemo(() => {
    const totalRuns = runHistory.length;
    const bestScore = runHistory.reduce((m, r) => Math.max(m, r.totalScore), 0);
    const avgScore = totalRuns > 0
      ? Math.round(runHistory.reduce((s, r) => s + r.totalScore, 0) / totalRuns)
      : 0;
    const totalCREarned = runHistory.reduce((s, r) => s + r.creditEarned, 0);
    const tierCounts = { S: 0, A: 0, B: 0, C: 0 };
    const uniqueLocations = new Set<string>();
    const tribesUsed = new Set<string>();
    for (const r of runHistory) {
      if (r.tribeUsed) tribesUsed.add(r.tribeUsed);
      for (const rd of r.rounds) {
        tierCounts[rd.tier] += 1;
        uniqueLocations.add(rd.locationName);
      }
    }
    return {
      totalRuns,
      bestScore,
      avgScore,
      totalCREarned,
      tierCounts,
      uniqueLocations: uniqueLocations.size,
      tribesUsed: tribesUsed.size,
    };
  }, [runHistory]);

  const recentRuns = useMemo(() => runHistory.slice(0, 5), [runHistory]);

  const achievementsSorted = useMemo(
    () =>
      [...achievements].sort((a, b) => {
        // Unlocked first (newest unlock at top), then locked.
        if (a.unlockedAt && b.unlockedAt) return b.unlockedAt - a.unlockedAt;
        if (a.unlockedAt) return -1;
        if (b.unlockedAt) return 1;
        return 0;
      }),
    [achievements],
  );
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  const petMeta = getPetStageMeta(pet.stage);
  const petNext = nextStageMeta(pet.stage);

  return (
    <main className="cyber-screen relative min-h-screen">
      <div className="scanline-overlay" />
      <CyberBackdrop accent="violet" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 py-5 sm:py-7">
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
            AGENT_DOSSIER
          </div>
          <div className="font-mono text-[10px] text-white/45">// CLASSIFIED</div>
          <div className="flex-1" />
          <Pill variant="violet">ID#{player.agentId || '----'}</Pill>
        </div>

        {/* IDENTITY + STATS row */}
        <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-3 mb-3">
          {/* IDENTITY CARD */}
          <HudCard accent="violet" className="p-5">
            <div className="dl mb-3">// AGENT_PROFILE</div>
            <div className="flex gap-4 items-center mb-4">
              <svg width="92" height="92" viewBox="0 0 88 88" className="shrink-0 animate-hover-float">
                <polygon points="44,4 80,24 80,64 44,84 8,64 8,24" fill="none" stroke={tribe.color} strokeWidth="2" />
                <polygon points="44,10 74,27 74,61 44,78 14,61 14,27" fill={`${tribe.color}1f`} />
                <text x="44" y="58" textAnchor="middle" fontSize="38">{tribe.emoji}</text>
                <circle cx="44" cy="44" r="42" fill="none" stroke="#22D3EE" strokeWidth=".5" strokeDasharray="3 4" opacity=".6" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="font-display text-2xl font-bold truncate">{player.nickname}</div>
                <div className="font-mono text-[11px] mt-1" style={{ color: tribe.color }}>
                  ▸ TRIBE: {tribe.name} · {tribe.bonusLabel}
                </div>
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  <Pill variant="cyan">LV {player.level}</Pill>
                  <Pill variant="gold">★ ELITE</Pill>
                  <Pill variant="violet">RANK #{myRank ?? '—'}</Pill>
                  <Pill variant="red">🔥 {player.loginStreak} DAYS</Pill>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[10px] text-white/55">
                  XP // {player.xp.toLocaleString()} / {player.xpToNext.toLocaleString()}
                </span>
                <span className="font-mono text-[10px] text-cyber-cyan">
                  {Math.round((player.xp / player.xpToNext) * 100)}%
                </span>
              </div>
              <Bar value={player.xp} max={player.xpToNext} />
            </div>

            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[10px] text-white/55">
                  STAMINA // {player.stamina} / {player.maxStamina}
                </span>
                <span className="font-mono text-[10px] text-cyber-green">▸ REGEN +1 / 5MIN</span>
              </div>
              <Bar value={player.stamina} max={player.maxStamina} height={5} />
            </div>

            {/* DEV_REFILL — dashed-violet footer, +maxStamina ⚡ + 2000CR.
                Mirrors the design-system mockup's debug refill footer.
                Useful for testing flows that need lots of CR / energy. */}
            <button
              type="button"
              onClick={onDevRefill}
              className="w-full px-3 py-2 font-mono text-[9px] text-cyber-violet/80 tracking-widest2 cursor-pointer hover:bg-cyber-violet/10 transition"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px dashed rgba(167,139,250,0.35)',
              }}
            >
              ▸ DEV_REFILL // +{player.maxStamina}⚡ +2000CR
            </button>
          </HudCard>

          {/* COMBAT STATS */}
          <HudCard accent="gold" className="p-4 sm:p-5">
            <div className="dl mb-4">// COMBAT_STATS</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-3 sm:mb-4">
              <StatBlock label="CREDITS" value={player.credits} color="#FBBF24" big />
              <StatBlock label="TOTAL" value={player.totalScore} color="#22D3EE" big />
              <StatBlock label="WEEKLY" value={player.weeklyScore} color="#A78BFA" big />
              <StatBlock label="STREAK" value={player.streak} color="#FD7A2F" big />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              <StatBlock label="RUNS" value={stats.totalRuns} color="#22D3EE" />
              <StatBlock label="BEST" value={stats.bestScore} color="#FBBF24" />
              <StatBlock label="AVG" value={stats.avgScore} color="#A78BFA" />
              <StatBlock label="EXPLORED" value={`${stats.uniqueLocations}/30`} color="#4ade80" />
            </div>

            {/* Tier distribution */}
            <div className="mt-4 pt-3 border-t border-dashed border-cyber-gold/30">
              <div className="dl mb-2">// TIER_DISTRIBUTION</div>
              <div className="flex gap-2 items-center">
                {(['S', 'A', 'B', 'C'] as const).map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-1.5 px-2.5 py-1"
                    style={{
                      border: `1px solid ${TIER_COLOR[t]}66`,
                      background: `${TIER_COLOR[t]}10`,
                    }}
                  >
                    <span
                      className="font-display font-bold text-[12px]"
                      style={{ color: TIER_COLOR[t] }}
                    >
                      {t}
                    </span>
                    <span className="font-mono text-[11px] text-white/70 tabular-nums">
                      ×{stats.tierCounts[t]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </HudCard>
        </div>

        {/* RECENT RUNS + TRIBE INTEL + COMPANION */}
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-3 mb-3">
          {/* RECENT RUNS */}
          <HudCard accent="cyan" className="p-4">
            <div className="flex items-center mb-3">
              <div className="dl">// RECENT_RUNS</div>
              <div className="flex-1" />
              <Button
                variant="ghost"
                onClick={() => router.push('/runs')}
                className="!py-1 !px-2 !text-[9px]"
              >
                ▸ VIEW_ALL ({runHistory.length})
              </Button>
            </div>
            {recentRuns.length === 0 ? (
              <div className="font-mono text-[11px] text-white/45 text-center py-6">
                ▸ NO_RUNS_RECORDED — DEPLOY contract เพื่อเริ่ม
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {recentRuns.map((run) => {
                  const tierStr = run.rounds.map((r) => r.tier).join('');
                  return (
                    <li
                      key={run.id}
                      className="px-2.5 py-2 font-mono text-[10px]"
                      style={{
                        background: 'rgba(34,211,238,0.05)',
                        borderLeft: '2px solid rgba(34,211,238,0.5)',
                      }}
                    >
                      {/* 2-line stack: codename + time on row 1, tiers + score on row 2.
                          On sm+ collapses back to single row. */}
                      <div className="flex items-center gap-2 mb-1 sm:mb-0 sm:flex-row">
                        <span className="font-display text-cyber-cyan text-[11px] font-bold tracking-cyber truncate">
                          {run.matchCodename}
                        </span>
                        <span className="text-white/45 truncate">
                          {formatTimestamp(run.completedAt)}
                        </span>
                        <span className="hidden sm:block flex-1 font-display tracking-cyber tabular-nums text-right">
                          {tierStr.split('').map((t, i) => (
                            <span key={i} style={{ color: TIER_COLOR[t] }}>
                              {t}
                            </span>
                          ))}
                        </span>
                        <span className="hidden sm:inline text-cyber-gold tabular-nums w-20 text-right">
                          {run.totalScore.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:hidden">
                        <span className="font-display tracking-cyber tabular-nums">
                          {tierStr.split('').map((t, i) => (
                            <span key={i} style={{ color: TIER_COLOR[t] }}>
                              {t}
                            </span>
                          ))}
                        </span>
                        <span className="flex-1" />
                        <span className="text-cyber-gold tabular-nums">
                          {run.totalScore.toLocaleString()}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </HudCard>

          {/* COMPANION */}
          <HudCard className="p-4">
            <div className="dl mb-3">// COMPANION_AI</div>
            <div className="flex items-center gap-3.5 mb-3">
              <JellyCat size={88} stage={pet.stage} />
              <div className="flex-1 min-w-0">
                <div className="font-display text-[14px] truncate">{pet.name}</div>
                <div className="font-mono text-[9px] text-cyber-violet mb-0.5">
                  {petMeta.stage} · {petMeta.name}
                </div>
                <div className="font-mono text-[9px] text-white/50 mb-1.5">
                  LV.{pet.level}{' '}
                  {petNext
                    ? `· next ${petNext.stage} @ LV.${petNext.levelRequired}`
                    : '· MAX_EVOLVED'}
                </div>
                <Bar value={pet.exp} max={pet.expToNext} fillClassName="!bg-cyber-gold" height={3} />
              </div>
            </div>
            <div className="font-mono text-[10px] text-white/60 leading-[1.55] px-2.5 py-2"
              style={{ background: 'rgba(34,211,238,0.05)', borderLeft: '2px solid rgba(34,211,238,0.4)' }}
            >
              <div className="text-cyber-cyan mb-0.5">{pet.skill.name}</div>
              <div>{pet.skill.description}</div>
              <div className="text-white/45 mt-1">▸ cooldown {pet.skill.cooldown}s · happiness {pet.happiness}/100</div>
            </div>
          </HudCard>
        </div>

        {/* TRIBE INTEL */}
        <HudCard className="p-4 mb-3" accent="violet">
          <div className="dl mb-3">// TRIBE_INTEL · {tribe.name}</div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-[42px]">{tribe.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[16px] font-bold" style={{ color: tribe.color }}>
                {tribe.name} · {tribe.bonusLabel}
              </div>
              <div className="font-mono text-[11px] text-white/65 mt-1 leading-[1.5]">
                {TRIBE_LORE[player.tribe]}
              </div>
              <div className="font-mono text-[9px] text-white/40 mt-1.5">
                ▸ Tribe ที่เคยเล่น: {stats.tribesUsed}/4
              </div>
            </div>
          </div>
        </HudCard>

        {/* ACHIEVEMENTS */}
        <HudCard accent="gold" className="p-4">
          <div className="flex items-center mb-3 gap-2">
            <div className="dl">// ACHIEVEMENTS_VAULT</div>
            <div className="flex-1" />
            <span className="font-mono text-[11px] text-cyber-gold">
              ▸ {unlockedCount} / {achievements.length} UNLOCKED
            </span>
          </div>
          <div className="mb-3">
            <Bar
              value={unlockedCount}
              max={achievements.length}
              fillClassName="!bg-gradient-to-r from-cyber-cyan to-cyber-violet"
              height={4}
            />
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {achievementsSorted.map((a) => {
              const isUnlocked = !!a.unlockedAt;
              return (
                <li
                  key={a.id}
                  className="p-2.5"
                  style={{
                    background: isUnlocked
                      ? 'rgba(251,191,36,0.07)'
                      : 'rgba(255,255,255,0.025)',
                    border: isUnlocked
                      ? '1px solid rgba(251,191,36,0.45)'
                      : '1px dashed rgba(255,255,255,0.12)',
                    opacity: isUnlocked ? 1 : 0.55,
                    filter: isUnlocked ? 'none' : 'grayscale(0.7)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[24px] leading-none shrink-0">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-display text-[10px] font-bold tracking-cyber truncate"
                        style={{
                          color: isUnlocked ? '#FBBF24' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {a.name}
                      </div>
                      <div className="font-mono text-[9px] text-white/55 mt-0.5 leading-[1.35]">
                        {a.description}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </HudCard>

      </div>
    </main>
  );
}

function StatBlock({
  label,
  value,
  color,
  big,
}: {
  label: string;
  value: string | number;
  color: string;
  big?: boolean;
}) {
  return (
    <div
      className="p-2.5 text-center"
      style={{
        background: `${color}0a`,
        border: `1px solid ${color}40`,
        clipPath:
          'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
      }}
    >
      <div className="font-mono text-[9px] text-white/50 tracking-cyber">{label}</div>
      <div
        className={`font-display ${big ? 'text-lg' : 'text-sm'} font-bold mt-0.5 tabular-nums`}
        style={{ color }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
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
