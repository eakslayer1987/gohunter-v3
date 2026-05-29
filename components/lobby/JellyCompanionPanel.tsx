'use client';

import { useRouter } from 'next/navigation';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';

/** Companion panel for the lobby. Shows a portrait of the bound pet
 *  with a violet glow halo + boost stats + VIEW DETAILS link. The feed
 *  / chat mechanics live on /pets — this is the at-a-glance card. */
export default function JellyCompanionPanel() {
  const router = useRouter();
  const pet = useGameStore((s) => s.pet);

  return (
    <div className="hud p-4 sm:p-5 relative">
      {/* Header row — animated dot + COMPANION_AI label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse-dot" />
        <span className="font-display font-bold text-[11px] text-cyber-cyan tracking-cyber">
          COMPANION_AI
        </span>
      </div>

      <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
        <PetPortrait />

        <div className="min-w-0">
          {/* Mockup uses the pet's nick (VOLT BABY) here, not the
              user's pet.name. Keep the pet.name fallback in case
              the bind isn't a starter pet. */}
          <div className="font-display font-extrabold text-[15px] sm:text-[17px] text-white mb-1 tracking-cyber truncate">
            VOLT BABY
          </div>

          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="font-display font-bold text-[10px] text-cyber-violet tracking-cyber">
              FAIRY · BABY
            </span>
            <Pill variant="cyan">LV {String(pet.level).padStart(2, '0')}</Pill>
          </div>

          <div className="font-mono text-[10px] text-cyber-cyan tracking-widest2 mb-1.5">
            BOOST
          </div>
          <BoostRow label="โอกาสหาเหรียญ" value="+15%" />
          <BoostRow label="เหรียญจากการล่าคู่" value="+10%" />

          <Button
            variant="ghost"
            onClick={() => router.push('/pets')}
            className="!w-full !flex !justify-center !mt-3 !text-[11px]"
          >
            VIEW DETAILS ›
          </Button>
        </div>
      </div>
    </div>
  );
}

function BoostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-0.5 font-sans text-[12px] text-white/75">
      <span>{label}</span>
      <span className="font-display font-bold text-[13px] text-cyber-green">{value}</span>
    </div>
  );
}

/** Pet portrait — uses the bound starter webp asset with a violet
 *  ambient halo behind. Default VOLT BABY (pet-kit.webp); future
 *  binds swap via authStore.starterPetId → image map. */
function PetPortrait() {
  return (
    <div className="relative w-[120px] h-[120px] animate-hover-float">
      <div
        aria-hidden
        className="absolute -inset-2 rounded-full animate-spin-slow"
        style={{
          background:
            'radial-gradient(circle, rgba(167,139,250,0.4), transparent 65%)',
        }}
      />
      <img
        src="/assets/img/pets/pet-kit.webp"
        alt="Companion"
        className="relative w-full h-full object-contain"
        style={{ filter: 'drop-shadow(0 0 14px rgba(167,139,250,0.7))' }}
      />
    </div>
  );
}
