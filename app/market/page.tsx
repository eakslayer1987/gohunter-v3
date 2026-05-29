'use client';

import ScreenShell from '@/components/ui/ScreenShell';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { useApi, useAction } from '@/lib/api';

interface MarketItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  price: number;
  color: string;
}
interface MarketResp { items: MarketItem[] }

export default function MarketPage() {
  const credits = useGameStore((s) => s.player.credits);
  const totalScore = useGameStore((s) => s.player.totalScore);
  const addCredits = useGameStore((s) => s.addCredits);
  const addStamina = useGameStore((s) => s.addStamina);

  const { data, loading } = useApi<MarketResp>('market.items');
  const buy = useAction('market.buy');

  /** Apply item-specific effects to gameStore. Some items grant stamina,
   *  some bump pin-energy reserves, etc. Anything not listed is purely
   *  cosmetic at the moment — credits are still spent. */
  const applyItemEffect = (item: MarketItem) => {
    if (item.id === 'stm10') addStamina(10);
    if (item.id === 'stm30') addStamina(30);
    // pin-energy / XP-booster / food / clue-reveal are session/run
    // effects — wired into /play later.
  };

  const onBuy = async (item: MarketItem) => {
    if (credits < item.price) {
      toast.error(`▸ INSUFFICIENT_CR // NEED ${item.price - credits} MORE`);
      return;
    }
    try {
      await buy.run({ itemId: item.id });
      addCredits(-item.price);
      applyItemEffect(item);
      toast.success(`▸ PURCHASED // ${item.name}`);
    } catch {
      toast.error('▸ PURCHASE_FAILED // ลองอีกครั้ง');
    }
  };

  return (
    <ScreenShell ribbon="// MARKET // POWERUPS_LIVE" title="MARKET" accent="gold">
      {/* Wallet header */}
      <div
        className="mb-3.5 px-4 py-3 flex justify-between items-center gap-4 flex-wrap"
        style={{
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.4)',
          clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
        }}
      >
        <div className="flex gap-4 flex-wrap font-mono text-[11px] text-white/70">
          <span>
            WALLET //{' '}
            <span className="text-cyber-gold font-display font-bold">
              {credits.toLocaleString()} CR
            </span>
          </span>
          <span>
            HOLY COIN //{' '}
            <span className="text-cyber-gold font-display font-bold">
              {totalScore.toLocaleString()}
            </span>
          </span>
        </div>
        <Pill variant="green">DAILY +10% BONUS</Pill>
      </div>

      {loading && (
        <div className="font-mono text-cyber-cyan/70 text-[12px] tracking-cyber mb-3">
          ▸ LOADING_INVENTORY...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {(data?.items ?? []).map((item) => {
          const canAfford = credits >= item.price;
          return (
            <div
              key={item.id}
              className="hud px-4 py-4"
              style={{ borderColor: `${item.color}66` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="text-[34px] leading-none shrink-0"
                  style={{ filter: `drop-shadow(0 0 8px ${item.color})` }}
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-display font-bold text-[12px] tracking-wider"
                    style={{ color: item.color }}
                  >
                    {item.name}
                  </div>
                  <div className="font-sans text-[12px] text-white/65 mt-0.5 leading-[1.4]">
                    {item.desc}
                  </div>
                </div>
              </div>

              <div
                className="flex justify-between items-center mt-3.5 pt-3 font-display"
                style={{ borderTop: `1px dashed ${item.color}30` }}
              >
                <span className="text-cyber-gold font-bold text-[14px]">
                  {item.price} CR
                </span>
                <Button
                  variant="ghost"
                  onClick={() => onBuy(item)}
                  disabled={!canAfford || buy.loading}
                  className="!text-[10px] !px-3.5 !py-2"
                >
                  ▸ BUY
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </ScreenShell>
  );
}
