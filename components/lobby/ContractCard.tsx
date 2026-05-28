'use client';

import Pill from '@/components/ui/Pill';
import type { Match, AccentColor } from '@/types';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { useMatchWindowStatus } from '@/hooks/useMatchWindowStatus';
import { BANGKOK_LOCATIONS } from '@/data/locations';

interface Props {
  match: Match;
}

const accentBorder: Record<AccentColor, string> = {
  cyan: 'rgba(34,211,238,.45)',
  violet: 'rgba(167,139,250,.45)',
  gold: 'rgba(251,191,36,.45)',
  red: 'rgba(253,24,3,.45)',
};
const accentText: Record<AccentColor, string> = {
  cyan: '#22D3EE',
  violet: '#A78BFA',
  gold: '#FBBF24',
  red: '#FD1803',
};
const pillFor: Record<AccentColor, 'cyan' | 'violet' | 'gold' | 'red'> = {
  cyan: 'cyan',
  violet: 'violet',
  gold: 'gold',
  red: 'red',
};

export default function ContractCard({ match }: Props) {
  const router = useRouter();
  const startMatch = useGameStore((s) => s.startMatch);
  const spendStamina = useGameStore((s) => s.spendStamina);
  const stamina = useGameStore((s) => s.player.stamina);
  const windowStatus = useMatchWindowStatus(match.window);
  const canAfford = stamina >= match.staminaCost;
  const canDeploy = canAfford && windowStatus.open;

  const onDeploy = () => {
    if (!windowStatus.open) {
      toast.error(`▸ CONTRACT_CLOSED // ${windowStatus.label}`);
      return;
    }
    if (!canAfford) {
      toast.error(`▸ STAMINA INSUFFICIENT // NEED ${match.staminaCost}⚡ (HAVE ${stamina})`);
      return;
    }
    if (!spendStamina(match.staminaCost)) return;
    startMatch(match.id, BANGKOK_LOCATIONS);
    router.push('/play');
  };

  // Badge precedence: closed window beats locked stamina (window is
  // immutable; stamina the player can fix with FEED / DEV_REFILL).
  const badgeText = !windowStatus.open
    ? windowStatus.label
    : !canAfford
    ? 'LOCKED'
    : match.badge;
  const badgeVariant = !windowStatus.open
    ? 'gold'
    : !canAfford
    ? 'red'
    : pillFor[match.accent];

  return (
    <div
      className="contract"
      style={{
        borderColor: accentBorder[match.accent],
        opacity: canDeploy ? 1 : 0.45,
        cursor: canDeploy ? 'pointer' : 'not-allowed',
      }}
      onClick={onDeploy}
      aria-disabled={!canDeploy}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-display text-[13px] font-bold" style={{ color: accentText[match.accent] }}>
            {match.codename}
          </div>
          <div className="font-mono text-[9px] text-white/55">// {match.window}</div>
        </div>
        <Pill variant={badgeVariant}>{badgeText}</Pill>
      </div>
      <div className="flex gap-1 flex-wrap mb-2.5">
        <Pill>🎯 {match.missionCount}</Pill>
        <Pill variant={canAfford ? undefined : 'red'}>⚡ {match.staminaCost}</Pill>
      </div>
      <div className="font-mono text-[10px] text-cyber-gold">REWARD: +{match.reward} CR</div>
    </div>
  );
}
