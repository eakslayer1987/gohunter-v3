'use client';

import { useGameStore } from '@/store/gameStore';
import { TRIBES } from '@/data/tribes';
import clsx from 'clsx';

export default function TribeSelector() {
  const tribe = useGameStore((s) => s.player.tribe);
  const setTribe = useGameStore((s) => s.setTribe);

  return (
    <div>
      <div className="dl mb-3">// SELECT_YOUR_TRIBE [ ผลต่อโบนัสคะแนน ]</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {TRIBES.map((t) => {
          const isSel = t.id === tribe;
          return (
            <button
              key={t.id}
              onClick={() => setTribe(t.id)}
              className={clsx('tribe-card', isSel && 'selected')}
              style={{ color: t.color }}
            >
              <div className="text-[28px] text-center mb-1">{t.emoji}</div>
              <div className="font-display text-[11px] text-center font-bold">{t.name}</div>
              <div
                className="font-mono text-[8px] text-center mt-0.5"
                style={{ color: `${t.color}b3` }}
              >
                {t.bonusLabel}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
