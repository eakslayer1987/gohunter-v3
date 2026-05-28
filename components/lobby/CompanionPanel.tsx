'use client';

import HudCard from '@/components/ui/HudCard';
import Bar from '@/components/ui/Bar';
import Button from '@/components/ui/Button';
import JellyCat from '@/components/lobby/JellyCat';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { getPetStageMeta, nextStageMeta } from '@/data/pets';

const FEED_COST_CR = 10;

export default function CompanionPanel() {
  const pet = useGameStore((s) => s.pet);
  const credits = useGameStore((s) => s.player.credits);
  const stamina = useGameStore((s) => s.player.stamina);
  const maxStamina = useGameStore((s) => s.player.maxStamina);
  const feedPet = useGameStore((s) => s.feedPet);

  const canAffordFeed = credits >= FEED_COST_CR;
  const isAtStaminaCap = stamina >= maxStamina;
  const meta = getPetStageMeta(pet.stage);
  const next = nextStageMeta(pet.stage);

  const onFeed = () => {
    if (!canAffordFeed) {
      toast.error(`▸ NEED ${FEED_COST_CR}CR // INSUFFICIENT CREDITS`);
      return;
    }
    feedPet();
    toast.success('▸ COMPANION FED // +8⚡ +15💛 +20XP');
  };

  return (
    <HudCard className="p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-pulse-dot" />
        <span className="font-display text-[11px] text-cyber-cyan font-bold tracking-cyber">
          COMPANION_AI
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[9px] text-white/45">
          💛 {pet.happiness}/100
        </span>
      </div>
      <div className="flex items-center gap-3.5 mb-3">
        <JellyCat size={72} stage={pet.stage} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[13px] truncate">{pet.name}</span>
            <span className="font-mono text-[9px] text-cyber-violet">[{meta.stage} · {meta.name}]</span>
          </div>
          <div className="font-mono text-[9px] text-white/50 mb-1.5">
            LV.{pet.level} {next ? `· next ${next.stage} @ LV.${next.levelRequired}` : '· MAX_EVOLVED'}
          </div>
          <Bar value={pet.exp} max={pet.expToNext} fillClassName="!bg-cyber-gold" height={3} />
        </div>
      </div>
      <Button
        variant="ghost"
        onClick={onFeed}
        disabled={!canAffordFeed || isAtStaminaCap}
        className="w-full !text-center !flex !justify-center !text-[10px]"
      >
        {isAtStaminaCap
          ? '▸ STAMINA AT CAP'
          : `▸ FEED COMPANION // -${FEED_COST_CR}CR · +8⚡ +20XP`}
      </Button>
    </HudCard>
  );
}
