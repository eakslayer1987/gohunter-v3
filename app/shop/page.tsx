'use client';

import ScreenShell from '@/components/ui/ScreenShell';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { useApi, useAction } from '@/lib/api';

interface Bundle {
  id: string;
  name: string;
  cr: number;
  gem: number;
  price: string;
  best: boolean;
}
interface BundlesResp { bundles: Bundle[] }

export default function ShopPage() {
  const addCredits = useGameStore((s) => s.addCredits);
  const { data, loading } = useApi<BundlesResp>('shop.bundles');
  const purchase = useAction('shop.purchase');

  const onPurchase = async (b: Bundle) => {
    try {
      await purchase.run({ bundleId: b.id });
      addCredits(b.cr);
      toast.success(`▸ PURCHASED // +${b.cr.toLocaleString()} CR`);
    } catch {
      toast.error('▸ PURCHASE_FAILED // ลองอีกครั้ง');
    }
  };

  const onClaim = () => {
    addCredits(500);
    toast.success('▸ BONUS_CLAIMED // +500 CR + Jelly Cat skin');
  };

  return (
    <ScreenShell ribbon="// SHOP // CREDIT_BUNDLES" title="STORE" accent="violet">
      {/* First-purchase banner */}
      <div
        className="hud px-4 py-4 mb-3.5"
        style={{
          background:
            'linear-gradient(135deg, rgba(167,139,250,0.10), rgba(34,211,238,0.08))',
        }}
      >
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="text-[34px] leading-none">🎁</span>
          <div className="flex-1 min-w-0">
            <div className="font-display font-extrabold text-[14px] sm:text-[16px] text-cyber-violet tracking-cyber">
              FIRST_PURCHASE_BONUS
            </div>
            <div className="font-sans text-[12px] text-white/70 mt-0.5">
              ซื้อครั้งแรก +50% CR และ Jelly Cat skin พิเศษ
            </div>
          </div>
          <Button onClick={onClaim}>▸ CLAIM</Button>
        </div>
      </div>

      {loading && (
        <div className="font-mono text-cyber-cyan/70 text-[12px] tracking-cyber mb-3">
          ▸ LOADING_BUNDLES...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {(data?.bundles ?? []).map((p) => (
          <div
            key={p.id}
            className="hud relative px-5 py-5 text-center"
            style={{
              borderColor: p.best ? '#FBBF24' : 'rgba(34,211,238,0.45)',
              boxShadow: p.best
                ? 'inset 0 0 36px rgba(251,191,36,0.18), 0 0 30px rgba(251,191,36,0.4)'
                : 'inset 0 0 24px rgba(34,211,238,0.08)',
            }}
          >
            {p.best && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Pill variant="gold">★ BEST VALUE</Pill>
              </div>
            )}
            <div
              className="font-display font-extrabold text-[13px] tracking-cyber mt-2"
              style={{ color: p.best ? 'var(--cy-gold)' : 'var(--cy-cyan)' }}
            >
              {p.name}
            </div>
            <div
              className="my-4"
              style={{
                filter: `drop-shadow(0 0 14px ${p.best ? '#FBBF24' : '#22D3EE'})`,
              }}
            >
              <span className="text-[44px] sm:text-[52px] leading-none">💰</span>
            </div>
            <div className="font-display font-extrabold text-[22px] sm:text-[24px] text-cyber-gold tabular-nums">
              +{p.cr.toLocaleString()}
            </div>
            <div className="font-mono text-[10px] text-white/55 tracking-widest2">
              CREDITS
            </div>
            {p.gem > 0 && (
              <div className="font-mono text-[10px] text-[#FD7A6F] mt-1.5">
                +{p.gem} 💎 RED_GEM
              </div>
            )}
            <Button
              className="!mt-3.5 !w-full !flex !justify-center !text-[12px]"
              disabled={purchase.loading}
              onClick={() => onPurchase(p)}
            >
              {p.price}
            </Button>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}
