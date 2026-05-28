'use client';

import { toast } from '@/store/toastStore';

interface SocialLink {
  id: string;
  label: string;
  emoji: string;
}

const SOCIALS: SocialLink[] = [
  { id: 'discord', label: 'Discord', emoji: '🎮' },
  { id: 'x', label: 'X (Twitter)', emoji: '✕' },
  { id: 'youtube', label: 'YouTube', emoji: '▶' },
  { id: 'facebook', label: 'Facebook', emoji: 'f' },
];

const LEGAL = ['SUPPORT', 'TERMS OF SERVICE', 'PRIVACY POLICY'];

export default function SiteFooter() {
  const stub = (label: string) =>
    toast.info(`▸ ${label.toUpperCase()} // RESERVED — coming in next bundle`);

  return (
    <footer
      className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mt-10 pt-5 font-mono text-[10px] text-white/45 tracking-widest2"
      style={{ borderTop: '1px solid rgba(0,246,255,0.12)' }}
    >
      {/* LEFT — brand + copyright */}
      <div className="text-center md:text-left">
        <div>
          <span className="text-cyber-cyan font-bold">COIN HUNTER</span>{' '}
          // BANGKOK.GRID
        </div>
        <div className="text-white/30 mt-0.5">
          © 2026 EAKSLAYER LABS · ALL RIGHTS RESERVED
        </div>
      </div>

      {/* CENTER — FOLLOW US + social icons. Emoji as glyph (no asset
          pipeline) — matches the README's "no icon library" rule. */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-cyber-cyan/70">FOLLOW US</span>
        <div className="flex gap-2">
          {SOCIALS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => stub(s.label)}
              aria-label={s.label}
              title={s.label}
              className="w-8 h-8 flex items-center justify-center text-[14px] border border-white/15 hover:border-cyber-cyan/50 hover:bg-cyber-cyan/10 transition"
              style={{
                clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
              }}
            >
              {s.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT — legal links + language toggle */}
      <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
        {LEGAL.map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stub(label)}
              className="hover:text-cyber-cyan transition tracking-widest2"
            >
              {label}
            </button>
            {i < LEGAL.length - 1 && <span className="text-white/15">|</span>}
          </span>
        ))}
        <span className="text-white/15 mx-1">·</span>
        <button
          type="button"
          onClick={() => stub('LANGUAGE_EN')}
          className="flex items-center gap-1 hover:text-cyber-cyan transition tracking-widest2"
          title="Switch language (EN coming soon)"
        >
          <span>🌐</span>
          <span>TH</span>
          <span className="text-white/40">▾</span>
        </button>
      </div>
    </footer>
  );
}
