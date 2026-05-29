'use client';

import { useRouter } from 'next/navigation';
import ScreenShell from '@/components/ui/ScreenShell';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { useApi } from '@/lib/api';
import { BANGKOK_LOCATIONS } from '@/data/locations';

interface Contract {
  id: string;
  codename: string;
  window: string;
  missions: number;
  cost: number;
  reward: number;
  accent: 'gold' | 'cyan' | 'violet' | 'red';
  badge: string;
}
interface ContractsResp { contracts: Contract[] }

const ACCENT_HEX: Record<Contract['accent'], string> = {
  gold:   '#FBBF24',
  cyan:   '#22D3EE',
  violet: '#A78BFA',
  red:    '#FD1803',
};
const ACCENT_PILL: Record<Contract['accent'], 'gold' | 'cyan' | 'violet' | 'red'> = {
  gold: 'gold', cyan: 'cyan', violet: 'violet', red: 'red',
};

/** Maps contract id from mock API → matchId in our gameStore catalog. */
const CONTRACT_TO_MATCH: Record<string, string> = {
  flash:   'flash',
  classic: 'classic',
  night:   'night',
  raid:    'raid',
};

export default function ContractsPage() {
  const router = useRouter();
  const stamina = useGameStore((s) => s.player.stamina);
  const startMatch = useGameStore((s) => s.startMatch);
  const spendStamina = useGameStore((s) => s.spendStamina);
  const { data, loading } = useApi<ContractsResp>('contracts.list');

  const onDeploy = (c: Contract) => {
    if (stamina < c.cost) {
      toast.error(`▸ STAMINA INSUFFICIENT // NEED ${c.cost - stamina} MORE ⚡`);
      return;
    }
    spendStamina(c.cost);
    const matchId = CONTRACT_TO_MATCH[c.id] ?? 'classic';
    startMatch(matchId, BANGKOK_LOCATIONS);
    toast.success(`▸ DEPLOYED // ${c.codename}`);
    router.push('/play');
  };

  return (
    <ScreenShell
      ribbon={`// CONTRACTS // ${(data?.contracts.length ?? 0).toString().padStart(2, '0')}_AVAILABLE`}
      title="ACTIVE CONTRACTS"
      accent="cyan"
    >
      {loading && (
        <div className="font-mono text-cyber-cyan/70 text-[12px] tracking-cyber mb-3">
          ▸ LOADING_CONTRACTS...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {(data?.contracts ?? []).map((c) => {
          const accent = ACCENT_HEX[c.accent];
          const canAfford = stamina >= c.cost;
          return (
            <div
              key={c.id}
              className="hud px-5 py-5 relative"
              style={{
                borderColor: `${accent}80`,
                boxShadow: `inset 0 0 30px ${accent}14`,
              }}
            >
              <div className="flex justify-between items-start mb-3 gap-3">
                <div className="min-w-0">
                  <div
                    className="font-display font-extrabold text-[18px] sm:text-[20px] tracking-cyber"
                    style={{ color: accent }}
                  >
                    {c.codename}
                  </div>
                  <div className="font-mono text-[10px] text-white/55 mt-0.5">
                    // WINDOW: {c.window}
                  </div>
                </div>
                <Pill variant={ACCENT_PILL[c.accent]}>{c.badge}</Pill>
              </div>

              <div
                className="grid grid-cols-3 gap-2.5 py-3 font-mono text-[10px]"
                style={{
                  borderTop: `1px dashed ${accent}30`,
                  borderBottom: `1px dashed ${accent}30`,
                }}
              >
                <Cell label="MISSIONS" value={c.missions.toString()} accent={accent} />
                <Cell label="STAMINA"  value={`⚡ ${c.cost}`} accent={accent} />
                <Cell label="REWARD"   value={`+${c.reward} CR`} accent="#FBBF24" />
              </div>

              <div className="flex justify-between items-center mt-3.5">
                <span
                  className="font-mono text-[10px]"
                  style={{ color: canAfford ? 'var(--cy-green)' : 'var(--cy-red)' }}
                >
                  ▸ {canAfford ? 'READY_TO_DEPLOY' : `NEED ${c.cost - stamina} MORE ⚡`}
                </span>
                <Button
                  disabled={!canAfford}
                  onClick={() => onDeploy(c)}
                  className="!px-5 !py-2.5 !text-[11px]"
                >
                  ▸ DEPLOY
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </ScreenShell>
  );
}

function Cell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div>
      <div className="text-white/50">{label}</div>
      <div
        className="font-display font-bold text-[13px] sm:text-[14px] mt-0.5"
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  );
}
