'use client';

import { useRouter } from 'next/navigation';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';

/** Companion panel for the lobby — port of new design's JellyCompanionPanel.
 *  Different from the old CompanionPanel: this one is purely advisory
 *  (shows boost stats + LV pill + VIEW DETAILS), no feed action. The
 *  feed mechanic lives on the /pets page now. */
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
        <SvgJellyCat />

        <div className="min-w-0">
          <div className="font-sans font-semibold text-[18px] text-white mb-0.5 truncate">
            {pet.name}
          </div>

          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="font-display font-bold text-[10px] text-white/70 tracking-cyber">
              JELLY CAT COMPANION
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
            onClick={() => router.push('/profile')}
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

/** Inline SVG jelly cat — purple/blue gradient body with cat ears + big
 *  sparkly eyes. Pure SVG so it scales cleanly. Used only in the lobby
 *  panel; the /profile page's pet showcase keeps the bell-shape
 *  components/lobby/JellyCat for continuity with the existing flow. */
function SvgJellyCat() {
  return (
    <div className="relative w-[120px] h-[120px] animate-hover-float">
      <div
        aria-hidden
        className="absolute -inset-2 rounded-full animate-spin-slow"
        style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.4), transparent 65%)',
        }}
      />
      <svg
        viewBox="0 0 120 120"
        className="relative w-full h-full"
        style={{ filter: 'drop-shadow(0 0 14px rgba(167,139,250,0.7))' }}
        aria-hidden
      >
        <defs>
          <radialGradient id="ch-jelly-body" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#ff8ff5" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3a1f7a" />
          </radialGradient>
          <radialGradient id="ch-jelly-hi" cx="35%" cy="30%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id="ch-jelly-eye" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="30%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0a3a4a" />
          </radialGradient>
        </defs>

        {/* Ears */}
        <polygon points="30,32 38,12 50,30" fill="url(#ch-jelly-body)" />
        <polygon points="90,32 82,12 70,30" fill="url(#ch-jelly-body)" />
        <polygon points="36,28 40,18 46,28" fill="#ff8ff5" opacity="0.55" />
        <polygon points="84,28 80,18 74,28" fill="#ff8ff5" opacity="0.55" />

        {/* Body */}
        <ellipse cx="60" cy="68" rx="38" ry="40" fill="url(#ch-jelly-body)" />
        <ellipse cx="60" cy="68" rx="38" ry="40" fill="url(#ch-jelly-hi)" />

        {/* Eyes */}
        <ellipse cx="46" cy="62" rx="9" ry="11" fill="#0a0612" />
        <ellipse cx="74" cy="62" rx="9" ry="11" fill="#0a0612" />
        <ellipse cx="46" cy="62" rx="7" ry="9" fill="url(#ch-jelly-eye)" />
        <ellipse cx="74" cy="62" rx="7" ry="9" fill="url(#ch-jelly-eye)" />

        {/* Sparkles */}
        <circle cx="44" cy="58" r="2" fill="#fff" />
        <circle cx="72" cy="58" r="2" fill="#fff" />
        <circle cx="49" cy="65" r="0.9" fill="#fff" />
        <circle cx="77" cy="65" r="0.9" fill="#fff" />

        {/* Nose + mouth */}
        <path d="M58 76 Q60 78 62 76" fill="none" stroke="#fff" strokeWidth="1" opacity="0.7" />
        <ellipse cx="60" cy="74" rx="1.4" ry="1" fill="#ff8ff5" />

        {/* Surface sparkles */}
        <circle cx="35" cy="50" r="1.5" fill="#fff" opacity="0.7" />
        <circle cx="84" cy="80" r="1.5" fill="#fff" opacity="0.7" />
        <circle cx="48" cy="92" r="1" fill="#fff" opacity="0.6" />
      </svg>
    </div>
  );
}
