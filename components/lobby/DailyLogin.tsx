'use client';

import { useEffect, useState } from 'react';
import HudCard from '@/components/ui/HudCard';
import Button from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';

export default function DailyLogin() {
  const checkLogin = useGameStore((s) => s.checkDailyLogin);
  const player = useGameStore((s) => s.player);
  const [reward, setReward] = useState<number | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen) return;
    const r = checkLogin();
    if (r.rewarded) {
      setReward(r.reward);
    }
    setSeen(true);
  }, [checkLogin, seen]);

  if (reward === null) return null;

  return (
    <HudCard accent="gold" className="p-5 mb-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl">🎁</div>
        <div className="flex-1">
          <div className="font-display text-cyber-gold text-sm font-bold tracking-cyber">
            ▸ DAILY_REWARD_UNLOCKED
          </div>
          <div className="font-mono text-[11px] text-white/70 mt-0.5">
            LOGIN_STREAK: {player.loginStreak} DAYS // +{reward} CR // +15 STAMINA
          </div>
        </div>
        <Button variant="ghost" onClick={() => setReward(null)}>
          // CLAIM
        </Button>
      </div>
    </HudCard>
  );
}
