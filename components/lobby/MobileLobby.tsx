'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { getTribe } from '@/data/tribes';
import { BANGKOK_LOCATIONS } from '@/data/locations';

const QUICK_DEPLOY_COST = 20;

/** Map of pet stage → portrait asset for the bound starter pet. Mirrors
 *  the same starter sprite used in /onboarding so the lobby companion
 *  strip stays consistent with what the player picked. */
const PET_PORTRAIT: Record<string, string> = {
  volt: '/assets/img/pets/pet-kit.webp',
  lumen: '/assets/img/pets/pet-pup.webp',
  nyx: '/assets/img/pets/pet-owl.webp',
  horn: '/assets/img/pets/pet-horn.webp',
};

interface Props {
  onOpenIntel: () => void;
}

/** Mobile-first lobby — single-screen Coin Master / Free Fire style.
 *  Layout uses fixed-height sections so nothing depends on intrinsic
 *  image sizes for centering:
 *
 *    [TopBar — from parent]
 *    [stat strip]           40px
 *    [avatar stage]         flex-1, min 220
 *    [identity card]        ~70px
 *    [companion strip]      ~56px  ← was missing on mobile
 *    [mode chips row]       ~64px
 *    [GO NOW + intel]       ~96px
 *    [MobileNav — from layout, safe-area aware]
 *
 *  Total fits 100dvh-76px on iPhone 13+ comfortably; on tiny phones
 *  (≤600 px tall) the avatar stage shrinks first. */
export default function MobileLobby({ onOpenIntel }: Props) {
  const router = useRouter();
  const player = useGameStore((s) => s.player);
  const pet = useGameStore((s) => s.pet);
  const startMatch = useGameStore((s) => s.startMatch);
  const spendStamina = useGameStore((s) => s.spendStamina);
  const guest = useAuthStore((s) => s.guest);
  const starterPetId = useAuthStore((s) => s.starterPetId);
  const tribe = getTribe(player.tribe);

  const stamina = player.stamina;
  const canDeploy = stamina >= QUICK_DEPLOY_COST;
  const petImage = PET_PORTRAIT[starterPetId] ?? PET_PORTRAIT.volt;

  const onDeploy = () => {
    if (!spendStamina(QUICK_DEPLOY_COST)) {
      toast.error('▸ STAMINA INSUFFICIENT // FEED PET OR WAIT FOR REGEN');
      return;
    }
    startMatch('classic', BANGKOK_LOCATIONS);
    router.push('/play');
  };

  return (
    // No fixed/dvh height — the page is short by design + scrolls if
    // the device is small. Letting the natural content height drive
    // layout means the avatar stage's pixel height is stable when the
    // URL bar collapses/expands on mobile Safari.
    <div className="flex flex-col gap-2 pb-4">
      {/* ─── STAT STRIP ─── */}
      <div className="flex items-stretch gap-1" style={{ minHeight: 40 }}>
        <StatChip icon="🎖" label="LV" value={String(player.level).padStart(2, '0')} accent="#22D3EE" />
        <StatChip icon="⚡" label="STAMINA" value={`${stamina}/${player.maxStamina}`} accent="#22D3EE" />
        <StatChip icon="🪙" label="HOLY" value={fmtCompact(player.totalScore)} accent="#FBBF24" />
        <StatChip icon="💎" label="GEM" value={fmtCompact(player.credits)} accent="#FD7A6F" />
      </div>

      {/* ─── AVATAR STAGE ─── Fixed pixel height so the silhouette
          doesn't rubber-band when the mobile URL bar collapses /
          expands (dvh changes → flex-1 % heights twitch on scroll,
          which the user perceived as the avatar shrinking and growing).
          Picked 280 px as a baseline that fits iPhone SE through
          Pro Max comfortably. */}
      <div
        className="relative overflow-hidden"
        style={{ height: 280, flexShrink: 0 }}
      >
        {/* Halo backdrop — bound to the stage, not the page */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 55%, rgba(167,139,250,0.30) 0%, rgba(116,58,255,0.12) 30%, transparent 60%)',
          }}
        />

        {/* Avatar — fixed 240 px height, no float animation on mobile
            (the Y translate combined with dvh changes was the source
            of the "shrink/grow" perception). */}
        <div className="absolute inset-0 flex items-end justify-center pb-[36px]">
          <img
            src="/assets/img/agent-avatar.png"
            alt="Agent avatar"
            className="object-contain"
            style={{
              height: 240,
              maxWidth: '70%',
              filter: 'drop-shadow(0 0 22px rgba(167,139,250,0.55))',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Pedestal — pixel-anchored below the avatar's feet, fixed
            width so it stays a proper disc regardless of stage width. */}
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none animate-pedestal-pulse"
          style={{
            bottom: 22,
            width: 200,
            height: 22,
            borderRadius: '50%',
            border: '1.5px solid rgba(168,60,255,0.65)',
            boxShadow:
              '0 0 28px #743aff, 0 0 60px rgba(116,58,255,0.45), inset 0 0 18px rgba(0,246,255,0.4)',
          }}
        />
      </div>

      {/* ─── IDENTITY CARD ─── */}
      <div className="text-center">
        <div
          className="font-display font-extrabold text-[20px] sm:text-[22px] tracking-cyber mb-1.5 truncate px-2"
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

      {/* ─── COMPANION STRIP ─── Compact card linking to /pets. Shows
          the bound starter's portrait + name + boost stats, plus a
          chevron affordance. */}
      <button
        type="button"
        onClick={() => router.push('/pets')}
        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-cyber-cyan/5 transition text-left"
        style={{
          background: 'rgba(10,6,18,0.65)',
          border: '1px solid rgba(34,211,238,0.35)',
          clipPath:
            'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
        }}
      >
        <div
          className="w-11 h-11 flex items-center justify-center shrink-0 rounded-full animate-hover-float"
          style={{
            background:
              'radial-gradient(circle, rgba(167,139,250,0.3), transparent 65%)',
          }}
        >
          <img
            src={petImage}
            alt={pet.name}
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.7))' }}
          />
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-[12px] text-white tracking-cyber truncate">
              {pet.name}
            </span>
            <span className="font-mono text-[9px] text-cyber-violet">
              LV{String(pet.level).padStart(2, '0')}
            </span>
          </div>
          <div className="font-mono text-[9px] text-cyber-cyan/85 tracking-wider mt-0.5">
            ▸ BOOST · +15% find · +10% paired
          </div>
        </div>
        <span className="font-display text-cyber-cyan text-[16px] leading-none shrink-0">›</span>
      </button>

      {/* ─── MODE CHIPS — horizontal scroll if overflows ─── */}
      <div className="flex gap-2 overflow-x-auto px-0.5 -mx-0.5">
        <ModeChip icon={<ShieldIcon />} label="SOLO" accent="#22D3EE" onClick={onDeploy} disabled={!canDeploy} />
        <ModeChip icon={<SwordsIcon />} label="PVP" accent="#D82DFF" comingSoon onClick={() => toast.info('▸ PVP_PROTOCOL // RESERVED')} />
        <ModeChip icon={<TeamIcon />} label="TEAM" accent="#FBBF24" comingSoon onClick={() => toast.info('▸ TEAM_DUELS // RESERVED')} />
      </div>

      {/* ─── PRIMARY CTA + INTEL ─── */}
      <div className="flex flex-col gap-2">
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
      <div style={{ filter: `drop-shadow(0 0 6px ${accent})` }}>{icon}</div>
      <div
        className="font-display font-extrabold text-[10px] tracking-cyber"
        style={{ color: accent }}
      >
        {label}
      </div>
      {comingSoon && (
        <div
          className="absolute -top-1.5 right-1 font-mono text-[7px] text-cyber-gold/90 tracking-cyber px-1"
          style={{ background: 'var(--base-deep)' }}
        >
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
