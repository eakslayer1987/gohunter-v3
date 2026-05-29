'use client';

import { useState } from 'react';
import ScreenShell from '@/components/ui/ScreenShell';
import Pill from '@/components/ui/Pill';
import { useApi } from '@/lib/api';
import { getTribe } from '@/data/tribes';
import type { TribeId } from '@/types';
import { useGameStore } from '@/store/gameStore';

interface LeaderRow {
  rank: number;
  name: string;
  score: number;
  streak: number;
  tribe: TribeId;
  delta: number;
  country: string;
  isMe?: boolean;
}
interface LeaderResp {
  tab: string;
  rows: LeaderRow[];
}

const TABS = ['daily', 'weekly', 'monthly', 'all_time'] as const;
type Tab = (typeof TABS)[number];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('weekly');
  const player = useGameStore((s) => s.player);
  const { data, loading } = useApi<LeaderResp>('leaderboard', {
    params: { tab },
    deps: [tab],
  });

  // Patch the "__YOU__" placeholder row with this hunter's live values
  // so the highlight row reflects their actual score/streak/tribe.
  const rows: LeaderRow[] = (data?.rows ?? []).map((r) =>
    r.name === '__YOU__'
      ? {
          ...r,
          name: player.nickname,
          score: Math.max(r.score, player.weeklyScore),
          streak: player.streak,
          tribe: player.tribe,
        }
      : r,
  );

  return (
    <ScreenShell
      ribbon="// LEADERBOARD // GLOBAL_RANKINGS"
      title="TOP HUNTERS"
      accent="gold"
    >
      {/* Tab strip */}
      <div className="flex gap-2 sm:gap-2.5 mb-3.5 flex-wrap">
        {TABS.map((t) => {
          const isActive = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3.5 py-2 cursor-pointer font-display font-bold text-[11px] tracking-cyber transition-all"
              style={{
                background: isActive ? 'rgba(34,211,238,0.14)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.1)'}`,
                color: isActive ? 'var(--cy-cyan)' : 'rgba(255,255,255,0.55)',
                clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
              }}
            >
              {t.replace('_', ' ').toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="hud g px-4 py-5">
        {/* Header row */}
        <div
          className="grid gap-3 pb-2.5 font-mono text-[9px] text-white/50 tracking-cyber"
          style={{
            gridTemplateColumns: '50px 1fr 80px 90px 70px 70px',
            borderBottom: '1px solid rgba(251,191,36,0.3)',
          }}
        >
          <span>RANK</span>
          <span>HUNTER</span>
          <span>TRIBE</span>
          <span className="text-right">SCORE</span>
          <span className="text-center">STREAK</span>
          <span className="text-center">DELTA</span>
        </div>

        {loading && (
          <div className="font-mono text-cyber-cyan/70 text-[12px] tracking-cyber py-4">
            ▸ LOADING_RANKINGS...
          </div>
        )}

        {rows.map((r) => {
          const t = getTribe(r.tribe);
          const rankColor =
            r.rank === 1
              ? '#FBBF24'
              : r.rank === 2
              ? '#22D3EE'
              : r.rank === 3
              ? '#A78BFA'
              : '#fff';
          return (
            <div
              key={`${r.rank}-${r.name}`}
              className="grid gap-3 py-2.5 items-center"
              style={{
                gridTemplateColumns: '50px 1fr 80px 90px 70px 70px',
                background: r.isMe ? 'rgba(34,211,238,0.08)' : 'transparent',
                borderLeft: r.isMe ? '2px solid #22D3EE' : '2px solid transparent',
                paddingLeft: r.isMe ? 8 : 10,
                borderBottom: '1px dashed rgba(255,255,255,0.05)',
              }}
            >
              <span
                className="font-display font-extrabold text-[15px] sm:text-[16px]"
                style={{ color: rankColor }}
              >
                #{r.rank}
              </span>
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-[16px] sm:text-[18px]">{t.emoji}</span>
                <span className="font-sans text-[12px] sm:text-[14px] truncate">{r.name}</span>
                {r.isMe && <Pill variant="cyan">YOU</Pill>}
                <span className="font-mono text-[9px] text-white/40 hidden sm:inline">
                  ·{r.country}
                </span>
              </span>
              <span
                className="font-display text-[10px] sm:text-[11px] tracking-wider truncate"
                style={{ color: t.color }}
              >
                {t.name}
              </span>
              <span
                className="text-right font-display font-bold text-[12px] sm:text-[14px] text-cyber-gold tabular-nums"
              >
                {r.score.toLocaleString()}
              </span>
              <span className="text-center">
                {r.streak > 0 ? <Pill variant="red">🔥 {r.streak}</Pill> : null}
              </span>
              <span
                className="text-center font-mono text-[12px]"
                style={{
                  color:
                    r.delta > 0
                      ? 'var(--cy-green)'
                      : r.delta < 0
                      ? 'var(--cy-red)'
                      : 'rgba(255,255,255,0.4)',
                }}
              >
                {r.delta > 0 ? `▲${r.delta}` : r.delta < 0 ? `▼${-r.delta}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </ScreenShell>
  );
}
