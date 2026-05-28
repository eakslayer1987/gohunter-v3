'use client';

import HudCard from '@/components/ui/HudCard';
import Bar from '@/components/ui/Bar';
import Pill from '@/components/ui/Pill';
import Counter from '@/components/ui/Counter';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { getTribe } from '@/data/tribes';

const DEV_REFILL_CREDITS = 2000;

export default function AgentProfile() {
  const player = useGameStore((s) => s.player);
  const tribe = getTribe(player.tribe);
  const addStamina = useGameStore((s) => s.addStamina);
  const addCredits = useGameStore((s) => s.addCredits);

  const onDevRefill = () => {
    addStamina(player.maxStamina);
    addCredits(DEV_REFILL_CREDITS);
    toast.success(`▸ DEV_REFILL // +${player.maxStamina}⚡ +${DEV_REFILL_CREDITS}CR`);
  };

  return (
    <HudCard accent="violet" className="p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="w-1.5 h-1.5 bg-cyber-violet rounded-full animate-pulse-dot" />
        <span className="font-display text-[11px] text-cyber-violet font-bold tracking-cyber">
          AGENT_PROFILE
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[9px] text-cyber-violet/70">
          ID#{player.agentId || '----'}
        </span>
      </div>

      <div className="flex gap-4 items-center mb-4">
        <svg width="84" height="84" viewBox="0 0 88 88" className="animate-hover-float">
          <polygon points="44,4 80,24 80,64 44,84 8,64 8,24" fill="none" stroke="#A78BFA" strokeWidth="1.5" />
          <polygon points="44,10 74,27 74,61 44,78 14,61 14,27" fill="rgba(167,139,250,.12)" />
          <text x="44" y="56" textAnchor="middle" fontSize="36">🎯</text>
          <circle cx="44" cy="44" r="42" fill="none" stroke="#22D3EE" strokeWidth=".5" strokeDasharray="3 4" opacity=".6" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg font-bold truncate">{player.nickname}</div>
          <div className="font-mono text-[10px] mt-0.5" style={{ color: tribe.color }}>
            ▸ TRIBE: {tribe.name}
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <Pill variant="cyan">LV {player.level}</Pill>
            <Pill variant="gold">★ ELITE</Pill>
          </div>
        </div>
      </div>

      <div className="mb-2.5">
        <div className="flex justify-between mb-1">
          <span className="font-mono text-[10px] text-white/55">
            XP // {player.xp.toLocaleString()} / {player.xpToNext.toLocaleString()}
          </span>
          <span className="font-mono text-[10px] text-cyber-cyan">
            {Math.round((player.xp / player.xpToNext) * 100)}%
          </span>
        </div>
        <Bar value={player.xp} max={player.xpToNext} />
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="font-mono text-[10px] text-white/55">
            STAMINA // {player.stamina} / {player.maxStamina}
          </span>
          <span className="font-mono text-[10px] text-cyber-green">
            ▸ REGEN +1 / 5MIN
          </span>
        </div>
        <Bar
          value={player.stamina}
          max={player.maxStamina}
          fillClassName="!bg-gradient-to-r"
          height={5}
        />
      </div>

      <div className="grid grid-cols-3 gap-2.5 pt-3.5 border-t border-dashed border-cyber-violet/30">
        <div className="text-center">
          <div className="font-mono text-[9px] text-white/50">CREDITS</div>
          <div className="font-display text-lg text-cyber-gold font-bold mt-0.5">
            <Counter value={player.credits} />
          </div>
        </div>
        <div className="text-center border-l border-r border-white/10">
          <div className="font-mono text-[9px] text-white/50">RANK</div>
          <div className="font-display text-lg text-cyber-cyan font-bold mt-0.5">#47</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[9px] text-white/50">STREAK</div>
          <div className="font-display text-lg text-cyber-orange font-bold mt-0.5">
            🔥 {player.loginStreak || 12}
          </div>
        </div>
      </div>

      {/* DEV refill — local-only dev convenience; not gated behind an env
          flag since v3 currently has no production deploy target. Remove
          this block before going live. */}
      <button
        type="button"
        onClick={onDevRefill}
        className="mt-3 w-full py-1.5 font-mono text-[9px] text-cyber-violet/70 hover:text-cyber-violet transition uppercase tracking-cyber"
        style={{
          background: 'rgba(0,0,0,.4)',
          border: '1px dashed rgba(167,139,250,.35)',
        }}
      >
        ▸ DEV_REFILL // +{player.maxStamina}⚡ +{DEV_REFILL_CREDITS}CR
      </button>
    </HudCard>
  );
}
