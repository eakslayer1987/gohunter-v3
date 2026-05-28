'use client';

import { toast } from '@/store/toastStore';

interface SocialLink {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SOCIALS: SocialLink[] = [
  {
    id: 'discord',
    label: 'Discord',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20 4a17 17 0 00-4-1l-.3.6c2 .5 3 1.3 4 2.2A14 14 0 003 5.8c1-1 2-1.7 4-2.2L7 3a17 17 0 00-4 1A18 18 0 002 18a13 13 0 005 2l1-2c-1-.3-2-1-3-1l1-1a13 13 0 0012 0l1 1c-1 0-2 .7-3 1l1 2a13 13 0 005-2 18 18 0 00-1-14zM8 15c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2zm8 0c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z" />
      </svg>
    ),
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18 2h3l-7 8 8 12h-7l-5-7-6 7H1l8-9L1 2h7l4 6 6-6z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23 7s-.2-1.6-1-2.3c-.8-.9-1.7-.9-2.2-1C16.6 3.5 12 3.5 12 3.5s-4.6 0-7.8.2c-.4 0-1.3.1-2.1 1C1.2 5.4 1 7 1 7s-.2 1.9-.2 3.7v1.7c0 1.9.2 3.7.2 3.7s.2 1.6 1 2.3c.8.9 1.9.9 2.4 1C6.2 19.5 12 19.5 12 19.5s4.6 0 7.8-.2c.5-.1 1.4-.1 2.2-1 .8-.7 1-2.3 1-2.3s.2-1.9.2-3.7v-1.7c0-1.9-.2-3.6-.2-3.6zM9.7 14.6V8.2l6 3.2-6 3.2z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M22 12a10 10 0 10-11.5 9.9v-7H8v-3h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12H16l-.5 3h-2.6v7A10 10 0 0022 12z" />
      </svg>
    ),
  },
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
              className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-cyber-cyan border border-white/15 hover:border-cyber-cyan/50 hover:bg-cyber-cyan/10 transition"
              style={{
                clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
              }}
            >
              {s.icon}
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
