'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import CyberBackdrop from '@/components/ui/CyberBackdrop';
import Particles from '@/components/ui/Particles';
import Bar from '@/components/ui/Bar';
import BevelFrame from '@/components/ui/BevelFrame';
import Pill from '@/components/ui/Pill';
import HolyCoinAura from '@/components/lobby/HolyCoinAura';
import TopBar from '@/components/lobby/TopBar';
import JellyCompanionPanel from '@/components/lobby/JellyCompanionPanel';
import IntelModal from '@/components/lobby/IntelModal';
import SiteFooter from '@/components/lobby/SiteFooter';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { BANGKOK_LOCATIONS } from '@/data/locations';
import { getTribe } from '@/data/tribes';

const QUICK_DEPLOY_COST = 20;

/** Lobby — port of ui_kits/coin-hunter/Lobby.jsx structure.
 *  Three-column hero (copy / Holy Coin halo / Avatar showcase) on lg+,
 *  followed by a single 2-col bottom row (Game Modes | Jelly Companion)
 *  and the site footer. No Daily Login, Tribe Selector, Contracts grid,
 *  or Leaderboard sections — those live on their own routes now. */
export default function LobbyPage() {
  const router = useRouter();
  const startMatch = useGameStore((s) => s.startMatch);
  const spendStamina = useGameStore((s) => s.spendStamina);
  const regenStamina = useGameStore((s) => s.regenStamina);
  const stamina = useGameStore((s) => s.player.stamina);
  const player = useGameStore((s) => s.player);
  const ensureAgentId = useGameStore((s) => s.ensureAgentId);
  const canDeploy = stamina >= QUICK_DEPLOY_COST;
  const tribe = getTribe(player.tribe);

  const [intelOpen, setIntelOpen] = useState(false);

  useEffect(() => {
    ensureAgentId();
  }, [ensureAgentId]);

  useEffect(() => {
    regenStamina();
    const tick = setInterval(regenStamina, 60_000);
    const onFocus = () => regenStamina();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(tick);
      window.removeEventListener('focus', onFocus);
    };
  }, [regenStamina]);

  const onDeploy = () => {
    if (!spendStamina(QUICK_DEPLOY_COST)) {
      toast.error('▸ STAMINA INSUFFICIENT // FEED PET OR WAIT FOR REGEN');
      return;
    }
    startMatch('classic', BANGKOK_LOCATIONS);
    router.push('/play');
  };

  return (
    <main className="cyber-screen min-h-screen">
      <div className="scanline-overlay" />
      <CyberBackdrop accent="violet" withRadar />
      <Particles count={6} />

      <div className="relative z-10 max-w-[1640px] mx-auto px-4 sm:px-9 py-5 sm:py-7">
        <TopBar />

        {/* ─── HERO — 3 columns on lg+ ─── */}
        <section className="grid lg:grid-cols-[1fr_1.05fr_1.15fr] gap-5 mb-6 items-start">
          {/* LEFT — title + copy + CTAs */}
          <div className="relative">
            <div className="dl mb-3.5">// PROTOCOL_INIT_001 -- WELCOME, HUNTER</div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[48px] xl:text-[52px] font-extrabold leading-[1.05] mb-4 tracking-cyber">
              <span
                className="block whitespace-nowrap"
                style={{
                  background:
                    'linear-gradient(90deg, #71ff28, #00f6ff, #168cff, #71ff28)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 0 24px rgba(0,246,255,0.18)',
                  animation: 'shimmer-bg 8s linear infinite',
                }}
              >
                GO HUNTER
              </span>
              <span
                className="block whitespace-nowrap"
                style={{
                  background: 'linear-gradient(90deg, #8e30ff, #ff35e6, #8e30ff)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 0 26px rgba(255,43,187,0.28)',
                  animation: 'shimmer-bg 8s linear infinite',
                  animationDelay: '-2s',
                }}
              >
                HOLY COIN
              </span>
            </h1>

            <p className="font-sans text-[14px] text-white/70 leading-[1.6] max-w-md mb-1">
              เข้าร่วมเครือข่ายนักล่าทั่ว Bangkok Grid — ตามล่า, สะสมเหรียญ,
              เลื่อนระดับสู่ตำแหน่ง{' '}
              <span className="text-cyber-gold font-display tracking-cyber">TOP HUNTER</span>
            </p>

            <div className="font-display font-bold text-[13px] text-cyber-orange tracking-cyber my-3.5">
              GO HUNTER HOLY COIN
            </div>

            <ul className="font-sans text-[13px] text-cyber-cyan/85 leading-[1.85] mb-6 list-none p-0 m-0">
              <li>» เข้าร่วม — ออกล่าเหรียญในย่าน Bangkok Grid</li>
              <li>» ปลดล็อค — ระดับขึ้น — สกิลใหม่ — companion แข็งแกร่งขึ้น</li>
              <li>» เชื่อมต่อ — รวมก๊วน, สร้างทีม, ครองอันดับตารางผู้นำ</li>
            </ul>

            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={onDeploy}
                disabled={!canDeploy}
                className="!min-w-[180px] !flex !items-center !gap-3 !justify-between"
              >
                <span>GO NOW</span>
                <span className="text-[18px] leading-none">›</span>
              </Button>
              <Button variant="ghost" onClick={() => setIntelOpen(true)}>
                // VIEW INTEL
              </Button>
            </div>
          </div>

          {/* CENTER — Holy Coin halo. Hidden on mobile/tablet where the
              decorative coin would push real content off-screen. */}
          <div className="hidden lg:flex items-center justify-center relative">
            <HolyCoinAura />
          </div>

          {/* RIGHT — Avatar showcase. Top row holds the AGENT name + a
              compact LV / tribe / streak pill cluster, mirroring the
              design-system mockup's HUNTER_NYX header. */}
          <BevelFrame accent="cyan" className="px-5 py-4 sm:px-6 sm:py-5">
            <div className="dl text-center mb-1.5">// AVATAR_SHOWCASE</div>
            <h2
              className="text-center font-display font-extrabold text-[18px] sm:text-[22px] tracking-widest2 mb-2 truncate"
              style={{
                background: 'linear-gradient(90deg, #22D3EE, #A78BFA)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 18px rgba(34,211,238,0.25)',
              }}
              title={player.nickname}
            >
              {player.nickname}
            </h2>
            <div className="flex items-center justify-center gap-1.5 mb-3 flex-wrap">
              <Pill variant="cyan">LV {String(player.level).padStart(2, '0')}</Pill>
              <Pill variant="violet">
                <span className="text-[13px] leading-none">{tribe.emoji}</span>
                {tribe.name}
              </Pill>
              {player.streak > 0 && (
                <Pill variant="red">🔥 {player.streak}</Pill>
              )}
            </div>

            <div
              className="relative mb-4 overflow-hidden"
              style={{
                height: '320px',
                background:
                  'radial-gradient(circle at 50% 78%, rgba(88,42,255,0.42), transparent 38%), radial-gradient(circle at 50% 30%, rgba(0,246,255,0.1), transparent 30%)',
                border: '1px solid rgba(0,246,255,0.18)',
              }}
            >
              <div className="absolute inset-0 flex items-end justify-center pb-12 z-10">
                <img
                  src="/assets/img/agent-avatar.png"
                  alt="Agent avatar"
                  className="animate-hover-float"
                  style={{
                    height: '270px',
                    width: 'auto',
                    maxWidth: '90%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 24px rgba(167,139,250,0.6))',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget
                      .nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div
                  className="items-center justify-center flex-col gap-2 text-center font-mono text-[10px] text-cyber-cyan/60 px-6 h-full w-full"
                  style={{ display: 'none' }}
                >
                  <div className="text-5xl mb-2">{tribe.emoji}</div>
                  <div>▸ AGENT_AVATAR_NOT_LOADED</div>
                  <div className="text-white/40 leading-[1.5]">
                    save image to<br />
                    <span className="text-cyber-violet">/public/assets/img/agent-avatar.png</span>
                  </div>
                </div>
              </div>
              {/* Triple pedestal — violet outer + cyan inner, both pulse. */}
              <div
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-0 animate-pedestal-pulse"
                style={{
                  bottom: '28px',
                  width: '260px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '2px solid rgba(168,60,255,0.65)',
                  boxShadow:
                    '0 0 36px #743aff, 0 0 80px rgba(116,58,255,0.45), inset 0 0 24px rgba(0,246,255,0.4)',
                }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-0 animate-pedestal-pulse"
                style={{
                  bottom: '18px',
                  width: '200px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid rgba(0,246,255,0.45)',
                  animationDelay: '0.4s',
                }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatChip
                label="LEVEL"
                value={`LV ${String(player.level).padStart(2, '0')}`}
                accent="#22D3EE"
              />
              <StatChip
                label="EXP"
                value={`${player.xp.toLocaleString()} / ${player.xpToNext.toLocaleString()}`}
                accent="#22D3EE"
                progress={player.xp / player.xpToNext}
              />
              <StatChip
                label="RED GEM"
                value={player.credits.toLocaleString()}
                accent="#FD7A6F"
                icon={<GemIcon />}
              />
              <StatChip
                label="HOLY COIN"
                value={player.totalScore.toLocaleString()}
                accent="#FBBF24"
                icon={<CoinIcon />}
              />
            </div>

            <div className="text-center font-mono text-[9px] text-white/35 tracking-widest2 mt-3 pt-3 border-t border-dashed border-cyber-cyan/15">
              COIN HUNTER // BANGKOK.GRID
            </div>
          </BevelFrame>
        </section>

        {/* ─── BOTTOM ROW — Game modes (1.4fr) | Companion (1fr) ─── */}
        <section className="grid lg:grid-cols-[1.4fr_1fr] gap-5 mb-6">
          <div className="hud p-4 sm:p-5">
            <div className="dl mb-3">// SELECT_GAME_MODE</div>
            <h2 className="text-center font-display tracking-widest2 text-cyber-cyan text-[13px] sm:text-[15px] font-bold mb-4">
              GAME MODES
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ModeCard
                label="SOLO"
                sub="Single Hunter Mission"
                icon={<SoloIcon />}
                accent="#22D3EE"
                onClick={onDeploy}
                disabled={!canDeploy}
              />
              <ModeCard
                label="PVP"
                sub="Hunter vs Hunter"
                icon={<PvpIcon />}
                accent="#D82DFF"
                onClick={() =>
                  toast.info('▸ PVP_PROTOCOL // RESERVED — coming in next bundle')
                }
                comingSoon
              />
              <ModeCard
                label="TEAM DUELS"
                sub="Squad Battle"
                icon={<TeamIcon />}
                accent="#FBBF24"
                onClick={() =>
                  toast.info('▸ TEAM_DUELS // RESERVED — coming in next bundle')
                }
                comingSoon
              />
            </div>
          </div>

          <JellyCompanionPanel />
        </section>

        <SiteFooter />
      </div>

      <IntelModal open={intelOpen} onClose={() => setIntelOpen(false)} />
    </main>
  );
}

// ─────────────────────── STAT CHIP
interface StatChipProps {
  label: string;
  value: string;
  accent: string;
  icon?: React.ReactNode;
  progress?: number;
}

function StatChip({ label, value, accent, icon, progress }: StatChipProps) {
  return (
    <div
      className="p-2.5"
      style={{
        background: `${accent}0a`,
        border: `1px solid ${accent}3f`,
        clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon && (
          <span className="inline-flex items-center justify-center w-[14px] h-[14px] shrink-0">
            {icon}
          </span>
        )}
        <span className="font-mono text-[9px] text-white/55 tracking-cyber">{label}</span>
      </div>
      <div
        className="font-display text-[13px] sm:text-[15px] font-bold tabular-nums truncate"
        style={{ color: accent }}
      >
        {value}
      </div>
      {progress !== undefined && (
        <div className="mt-1">
          <Bar value={progress * 100} max={100} height={3} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────── MODE CARD
interface ModeCardProps {
  label: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  onClick: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

function ModeCard({
  label,
  sub,
  icon,
  accent,
  onClick,
  disabled,
  comingSoon,
}: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative text-left transition-all hover:-translate-y-1 disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      style={{
        background: `linear-gradient(135deg, ${accent}12, transparent 70%)`,
        border: `1px solid ${accent}80`,
        padding: '22px 18px',
        minHeight: '140px',
        clipPath:
          'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
        cursor: 'pointer',
        boxShadow: `inset 0 0 22px ${accent}18`,
      }}
    >
      <TileCorners accent={accent} />
      <div className="flex flex-col items-center gap-2.5 text-center">
        <div
          className="shrink-0"
          style={{ filter: `drop-shadow(0 0 10px ${accent})`, color: accent }}
        >
          {icon}
        </div>
        <div
          className="font-display text-[15px] sm:text-[16px] font-extrabold tracking-cyber"
          style={{ color: accent }}
        >
          {label}
        </div>
        <div className="font-sans text-[11px] text-white/65 leading-tight">{sub}</div>
        {comingSoon && (
          <div className="font-mono text-[9px] text-cyber-gold/80 tracking-cyber">
            ▸ RESERVED
          </div>
        )}
      </div>
    </button>
  );
}

function TileCorners({ accent }: { accent: string }) {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: accent,
    pointerEvents: 'none',
    filter: `drop-shadow(0 0 3px ${accent})`,
  };
  const w = '1.5px solid';
  return (
    <>
      <span style={{ ...base, top: 6, left: 6, borderTop: w, borderLeft: w }} />
      <span style={{ ...base, top: 6, right: 6, borderTop: w, borderRight: w }} />
      <span style={{ ...base, bottom: 6, left: 6, borderBottom: w, borderLeft: w }} />
      <span style={{ ...base, bottom: 6, right: 6, borderBottom: w, borderRight: w }} />
    </>
  );
}

// ─────────────────────── ICONS
function GemIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="ch-gem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FD7A6F" />
          <stop offset="100%" stopColor="#a01408" />
        </linearGradient>
      </defs>
      <polygon points="12,2 22,9 18,22 6,22 2,9" fill="url(#ch-gem)" stroke="#FD7A6F" strokeWidth="0.8" />
      <polygon points="12,2 18,22 22,9" fill="rgba(255,255,255,0.25)" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <radialGradient id="ch-coin" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="60%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#8a5a00" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#ch-coin)" stroke="#5a3700" strokeWidth="0.6" />
      <path d="M9 8 L15 16 M15 8 L9 16" stroke="#5a3700" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function SoloIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M21 4 L34 11 L34 24 C34 31 28 36 21 38 C14 36 8 31 8 24 L8 11 Z" />
      <rect x="14" y="17" width="14" height="5" rx="1" fill="currentColor" opacity="0.25" />
      <line x1="14" y1="19.5" x2="28" y2="19.5" strokeWidth="1.8" />
    </svg>
  );
}

function PvpIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <path d="M6 6 L26 26 M30 30 L36 36" />
      <path d="M36 6 L16 26 M12 30 L6 36" />
      <path d="M4 6 L8 6 L8 10" />
      <path d="M38 6 L34 6 L34 10" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="21" cy="13" r="5" />
      <path d="M11 36 C11 28 16 25 21 25 C26 25 31 28 31 36" />
      <circle cx="9" cy="16" r="4" />
      <circle cx="33" cy="16" r="4" />
      <path d="M2 36 C2 30 5 27 9 27" />
      <path d="M40 36 C40 30 37 27 33 27" />
    </svg>
  );
}
