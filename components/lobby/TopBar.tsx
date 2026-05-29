'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Pill from '@/components/ui/Pill';
import { useSoundStore } from '@/store/soundStore';
import { toast } from '@/store/toastStore';
import clsx from 'clsx';

interface NavTab {
  id: string;
  label: string;
  /** Route the tab navigates to. The DASHBOARD tab maps to `/`. */
  href: string;
}

const NAV_TABS: NavTab[] = [
  { id: 'dashboard',   label: 'DASHBOARD',   href: '/' },
  { id: 'pets',        label: 'PETS',        href: '/pets' },
  { id: 'hunters',     label: 'HUNTERS',     href: '/hunters' },
  { id: 'contracts',   label: 'CONTRACTS',   href: '/contracts' },
  { id: 'leaderboard', label: 'LEADERBOARD', href: '/leaderboard' },
  { id: 'shop',        label: 'SHOP',        href: '/shop' },
];

export default function TopBar() {
  const pathname = usePathname();
  const soundEnabled = useSoundStore((s) => s.enabled);
  const toggleSound = useSoundStore((s) => s.toggle);

  /** Active = exact match for `/`, prefix match for everything else.
   *  Without the special-case, every page would match `/` and light up
   *  DASHBOARD alongside the actual current tab. */
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
      {/* Brand block */}
      <Link href="/" className="flex items-center gap-3 shrink-0 no-underline">
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
      </Link>

      {/* Nav tabs — hidden below md, scroll-x on md, full row on lg.
          Underline + glow on active tab. */}
      <nav
        className="hidden md:flex items-center gap-1 lg:gap-2 flex-1 justify-center overflow-x-auto px-2"
        aria-label="Primary navigation"
      >
        {NAV_TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={clsx(
                'font-display text-[11px] lg:text-[12px] tracking-cyber px-2 lg:px-3 py-1.5 transition whitespace-nowrap no-underline',
                active
                  ? 'text-cyber-cyan font-bold border-b-2 border-cyber-cyan'
                  : 'text-white/65 hover:text-cyber-cyan border-b-2 border-transparent',
              )}
              style={active ? { textShadow: '0 0 10px #22D3EE' } : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
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
        <IconBtn href="/settings" title="Settings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
          </svg>
        </IconBtn>
      </div>
    </div>
  );
}

/** Slanted parallelogram icon button — cyan-tinted, used for chrome
 *  actions (notifications, sound, settings) in the TopBar right cluster.
 *  Renders a Link when href is provided, otherwise a plain button. */
function IconBtn({
  children,
  onClick,
  title,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title: string;
  href?: string;
}) {
  const className =
    'w-8 h-8 flex items-center justify-center text-cyber-cyan hover:bg-cyber-cyan/15 transition shrink-0 no-underline';
  const style: React.CSSProperties = {
    background: 'rgba(34,211,238,0.05)',
    border: '1px solid rgba(34,211,238,0.35)',
    clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
  };
  if (href) {
    return (
      <Link href={href} title={title} aria-label={title} className={className} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
