'use client';

import { ReactNode } from 'react';
import TopBar from '@/components/lobby/TopBar';
import SiteFooter from '@/components/lobby/SiteFooter';
import CyberBackdrop from '@/components/ui/CyberBackdrop';
import Particles from '@/components/ui/Particles';

interface Props {
  /** `// SECTION // FLAG_LINE` — top data-line above the title. */
  ribbon: string;
  /** Page H1, rendered with cyan→violet gradient text. */
  title: string;
  /** Backdrop accent — only changes the radial-glow tint. */
  accent?: 'cyan' | 'violet' | 'gold';
  children: ReactNode;
}

/** Shared wrapper for secondary pages — gives every screen the same
 *  TopBar + scanline + backdrop + footer chrome so individual pages
 *  only need to render their content block. */
export default function ScreenShell({ ribbon, title, accent = 'violet', children }: Props) {
  return (
    <main className="cyber-screen min-h-screen">
      <div className="scanline-overlay" />
      <CyberBackdrop accent={accent} />
      <Particles count={5} />

      <div className="relative z-10 max-w-[1640px] mx-auto px-4 sm:px-9 py-5 sm:py-7">
        <TopBar />

        <div className="mb-5">
          <div className="dl mb-2">{ribbon}</div>
          <h1
            className="font-display font-extrabold text-[24px] sm:text-[32px] tracking-cyber m-0 inline-block"
            style={{
              background: 'linear-gradient(90deg, #22D3EE, #A78BFA)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {title}
          </h1>
        </div>

        {children}

        <div className="mt-8">
          <SiteFooter />
        </div>
      </div>
    </main>
  );
}
