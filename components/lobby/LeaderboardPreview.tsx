'use client';

import { useEffect } from 'react';
import HudCard from '@/components/ui/HudCard';
import Pill from '@/components/ui/Pill';
import { useGameStore } from '@/store/gameStore';
import { getTribe } from '@/data/tribes';

export default function LeaderboardPreview() {
  const leaderboard = useGameStore((s) => s.leaderboard);
  const refreshLeaderboard = useGameStore((s) => s.refreshLeaderboard);

  // Inject "me" entry into the board on mount so the player always sees their
  // own rank — the seed leaderboard ships without it (audit bug #4).
  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  const top = leaderboard.slice(0, 5);

  return (
    <HudCard accent="gold" className="p-5">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-1.5 h-1.5 bg-cyber-gold rounded-full animate-pulse-dot" />
        <span className="font-display text-[11px] text-cyber-gold font-bold tracking-cyber">
          TOP_HUNTERS // WEEKLY
        </span>
      </div>
      <ul className="space-y-1.5">
        {top.map((e, i) => {
          const t = getTribe(e.tribe);
          const isMe = e.id === 'me';
          const currentRank = i + 1;
          const delta = e.previousRank ? e.previousRank - currentRank : 0;
          return (
            <li
              key={e.id}
              className="flex items-center gap-2.5 py-1.5 px-2"
              style={{
                background: isMe
                  ? 'rgba(34,211,238,0.10)'
                  : i === 0
                  ? 'rgba(251,191,36,0.08)'
                  : 'transparent',
                borderLeft: isMe
                  ? '2px solid #22D3EE'
                  : i === 0
                  ? '2px solid #FBBF24'
                  : '2px solid transparent',
              }}
            >
              <span
                className="font-display font-bold text-[13px] w-7"
                style={{
                  color: i === 0 ? '#FBBF24' : i === 1 ? '#22D3EE' : i === 2 ? '#A78BFA' : '#fff',
                }}
              >
                #{currentRank}
              </span>
              <span className="text-base">{t.emoji}</span>
              <span className="flex-1 truncate text-[13px]">{e.name}</span>
              {isMe && <Pill variant="cyan">YOU</Pill>}
              {delta > 0 && (
                <span className="font-mono text-[10px] text-cyber-green">▲{delta}</span>
              )}
              {delta < 0 && (
                <span className="font-mono text-[10px] text-cyber-red">▼{-delta}</span>
              )}
              <span className="font-mono text-[11px] text-cyber-gold tabular-nums">
                {e.score.toLocaleString()}
              </span>
              {e.streak > 0 && <Pill variant="red">🔥 {e.streak}</Pill>}
            </li>
          );
        })}
      </ul>
    </HudCard>
  );
}
