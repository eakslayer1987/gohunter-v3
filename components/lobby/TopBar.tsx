'use client';

import Pill from '@/components/ui/Pill';
import { useSoundStore } from '@/store/soundStore';
import { toast } from '@/store/toastStore';
import clsx from 'clsx';

interface NavTab {
  id: string;
  label: string;
  /** Anchor id to scroll to on the lobby (when staying on this page).
   *  When undefined, click emits a "RESERVED" toast — stub for future pages. */
  anchor?: string;
  /** Mark as the current page; gets the active underline + cyan glow. */
  active?: boolean;
}

const NAV_TABS: NavTab[] = [
  { id: 'dashboard', label: 'DASHBOARD', active: true },
  { id: 'hunters', label: 'HUNTERS' },
  { id: 'contracts', label: 'CONTRACTS', anchor: 'contracts' },
  { id: 'market', label: 'MARKET' },
  { id: 'leaderboard', label: 'LEADERBOARD', anchor: 'leaderboard' },
  { id: 'shop', label: 'SHOP' },
];

export default function TopBar() {
  const soundEnabled = useSoundStore((s) => s.enabled);
  const toggleSound = useSoundStore((s) => s.toggle);

  const onTabClick = (tab: NavTab) => {
    if (tab.active) return;
    if (tab.anchor) {
      const el = document.getElementById(tab.anchor);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    toast.info(`▸ ${tab.label} // RESERVED — coming in next bundle`);
  };

  return (
    <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
      {/* Brand block */}
      <div className="flex items-center gap-3 shrink-0">
        <svg width="42" height="42" viewBox="0 0 46 46" className="shrink-0">
          <polygon points="23,2 42,13 42,33 23,44 4,33 4,13" fill="none" stroke="#22D3EE" strokeWidth="2" />
          <polygon points="23,8 36,16 36,30 23,38 10,30 10,16" fill="rgba(34,211,238,.2)" />
          <text x="23" y="29" textAnchor="middle" fill="#22D3EE" fontSize="14" fontWeight="800" fontFamily="Orbitron">
            CH
          </text>
        </svg>
        <div className="leading-tight">
          <div className="font-display shimmer-text text-[14px] font-bold">COIN HUNTER</div>
          <div className="font-mono text-[9px] text-white/40 tracking-widest2">// BANGKOK_GRID_v2.4</div>
        </div>
      </div>

      {/* Nav tabs — hidden below md, scroll-x on md, full row on lg.
          Underline + glow on active tab. Other tabs emit info toast. */}
      <nav
        className="hidden md:flex items-center gap-1 lg:gap-2 flex-1 justify-center overflow-x-auto px-2"
        aria-label="Primary navigation"
      >
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabClick(tab)}
            className={clsx(
              'font-display text-[11px] lg:text-[12px] tracking-cyber px-2 lg:px-3 py-1.5 transition whitespace-nowrap',
              tab.active
                ? 'text-cyber-cyan font-bold border-b-2 border-cyber-cyan'
                : 'text-white/65 hover:text-cyber-cyan border-b-2 border-transparent',
            )}
            style={tab.active ? { textShadow: '0 0 10px #22D3EE' } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Status pills + sound toggle */}
      <div className="flex gap-2 items-center shrink-0">
        <Pill variant="green">
          <span className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse-dot" />
          SYS ONLINE
        </Pill>
        <Pill variant="cyan" className="hidden sm:inline-flex">2,847 HUNTERS</Pill>
        <Pill variant="violet" className="hidden xl:inline-flex">LATENCY 23MS</Pill>
        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
          title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
          className="w-8 h-8 flex items-center justify-center text-[14px] border border-white/15 hover:border-cyber-cyan/50 hover:bg-cyber-cyan/10 transition shrink-0"
          style={{
            clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
          }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
    </div>
  );
}
