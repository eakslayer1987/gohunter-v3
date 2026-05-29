'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Pill from '@/components/ui/Pill';
import { useSoundStore } from '@/store/soundStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import clsx from 'clsx';

interface NavTab {
  id: string;
  label: string;
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

/** Secondary nav items surfaced via the hamburger dropdown. MARKET
 *  lives here (off the main tab bar) plus runs/profile shortcuts that
 *  don't deserve their own slot. SIGN_OUT / JOIN_GRID render
 *  conditionally based on auth state. */
const MENU_ITEMS: NavTab[] = [
  { id: 'market',  label: 'MARKET',     href: '/market' },
  { id: 'runs',    label: 'MY_RUNS',    href: '/runs' },
  { id: 'profile', label: 'PROFILE',    href: '/profile' },
  { id: 'settings', label: 'SETTINGS',  href: '/settings' },
];

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const soundEnabled = useSoundStore((s) => s.enabled);
  const toggleSound = useSoundStore((s) => s.toggle);
  const guest = useAuthStore((s) => s.guest);
  const signOut = useAuthStore((s) => s.signOut);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  /** Close menu on outside click + Escape. Without this the dropdown
   *  stays open after the user navigates and re-orients on the new
   *  page — disorienting. */
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const onSignOut = () => {
    signOut();
    setMenuOpen(false);
    toast.info('▸ SESSION_ENDED');
    router.push('/login');
  };

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

      {/* Nav tabs */}
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

      {/* Right cluster — status pills + chrome icon buttons. Guest mode
          swaps the long pill row for a single JOIN_GRID CTA so unauth'd
          visitors get a clear one-click path into the funnel. */}
      <div className="flex gap-1.5 items-center shrink-0">
        {guest ? (
          <Link
            href="/login"
            className="font-display font-extrabold text-[10px] tracking-widest2 px-3.5 py-1.5 no-underline transition"
            style={{
              background: 'linear-gradient(135deg, #22D3EE, #A78BFA)',
              color: '#0a0612',
              clipPath:
                'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
              boxShadow: '0 0 18px rgba(34,211,238,0.5)',
            }}
          >
            ▸ JOIN_GRID
          </Link>
        ) : (
          <>
            <Pill variant="green">
              <span className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse-dot" />
              SYS ONLINE
            </Pill>
            <Pill variant="cyan" className="hidden sm:inline-flex">
              2,847 HUNTERS
            </Pill>
            <Pill variant="violet" className="hidden xl:inline-flex">
              LATENCY 23MS
            </Pill>
          </>
        )}

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

        {/* Hamburger — opens a HUD-styled dropdown with secondary nav
            (MARKET / MY_RUNS / PROFILE / SETTINGS) + auth action. */}
        <div className="relative" ref={menuRef}>
          <IconBtn
            title="Menu"
            onClick={() => setMenuOpen((o) => !o)}
            pressed={menuOpen}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </IconBtn>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-[200px] z-30"
              style={{
                background: 'rgba(10,6,18,0.96)',
                border: '1px solid rgba(34,211,238,0.55)',
                boxShadow:
                  '0 0 24px rgba(34,211,238,0.25), inset 0 0 16px rgba(167,139,250,0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="dl px-3.5 pt-2.5 pb-1.5">// QUICK_NAV</div>
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    'block px-3.5 py-2 font-display text-[11px] tracking-cyber transition no-underline',
                    isActive(item.href)
                      ? 'text-cyber-cyan bg-cyber-cyan/10'
                      : 'text-white/70 hover:text-cyber-cyan hover:bg-cyber-cyan/5',
                  )}
                >
                  ▸ {item.label}
                </Link>
              ))}
              <div
                className="h-px mx-3.5 my-1"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              />
              {guest ? (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3.5 py-2 font-display text-[11px] tracking-cyber text-cyber-cyan hover:bg-cyber-cyan/10 transition no-underline"
                >
                  ▸ LOGIN
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full text-left px-3.5 py-2 font-display text-[11px] tracking-cyber text-cyber-red hover:bg-cyber-red/10 transition"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  ▸ SIGN_OUT
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Slanted parallelogram icon button — cyan-tinted, used for chrome
 *  actions in the TopBar right cluster. Renders Link when href, else
 *  a button. `pressed` toggles the active-state styling. */
function IconBtn({
  children,
  onClick,
  title,
  href,
  pressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title: string;
  href?: string;
  pressed?: boolean;
}) {
  const className =
    'w-8 h-8 flex items-center justify-center text-cyber-cyan hover:bg-cyber-cyan/15 transition shrink-0 no-underline';
  const style: React.CSSProperties = {
    background: pressed ? 'rgba(34,211,238,0.18)' : 'rgba(34,211,238,0.05)',
    border: `1px solid ${pressed ? 'rgba(34,211,238,0.7)' : 'rgba(34,211,238,0.35)'}`,
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
