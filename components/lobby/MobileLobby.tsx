'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import HolyCoinAura from '@/components/lobby/HolyCoinAura';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { getTribe } from '@/data/tribes';
import { BANGKOK_LOCATIONS } from '@/data/locations';

const QUICK_DEPLOY_COST = 20;

interface Props {
  /** Opens the IntelModal — handled by the parent lobby page so the
   *  same modal instance serves both desktop and mobile. */
  onOpenIntel: () => void;
}

/** Mobile-first lobby — single-screen Coin Master / Free Fire style.
 *  Stacks vertically in a 100dvh container so nothing scrolls: compact
 *  status strip on top, avatar + identity in the middle, mode chips,
 *  big GO NOW CTA, and footer of secondary nav. The MobileNav bottom
 *  bar sits below this whole frame (rendered from the root layout) so
 *  this component leaves padding for it.
 *
 *  Rendered only on `<lg` viewports (≤1023 px). Desktop keeps the
 *  existing 3-col hero layout in app/page.tsx. */
export default function MobileLobby({ onOpenIntel }: Props) {
  const router = useRouter();
  const player = useGameStore((s) => s.player);
  const startMatch = useGameStore((s) => s.startMatch);
  const spendStamina = useGameStore((s) => s.spendStamina);
  const guest = useAuthStore((s) => s.guest);
  const tribe = getTribe(player.tribe);

  const stamina = player.stamina;
  const canDeploy = stamina >= QUICK_DEPLOY_COST;

  const onDeploy = () => {
    if (!spendStamina(QUICK_DEPLOY_COST)) {
      toast.error('▸ STAMINA INSUFFICIENT // FEED PET OR WAIT FOR REGEN');
      return;
    }
    startMatch('classic', BANGKOK_LOCATIONS);
    router.push('/play');
  };

  return (
    <div
      className="flex flex-col"
      style={{
        // Use the dynamic viewport unit so the URL bar collapsing on
        // mobile Safari doesn't leave a gap. Subtract the fixed
        // MobileNav height (~76 px) so the GO button isn't clipped.
        minHeight: 'calc(100dvh - 76px - env(safe-area-inset-top))',
      }}
    >
      {/* ─── COMPACT STAT STRIP ─── */}
      <div
        className="flex items-stretch gap-1 mb-3 mt-1"
        style={{ minHeight: 40 }}
      >
        <StatChip
          icon="🎖"
          label="LV"
          value={String(player.level).padStart(2, '0')}
          accent="#22D3EE"
        />
        <StatChip
          icon="⚡"
          label="STAMINA"
          value={`${stamina}/${player.maxStamina}`}
          accent="#22D3EE"
        />
        <StatChip
          icon="🪙"
          label="HOLY"
          value={fmtCompact(player.totalScore)}
          accent="#FBBF24"
        />
        <StatChip
          icon="💎"
          label="GEM"
          value={fmtCompact(player.credits)}
          accent="#FD7A6F"
        />
      </div>

      {/* ─── MAIN CENTER STAGE ─── */}
      <div className="flex-1 relative flex flex-col items-center justify-between min-h-0 pb-3">
        {/* Holy Coin halo — behind the avatar, scaled down so it
            doesn't dwarf the character at this viewport. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-2 flex justify-center pointer-events-none"
          style={{ zIndex: 0, transform: 'scale(0.55)' }}
        >
          <HolyCoinAura />
        </div>

        {/* AVATAR — vertically centered, takes whatever space remains.
            Use intrinsic height so on shorter phones it shrinks. */}
        <div className="relative z-10 flex-1 flex items-center justify-center w-full min-h-[200px]">
          <img
            src="/assets/img/agent-avatar.png"
            alt="Agent avatar"
            className="animate-hover-float h-full max-h-[300px] w-auto object-contain"
            style={{
              filter: 'drop-shadow(0 0 24px rgba(167,139,250,0.6))',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Pedestal glow disc below feet */}
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none animate-pedestal-pulse"
            style={{
              bottom: '8%',
              width: '60%',
              height: 24,
              borderRadius: '50%',
              border: '1.5px solid rgba(168,60,255,0.65)',
              boxShadow:
                '0 0 28px #743aff, 0 0 56px rgba(116,58,255,0.45), inset 0 0 18px rgba(0,246,255,0.4)',
            }}
          />
        </div>

        {/* IDENTITY — nickname + tribe pill + streak */}
        <div className="relative z-10 text-center mb-3 mt-2">
          <div
            className="font-display font-extrabold text-[20px] sm:text-[24px] tracking-cyber mb-1.5"
            style={{
              background: 'linear-gradient(90deg, #22D3EE, #A78BFA)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 0 14px rgba(34,211,238,0.3)',
            }}
          >
            {guest ? '▸ AGENT_GUEST' : player.nickname}
          </div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <Pill variant="cyan">LV {String(player.level).padStart(2, '0')}</Pill>
            <Pill variant="violet">
              <span className="text-[12px] leading-none">{tribe.emoji}</span>
              {tribe.name}
            </Pill>
            {player.streak > 0 && <Pill variant="red">🔥 {player.streak}</Pill>}
          </div>
        </div>

        {/* MODE CHIPS — horizontal scroll if overflows */}
        <div className="relative z-10 flex gap-2 mb-3 overflow-x-auto px-1 max-w-full">
          <ModeChip
            icon={<ShieldIcon />}
            label="SOLO"
            accent="#22D3EE"
            onClick={onDeploy}
            disabled={!canDeploy}
          />
          <ModeChip
            icon={<SwordsIcon />}
            label="PVP"
            accent="#D82DFF"
            comingSoon
            onClick={() => toast.info('▸ PVP_PROTOCOL // RESERVED')}
          />
          <ModeChip
            icon={<TeamIcon />}
            label="TEAM"
            accent="#FBBF24"
            comingSoon
            onClick={() => toast.info('▸ TEAM_DUELS // RESERVED')}
          />
        </div>

        {/* BIG GO NOW + secondary actions */}
        <div className="relative z-10 w-full flex flex-col items-center gap-2 px-1">
          <Button
            onClick={onDeploy}
            disabled={!canDeploy}
            className="!w-full !min-w-0 !py-4 !text-[15px] !flex !items-center !justify-center !gap-3"
          >
            {canDeploy ? (
              <>
                ▸ GO NOW
                <span className="text-[18px] leading-none">›</span>
              </>
            ) : (
              <>NEED {QUICK_DEPLOY_COST}⚡ (HAVE {stamina})</>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onOpenIntel}
            className="!w-full !min-w-0 !py-2 !text-[11px] !flex !items-center !justify-center"
          >
            // VIEW INTEL
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── helpers ─── */

interface StatChipProps {
  icon: string;
  label: string;
  value: string;
  accent: string;
}

function StatChip({ icon, label, value, accent }: StatChipProps) {
  return (
    <div
      className="flex-1 min-w-0 flex flex-col px-2 py-1 leading-tight"
      style={{
        background: `${accent}10`,
        border: `1px solid ${accent}40`,
        clipPath: 'polygon(7% 0, 100% 0, 93% 100%, 0 100%)',
      }}
    >
      <div className="flex items-center gap-1">
        <span className="text-[12px] leading-none">{icon}</span>
        <span className="font-mono text-[8px] text-white/55 tracking-cyber truncate">
          {label}
        </span>
      </div>
      <div
        className="font-display font-bold text-[11px] tabular-nums truncate mt-0.5"
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  );
}

interface ModeChipProps {
  icon: React.ReactNode;
  label: string;
  accent: string;
  onClick: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

function ModeChip({
  icon,
  label,
  accent,
  onClick,
  disabled,
  comingSoon,
}: ModeChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex flex-col items-center gap-1 px-4 py-2.5 shrink-0 transition disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: `linear-gradient(180deg, ${accent}1a, transparent 80%)`,
        border: `1px solid ${accent}80`,
        clipPath:
          'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)',
        color: accent,
        minWidth: 78,
        boxShadow: `inset 0 0 12px ${accent}1c`,
      }}
    >
      <div
        style={{
          filter: `drop-shadow(0 0 6px ${accent})`,
        }}
      >
        {icon}
      </div>
      <div
        className="font-display font-extrabold text-[10px] tracking-cyber"
        style={{ color: accent }}
      >
        {label}
      </div>
      {comingSoon && (
        <div className="absolute -top-1.5 -right-1 font-mono text-[7px] text-cyber-gold/90 tracking-cyber bg-base-deep px-1">
          SOON
        </div>
      )}
    </button>
  );
}

/** "1,234" → "1.2K", "12,340" → "12K", "123,400" → "123K" */
function fmtCompact(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 10000) return `${(n / 1000).toFixed(1)}K`;
  if (n < 1000000) return `${Math.round(n / 1000)}K`;
  return `${(n / 1000000).toFixed(1)}M`;
}

/* ─── inline SVG mode icons (compact) ─── */
function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 42 42" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M21 4 L34 11 L34 24 C34 31 28 36 21 38 C14 36 8 31 8 24 L8 11 Z" />
      <rect x="14" y="17" width="14" height="5" rx="1" fill="currentColor" opacity="0.25" />
      <line x1="14" y1="19.5" x2="28" y2="19.5" strokeWidth="2" />
    </svg>
  );
}

function SwordsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 42 42" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M6 6 L26 26 M30 30 L36 36" />
      <path d="M36 6 L16 26 M12 30 L6 36" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 42 42" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="21" cy="13" r="5" />
      <path d="M11 36 C11 28 16 25 21 25 C26 25 31 28 31 36" />
      <circle cx="9" cy="16" r="4" />
      <circle cx="33" cy="16" r="4" />
    </svg>
  );
}
