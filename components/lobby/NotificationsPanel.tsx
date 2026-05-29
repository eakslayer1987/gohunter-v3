'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Anchor element to position the dropdown next to. The dropdown is
   *  absolute-positioned to the right of its parent, so the caller
   *  just renders this inside the same relative container as the
   *  bell button. */
}

interface FeedItem {
  id: string;
  ts: number;
  icon: string;
  label: string;
  sub: string;
  /** Route to navigate to on click (if any). */
  href?: string;
  /** Accent colour for the left border tag. */
  color: string;
}

/** Dropdown that surfaces recent player activity — newest achievements
 *  unlocked, last few runs completed, and the daily login streak. All
 *  derived from gameStore live; no separate notifications store. The
 *  bell badge counts items newer than `settingsStore.notificationsSeenAt`,
 *  which the parent bumps when this panel opens. */
export default function NotificationsPanel({ open, onClose }: Props) {
  const router = useRouter();
  const achievements = useGameStore((s) => s.achievements);
  const runHistory = useGameStore((s) => s.runHistory);
  const lastLogin = useGameStore((s) => s.player.lastLogin);
  const loginStreak = useGameStore((s) => s.player.loginStreak);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click + Esc — same UX as TopBar's hamburger menu.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const feed: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];

    // Achievement unlocks (newest first)
    for (const a of achievements) {
      if (!a.unlockedAt) continue;
      items.push({
        id: `ach-${a.id}`,
        ts: a.unlockedAt,
        icon: a.icon,
        label: a.name,
        sub: a.description,
        href: '/profile',
        color: '#FBBF24',
      });
    }

    // Recent runs
    for (const r of runHistory.slice(0, 5)) {
      const sCount = r.rounds.filter((rd) => rd.tier === 'S').length;
      items.push({
        id: `run-${r.id}`,
        ts: r.completedAt,
        icon: sCount > 0 ? '⭐' : '🎯',
        label: `${r.matchCodename} · ${r.totalScore.toLocaleString()} pts`,
        sub:
          sCount > 0
            ? `${sCount}× TIER_S · +${r.creditEarned} CR`
            : `${r.rounds.length} rounds · +${r.creditEarned} CR`,
        href: '/runs',
        color: '#22D3EE',
      });
    }

    // Daily login streak — only if logged in today
    if (lastLogin > 0) {
      const today = new Date();
      const last = new Date(lastLogin);
      const sameDay =
        today.getFullYear() === last.getFullYear() &&
        today.getMonth() === last.getMonth() &&
        today.getDate() === last.getDate();
      if (sameDay) {
        items.push({
          id: 'daily',
          ts: lastLogin,
          icon: '🎁',
          label: `DAY ${loginStreak} STREAK`,
          sub: 'รางวัล daily login รับแล้ว',
          color: '#A78BFA',
        });
      }
    }

    return items.sort((a, b) => b.ts - a.ts).slice(0, 10);
  }, [achievements, runHistory, lastLogin, loginStreak]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="menu"
      className="absolute right-0 top-full mt-2 w-[300px] z-30 max-h-[420px] flex flex-col"
      style={{
        background: 'rgba(10,6,18,0.96)',
        border: '1px solid rgba(34,211,238,0.55)',
        boxShadow:
          '0 0 24px rgba(34,211,238,0.25), inset 0 0 16px rgba(167,139,250,0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center px-3.5 py-2.5 border-b border-cyber-cyan/20">
        <span className="dl">// ALERT_FEED</span>
        <span className="flex-1" />
        <span className="font-mono text-[9px] text-white/45">
          {feed.length} ITEM{feed.length === 1 ? '' : 'S'}
        </span>
      </div>

      <div className="overflow-y-auto flex-1">
        {feed.length === 0 ? (
          <div className="px-4 py-8 text-center font-mono text-[11px] text-white/40 tracking-cyber">
            ▸ NO_RECENT_ALERTS
            <div className="text-[9px] mt-1 text-white/30">
              Deploy a contract to start
            </div>
          </div>
        ) : (
          feed.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.href) router.push(item.href);
                onClose();
              }}
              className="w-full text-left px-3 py-2.5 flex items-start gap-2.5 border-b border-white/5 last:border-b-0 hover:bg-cyber-cyan/5 transition cursor-pointer"
              style={{ background: 'transparent' }}
            >
              <span
                className="text-[18px] leading-none shrink-0 mt-0.5"
                style={{ filter: `drop-shadow(0 0 6px ${item.color})` }}
              >
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className="font-display font-bold text-[11px] tracking-cyber truncate"
                  style={{ color: item.color }}
                >
                  {item.label}
                </div>
                <div className="font-mono text-[9px] text-white/55 mt-0.5 leading-[1.4] line-clamp-2">
                  {item.sub}
                </div>
                <div className="font-mono text-[8px] text-white/35 mt-0.5">
                  {formatRelativeTime(item.ts)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {feed.length > 0 && (
        <button
          type="button"
          onClick={() => {
            router.push('/profile');
            onClose();
          }}
          className="px-3.5 py-2 font-mono text-[10px] text-cyber-cyan/80 hover:text-cyber-cyan hover:bg-cyber-cyan/5 transition cursor-pointer border-t border-cyber-cyan/20 text-center"
        >
          ▸ VIEW_ALL_PROFILE
        </button>
      )}
    </div>
  );
}

/** Compact "5m ago" / "2h ago" / "3 พ.ค." style stamp. */
function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
  });
}

/** Count of feed items newer than the user's last "seen" timestamp.
 *  Exported so the TopBar can render a badge on the bell. Derived
 *  the same way as the feed above so they stay in sync. */
export function useUnreadCount(): number {
  const achievements = useGameStore((s) => s.achievements);
  const runHistory = useGameStore((s) => s.runHistory);
  const lastLogin = useGameStore((s) => s.player.lastLogin);
  const seenAt = useSettingsStore((s) => s.notificationsSeenAt);

  return useMemo(() => {
    let count = 0;
    for (const a of achievements) {
      if (a.unlockedAt && a.unlockedAt > seenAt) count++;
    }
    for (const r of runHistory.slice(0, 5)) {
      if (r.completedAt > seenAt) count++;
    }
    // Daily login — counts as one if today's login is newer than seenAt
    if (lastLogin > seenAt) {
      const today = new Date();
      const last = new Date(lastLogin);
      const sameDay =
        today.getFullYear() === last.getFullYear() &&
        today.getMonth() === last.getMonth() &&
        today.getDate() === last.getDate();
      if (sameDay) count++;
    }
    return count;
  }, [achievements, runHistory, lastLogin, seenAt]);
}
