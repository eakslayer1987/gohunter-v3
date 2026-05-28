'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import CyberBackdrop from '@/components/ui/CyberBackdrop';
import Particles from '@/components/ui/Particles';
import Bar from '@/components/ui/Bar';
import BevelFrame from '@/components/ui/BevelFrame';
import HolyCoinAura from '@/components/lobby/HolyCoinAura';
import TopBar from '@/components/lobby/TopBar';
import CompanionPanel from '@/components/lobby/CompanionPanel';
import TribeSelector from '@/components/lobby/TribeSelector';
import ContractCard from '@/components/lobby/ContractCard';
import LeaderboardPreview from '@/components/lobby/LeaderboardPreview';
import DailyLogin from '@/components/lobby/DailyLogin';
import IntelModal from '@/components/lobby/IntelModal';
import AchievementsModal from '@/components/lobby/AchievementsModal';
import SiteFooter from '@/components/lobby/SiteFooter';
import { MATCHES } from '@/data/locations';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { BANGKOK_LOCATIONS } from '@/data/locations';
import { getTribe } from '@/data/tribes';

const QUICK_DEPLOY_COST = 20; // Classic grid stamina cost — mirrors MATCHES[1].

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
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const achievements = useGameStore((s) => s.achievements);
  const achievementsUnlocked = achievements.filter((a) => a.unlockedAt).length;

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

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-9 py-5 sm:py-7">
        <TopBar />
        <DailyLogin />

        {/* ─── HERO + COIN + AVATAR SHOWCASE — 3 columns on lg+.
            Ratios tuned so hero text gets the most space (it carries
            the title + bullets + 2 CTAs), coin column stays narrow
            enough that the rings don't get clipped by lateral neighbours,
            and avatar showcase keeps room for its 4-up stat chip row. */}
        <section className="grid lg:grid-cols-[1.1fr_280px_1.05fr] xl:grid-cols-[1.15fr_320px_1fr] gap-4 lg:gap-5 mb-6 sm:mb-8 items-start">
          {/* LEFT — title + copy + CTAs (coin moved to dedicated middle col) */}
          <div className="relative">
            <div className="dl mb-3.5">// PROTOCOL_INIT_001 — WELCOME, AGENT</div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[52px] xl:text-[60px] font-extrabold leading-[.95] mb-4 sm:mb-5 tracking-cyber relative z-10">
              {/* GO HUNTER — single line (whitespace-nowrap so it never
                  breaks between GO and HUNTER even on tighter columns) */}
              <span
                className="block whitespace-nowrap"
                style={{
                  background: 'linear-gradient(90deg, #71ff28, #00f6ff, #168cff)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 0 24px rgba(0,246,255,0.18)',
                }}
              >
                GO HUNTER
              </span>
              {/* HOLY COIN — also single line for consistent rhythm */}
              <span
                className="block whitespace-nowrap"
                style={{
                  background: 'linear-gradient(90deg, #8e30ff, #ff35e6)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 0 26px rgba(255,43,187,0.28)',
                }}
              >
                HOLY COIN
              </span>
            </h1>

            <p className="font-sans text-[14px] sm:text-[15px] text-white/70 leading-[1.7] max-w-md mb-5 relative z-10">
              เข้าร่วมเครือข่ายนักล่าทั่ว Bangkok Grid — ตามล่า, สะสมเหรียญ, เลื่อนระดับสู่ตำแหน่ง{' '}
              <span className="text-cyber-gold font-display tracking-cyber">TOP HUNTER</span>
            </p>

            <ul className="font-sans text-[13px] sm:text-[14px] text-cyber-cyan/85 leading-[1.85] mb-7 relative z-10">
              <li>» เข้าร่วมเล่น — ล่าเหรียญในย่าน Bangkok Grid</li>
              <li>» ปลดล็อค — สะสมเอ็กซ์, เลื่อนระดับ, อันล็อค contract พิเศษ</li>
              <li>» เชื่อมต่อ — รวมก๊วน, สร้างทีม, ครองตารางผู้นำ</li>
            </ul>

            <div className="flex gap-3 flex-wrap mb-3 relative z-10">
              <Button onClick={onDeploy} disabled={!canDeploy} className="!min-w-[220px]">
                {canDeploy
                  ? `▸ GO NOW // -${QUICK_DEPLOY_COST}⚡`
                  : `▸ NEED ${QUICK_DEPLOY_COST}⚡ (HAVE ${stamina})`}
              </Button>
              <Button variant="ghost" onClick={() => setIntelOpen(true)}>
                // VIEW_INTEL
              </Button>
            </div>

            {/* Secondary nav — small links to other pages */}
            <div className="flex gap-3 flex-wrap items-center font-mono text-[10px] text-cyber-cyan/70 relative z-10">
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="hover:text-cyber-cyan transition tracking-cyber"
              >
                ▸ PROFILE
              </button>
              <span className="text-white/20">·</span>
              <button
                type="button"
                onClick={() => router.push('/runs')}
                className="hover:text-cyber-cyan transition tracking-cyber"
              >
                ▸ MY_RUNS
              </button>
              <span className="text-white/20">·</span>
              <button
                type="button"
                onClick={() => setAchievementsOpen(true)}
                className="hover:text-cyber-cyan transition tracking-cyber"
              >
                ▸ ACHIEVEMENTS [{achievementsUnlocked}/{achievements.length}]
              </button>
            </div>

          </div>

          {/* CENTER — Holy Coin with orbital aura. Hidden on mobile/tablet
              where the layout collapses to a single column and a giant
              decorative coin would just push real content off-screen. */}
          <div className="hidden lg:flex items-center justify-center relative">
            <HolyCoinAura />
          </div>

          {/* RIGHT — AVATAR SHOWCASE panel wrapped in BevelFrame
              (octagonal HUD frame + 4 L-bracket corners per spec) */}
          <BevelFrame accent="cyan" className="px-5 py-4 sm:px-6 sm:py-5">
            <h2 className="text-center font-display tracking-widest2 text-cyber-cyan text-[13px] sm:text-[15px] font-bold mb-3">
              AVATAR SHOWCASE
            </h2>

            {/* Avatar stage with character image + glowing pedestal.
                Uses inset-0 flex centering so the avatar is truly
                bottom-center regardless of intrinsic image width. */}
            <div
              className="relative mb-4 overflow-hidden"
              style={{
                height: '440px',
                background:
                  'radial-gradient(circle at 50% 78%, rgba(88,42,255,0.42), transparent 38%), radial-gradient(circle at 50% 30%, rgba(0,246,255,0.1), transparent 30%)',
                border: '1px solid rgba(0,246,255,0.18)',
              }}
            >
              {/* Avatar wrapper — flex item bottom-centered. Image
                  scales by height, fallback sibling activates onError. */}
              <div className="absolute inset-0 flex items-end justify-center pb-16 z-10">
                <img
                  src="/assets/img/agent-avatar.png"
                  alt="Agent avatar"
                  className="animate-hover-float"
                  style={{
                    height: '360px',
                    width: 'auto',
                    maxWidth: '90%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 28px rgba(167,139,250,0.6))',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
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
              {/* Glowing violet pedestal — sits below the avatar's feet. */}
              <div
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-0"
                style={{
                  bottom: '40px',
                  width: '320px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '2px solid rgba(168,60,255,0.65)',
                  boxShadow:
                    '0 0 36px #743aff, 0 0 80px rgba(116,58,255,0.45), inset 0 0 28px rgba(0,246,255,0.4)',
                }}
              />
            </div>

            {/* Stat chips row */}
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
                accent="#FBBF24"
                icon="💎"
              />
              <StatChip
                label="HOLY COIN"
                value={player.totalScore.toLocaleString()}
                accent="#FBBF24"
                icon="🪙"
              />
            </div>

            {/* Brand chip below */}
            <div className="text-center font-mono text-[9px] text-white/35 tracking-widest2 mt-3 pt-3 border-t border-dashed border-cyber-cyan/15">
              COIN HUNTER // BANGKOK.GRID
            </div>
          </BevelFrame>
        </section>

        {/* ─── TRIBE SELECTOR ─── */}
        <div className="mb-6">
          <TribeSelector />
        </div>

        {/* ─── GAME MODES ─── */}
        <section className="mb-6">
          <div className="hud p-4 sm:p-5">
            <div className="dl mb-3">// SELECT_GAME_MODE</div>
            <h2 className="text-center font-display tracking-widest2 text-cyber-cyan text-[13px] sm:text-[15px] font-bold mb-4">
              GAME MODES
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ModeCard
                label="SOLO"
                sub="Single Hunter Mission"
                icon="🎯"
                accent="#22D3EE"
                onClick={onDeploy}
                disabled={!canDeploy}
              />
              <ModeCard
                label="PVP"
                sub="Hunter vs Hunter · coming soon"
                icon="⚔️"
                accent="#D82DFF"
                onClick={() =>
                  toast.info('▸ PVP_PROTOCOL // RESERVED — coming in next bundle')
                }
                comingSoon
              />
              <ModeCard
                label="TEAM DUELS"
                sub="Squad Battle · coming soon"
                icon="👥"
                accent="#FBBF24"
                onClick={() =>
                  toast.info('▸ TEAM_DUELS // RESERVED — coming in next bundle')
                }
                comingSoon
              />
            </div>
          </div>
        </section>

        {/* ─── CONTRACTS (4-card) ─── */}
        <div id="contracts" className="mb-6 scroll-mt-6">
          <div className="dl mb-3">
            // CONTRACT_TYPES [ {MATCHES.length.toString().padStart(2, '0')} AVAILABLE ]
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MATCHES.map((m) => (
              <ContractCard key={m.id} match={m} />
            ))}
          </div>
        </div>

        {/* ─── COMPANION + LEADERBOARD ─── */}
        <div id="leaderboard" className="grid lg:grid-cols-2 gap-4 mb-6 scroll-mt-6">
          <CompanionPanel />
          <LeaderboardPreview />
        </div>

        <SiteFooter />
      </div>

      <IntelModal open={intelOpen} onClose={() => setIntelOpen(false)} />
      <AchievementsModal
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
      />
    </main>
  );
}

interface StatChipProps {
  label: string;
  value: string;
  accent: string;
  icon?: string;
  /** 0..1 progress bar shown under the value when provided. */
  progress?: number;
}

function StatChip({ label, value, accent, icon, progress }: StatChipProps) {
  return (
    <div
      className="p-2.5"
      style={{
        background: `${accent}0a`,
        border: `1px solid ${accent}3f`,
        clipPath:
          'polygon(8% 0, 100% 0, 92% 100%, 0 100%)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon && <span className="text-[14px]">{icon}</span>}
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

interface ModeCardProps {
  label: string;
  sub: string;
  icon: string;
  accent: string;
  onClick: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

function ModeCard({ label, sub, icon, accent, onClick, disabled, comingSoon }: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-left transition-all hover:-translate-y-1 disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      style={{
        background: `linear-gradient(135deg, ${accent}0d, transparent 60%)`,
        border: `1px solid ${accent}66`,
        padding: '18px 20px',
        minHeight: '120px',
        clipPath:
          'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
        cursor: 'pointer',
      }}
    >
      <div className="flex items-center gap-4">
        <span
          className="text-[40px] leading-none shrink-0"
          style={{
            filter: `drop-shadow(0 0 12px ${accent})`,
          }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div
            className="font-display text-[15px] sm:text-[17px] font-extrabold tracking-cyber"
            style={{ color: accent }}
          >
            {label}
          </div>
          <div className="font-sans text-[11px] text-white/65 mt-0.5">{sub}</div>
          {comingSoon && (
            <div className="font-mono text-[9px] text-cyber-gold/80 mt-1 tracking-cyber">
              ▸ RESERVED
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
