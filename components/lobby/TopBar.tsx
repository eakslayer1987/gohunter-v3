'use client';

import Pill from '@/components/ui/Pill';
import { useSoundStore } from '@/store/soundStore';
import { toast } from '@/store/toastStore';
import clsx from 'clsx';

interface NavTab {
  id: string;
  label: string;
  /** Mark as the current page; gets the active underline + cyan glow. */
  active?: boolean;
}

const NAV_TABS: NavTab[] = [
  { id: 'dashboard', label: 'DASHBOARD', active: true },
  { id: 'hunters', label: 'HUNTERS' },
  { id: 'contracts', label: 'CONTRACTS' },
  { id: 'market', label: 'MARKET' },
  { id: 'leaderboard', label: 'LEADERBOARD' },
  { id: 'shop', label: 'SHOP' },
];

export default function TopBar() {
  const soundEnabled = useSoundStore((s) => s.enabled);
  const toggleSound = useSoundStore((s) => s.toggle);

  const onTabClick = (tab: NavTab) => {
    if (tab.active) return;
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

      {/* Status pills + chrome icon buttons */}
      <div className="flex gap-1.5 items-center shrink-0">
        <Pill variant="green">
          <span className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse-dot" />
          SYS ONLINE
        </Pill>
        <Pill variant="cyan" className="hidden sm:inline-flex">2,847 HUNTERS</Pill>
        <Pill variant="violet" className="hidden xl:inline-flex">LATENCY 23MS</Pill>
        <IconBtn
          title="Notifications"
          onClick={() => toast.info('▸ NO NEW ALERTS')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10 21a2 2 0 004 0" />
          </svg>
        </IconBtn>
        <IconBtn
          title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
          onClick={toggleSound}
        >
          <span className="text-[13px] leading-none">{soundEnabled ? '🔊' : '🔇'}</span>
        </IconBtn>
        <IconBtn
          title="Menu"
          onClick={() => toast.info('▸ MENU // RESERVED — coming in next bundle')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </IconBtn>
      </div>
    </div>
  );
}

/** Slanted parallelogram icon button — cyan-tinted, used for chrome
 *  actions (notifications, sound, menu) in the TopBar right cluster. */
function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="w-8 h-8 flex items-center justify-center text-cyber-cyan hover:bg-cyber-cyan/15 transition shrink-0"
      style={{
        background: 'rgba(34,211,238,0.05)',
        border: '1px solid rgba(34,211,238,0.35)',
        clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
      }}
    >
      {children}
    </button>
  );
}
