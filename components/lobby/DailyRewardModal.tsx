'use client';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface Props {
  open: boolean;
  /** Current consecutive-day count (1..7+). Day-1 = first login, Day-7
   *  = the big payout. Beyond 7 the streak ribbon caps visually but
   *  reward + streak number continue to scale. */
  streak: number;
  /** Credits awarded this login. Comes from gameStore.checkDailyLogin. */
  credits: number;
  /** Stamina awarded this login. */
  stamina: number;
  onClaim: () => void;
  onClose: () => void;
}

/** DailyRewardModal — login-streak reward popup. Shows the day count,
 *  a hovering gift glyph with a rotating gold/magenta ring, the CR +
 *  stamina amounts earned, and a 7-cell streak track so the player can
 *  see their progress toward Day 7. Reward is already applied to the
 *  store by the time this modal mounts; onClaim is just an
 *  acknowledgement that closes the modal. */
export default function DailyRewardModal({
  open,
  streak,
  credits,
  stamina,
  onClaim,
  onClose,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title="DAILY_REWARD // LOGIN_STREAK">
      <div className="text-center relative">
        {/* Twinkling star backdrop — sits behind the gift glyph, no
            interaction, masked off the corners. */}
        <div
          aria-hidden
          className="absolute -inset-5 h-[150px] pointer-events-none opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(1px 1px at 20% 30%, #fff, transparent),' +
              'radial-gradient(1px 1px at 70% 20%, rgba(167,139,250,0.9), transparent),' +
              'radial-gradient(1px 1px at 45% 55%, #fff, transparent),' +
              'radial-gradient(1px 1px at 85% 45%, rgba(251,191,36,0.9), transparent)',
          }}
        />

        {/* Rotating reward ring behind the gift */}
        <svg
          viewBox="0 0 120 120"
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] opacity-70 animate-spin-slow pointer-events-none"
          style={{
            top: 38,
            filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.6))',
          }}
        >
          <circle cx="60" cy="60" r="54" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2 8" />
          <circle cx="60" cy="60" r="44" fill="none" stroke="#FF35E6" strokeWidth="1" strokeDasharray="14 6" opacity="0.6" />
        </svg>

        {/* Gift glyph — large, gold-glowing, floats. */}
        <div
          className="relative text-[64px] leading-none my-2.5 animate-hover-float"
          style={{ filter: 'drop-shadow(0 0 24px rgba(251,191,36,0.7))' }}
          aria-hidden
        >
          🎁
        </div>

        <div className="font-display font-extrabold text-[18px] sm:text-[20px] text-cyber-gold tracking-cyber">
          ▸ DAY {streak} STREAK
        </div>
        <div className="font-sans text-[12px] sm:text-[13px] text-white/70 my-2">
          เข้าเล่นต่อเนื่อง {streak} วัน — รับรางวัลประจำวัน!
        </div>

        {/* Reward tiles — CR + STAMINA */}
        <div className="flex gap-2.5 justify-center mb-4">
          <RewardTile
            emoji="💰"
            value={`+${credits}`}
            label="CREDITS"
            accent="#FBBF24"
          />
          <RewardTile
            emoji="⚡"
            value={`+${stamina}`}
            label="STAMINA"
            accent="#22D3EE"
          />
        </div>

        {/* 7-day streak track — claimed days fade green, current day
            lights up gold, future days sit dim. */}
        <div className="flex gap-1 justify-center mb-4">
          {Array.from({ length: 7 }).map((_, i) => {
            const day = i + 1;
            const claimed = day < streak;
            const current = day === streak;
            return (
              <div
                key={i}
                className="w-[30px] h-[30px] flex items-center justify-center font-display font-bold text-[10px]"
                style={{
                  background: current
                    ? 'rgba(251,191,36,0.2)'
                    : claimed
                    ? 'rgba(74,222,128,0.12)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    current
                      ? '#FBBF24'
                      : claimed
                      ? 'rgba(74,222,128,0.5)'
                      : 'rgba(255,255,255,0.12)'
                  }`,
                  clipPath: 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)',
                  color: current
                    ? '#FBBF24'
                    : claimed
                    ? 'var(--cy-green)'
                    : 'rgba(255,255,255,0.4)',
                  boxShadow: current ? '0 0 12px rgba(251,191,36,0.5)' : 'none',
                }}
              >
                {claimed ? '✓' : day}
              </div>
            );
          })}
        </div>

        <Button
          onClick={onClaim}
          className="!w-full !flex !justify-center !py-3.5"
        >
          ▸ CLAIM_REWARD
        </Button>
      </div>
    </Modal>
  );
}

function RewardTile({
  emoji,
  value,
  label,
  accent,
}: {
  emoji: string;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div
      className="flex-1 px-2.5 py-3.5 max-w-[140px]"
      style={{
        background: `${accent}14`,
        border: `1px solid ${accent}80`,
        clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
      }}
    >
      <div className="text-[22px] leading-none">{emoji}</div>
      <div
        className="font-display font-extrabold text-[18px] mt-1 tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </div>
      <div className="font-mono text-[9px] text-white/55 tracking-widest2">
        {label}
      </div>
    </div>
  );
}
