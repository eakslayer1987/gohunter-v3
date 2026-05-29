'use client';

import ScreenShell from '@/components/ui/ScreenShell';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import { TRIBES } from '@/data/tribes';
import type { TribeId } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { useApi } from '@/lib/api';

interface TribeStat {
  hunters: number;
  winRate: number;
  topAgent: string;
}
interface TribeStatsResp {
  stats: Record<TribeId, TribeStat>;
}

const TRIBE_DESC: Record<TribeId, string> = {
  wolf: 'นักวิ่งกลางคืน · ความเร็วในการ pin',
  lion: 'ผู้บัญชาการ · พลังโจมตีในการล่า',
  falcon: 'จับตามอง · มองเห็นเบาะแสไกล',
  shark: 'ผู้สำรวจน้ำลึก · ค่าล่าเหรียญสูง',
};

export default function HuntersPage() {
  const currentTribe = useGameStore((s) => s.player.tribe);
  const setTribe = useGameStore((s) => s.setTribe);
  const { data, loading } = useApi<TribeStatsResp>('tribes.stats');

  const join = (id: TribeId, name: string) => {
    setTribe(id);
    toast.success(`▸ TRIBE_SELECTED // ${name}`);
  };

  return (
    <ScreenShell
      ribbon="// HUNTERS // FOUR_TRIBES_PROTOCOL"
      title="THE FOUR TRIBES"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {TRIBES.map((t) => {
          const selected = currentTribe === t.id;
          const stat = data?.stats[t.id];
          return (
            <div
              key={t.id}
              className="hud relative px-5 py-5 text-center"
              style={{
                borderColor: selected ? t.color : `${t.color}66`,
                boxShadow: selected
                  ? `inset 0 0 36px ${t.color}28, 0 0 24px ${t.color}55`
                  : `inset 0 0 24px ${t.color}10`,
              }}
            >
              <div
                className="text-[56px] sm:text-[64px] leading-none"
                style={{ filter: `drop-shadow(0 0 14px ${t.color})` }}
              >
                {t.emoji}
              </div>
              <div
                className="font-display font-extrabold text-[20px] sm:text-[22px] tracking-widest2 mt-2.5"
                style={{ color: t.color }}
              >
                {t.name}
              </div>
              <div
                className="font-mono text-[10px] tracking-cyber mt-1"
                style={{ color: `${t.color}b3` }}
              >
                {t.bonusLabel}
              </div>
              <div className="font-sans text-[11px] text-white/60 mt-2.5 leading-[1.5] min-h-[40px]">
                {TRIBE_DESC[t.id]}
              </div>

              <div className="mt-3.5">
                {selected ? (
                  <Pill variant="cyan">▸ ACTIVE</Pill>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => join(t.id, t.name)}
                    className="!text-[10px] !px-4 !py-2"
                  >
                    JOIN_TRIBE
                  </Button>
                )}
              </div>

              <div
                className="grid grid-cols-2 gap-2 mt-3.5 pt-2.5 font-mono text-[10px]"
                style={{ borderTop: `1px dashed ${t.color}30` }}
              >
                <div>
                  <div className="text-white/50">HUNTERS</div>
                  <div style={{ color: t.color }}>
                    {loading ? '—' : stat?.hunters ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-white/50">WIN RATE</div>
                  <div style={{ color: t.color }}>
                    {loading ? '—' : `${Math.round((stat?.winRate ?? 0) * 100)}%`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScreenShell>
  );
}
