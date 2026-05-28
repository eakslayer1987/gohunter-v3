'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { BANGKOK_LOCATIONS } from '@/data/locations';
import { toast } from '@/store/toastStore';

/** Fixed bottom tab bar shown on viewports ≤ md. Five slots: HOME, HUNT,
 *  GO (center play CTA), RANK, ME / JOIN. The center button triggers a
 *  Classic-grid quick-deploy when stamina allows; otherwise toasts and
 *  scrolls the lobby's contracts section into view.
 *
 *  Hidden on routes where the chrome would fight the UI:
 *    /play (full-screen Street View)
 *    /login, /onboarding (auth flow shouldn't show nav until session) */
const HIDDEN_ON: ReadonlyArray<RegExp> = [
  /^\/play(\/|$)/,
  /^\/login(\/|$)/,
  /^\/onboarding(\/|$)/,
];

const QUICK_DEPLOY_COST = 20;

interface Tab {
  id: string;
  label: string;
  href?: string;
  /** Override Link nav with a custom action (used by GO). */
  onClick?: () => void;
  icon: React.ReactNode;
  center?: boolean;
  /** Path prefix used to decide if this tab is the active page. */
  matchPrefix?: string;
}

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const guest = useAuthStore((s) => s.guest);
  const stamina = useGameStore((s) => s.player.stamina);
  const startMatch = useGameStore((s) => s.startMatch);
  const spendStamina = useGameStore((s) => s.spendStamina);

  if (HIDDEN_ON.some((re) => re.test(pathname))) return null;

  const onPlay = () => {
    if (stamina < QUICK_DEPLOY_COST) {
      toast.error('▸ STAMINA INSUFFICIENT // FEED PET OR WAIT FOR REGEN');
      return;
    }
    spendStamina(QUICK_DEPLOY_COST);
    startMatch('classic', BANGKOK_LOCATIONS);
    router.push('/play');
  };

  const tabs: Tab[] = [
    { id: 'dashboard',   label: 'HOME',                 href: '/',            icon: <IconHome />,   matchPrefix: '/' },
    { id: 'contracts',   label: 'HUNT',                 href: '/#contracts',  icon: <IconTarget />, matchPrefix: '/#contracts' },
    { id: 'play',        label: 'GO',                   onClick: onPlay,      icon: <IconPlay />,   center: true },
    { id: 'leaderboard', label: 'RANK',                 href: '/#leaderboard', icon: <IconTrophy />, matchPrefix: '/#leaderboard' },
    { id: 'profile',     label: guest ? 'JOIN' : 'ME',  href: guest ? '/login' : '/profile', icon: <IconUser />, matchPrefix: '/profile' },
  ];

  return (
    <nav className="mobile-tabbar" aria-label="Mobile navigation">
      {tabs.map((t) => {
        if (t.center) {
          return (
            <button
              key={t.id}
              type="button"
              onClick={t.onClick}
              aria-label={t.label}
              className="mtab-center"
            >
              <span className="mtab-center-ring">{t.icon}</span>
              <span className="mtab-center-label">{t.label}</span>
            </button>
          );
        }
        const isActive = t.matchPrefix === '/' ? pathname === '/' : pathname.startsWith(t.matchPrefix ?? '');
        const className = `mtab${isActive ? ' active' : ''}`;
        if (t.href) {
          return (
            <Link key={t.id} href={t.href} className={className}>
              <span className="mtab-icon">{t.icon}</span>
              <span className="mtab-label">{t.label}</span>
            </Link>
          );
        }
        return (
          <button key={t.id} type="button" onClick={t.onClick} className={className}>
            <span className="mtab-icon">{t.icon}</span>
            <span className="mtab-label">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ─────────── Inline SVG glyphs (single-stroke neon) ─────────── */
function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <polygon points="6,4 20,12 6,20" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 4h12v4a6 6 0 01-12 0z" />
      <path d="M6 6H3v2a3 3 0 003 3M18 6h3v2a3 3 0 01-3 3" />
      <path d="M9 18h6M10 14v4M14 14v4M8 21h8" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
