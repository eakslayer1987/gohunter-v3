'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface Props {
  children: ReactNode;
  /** Border colour. Default cyan. */
  accent?: 'cyan' | 'violet' | 'gold';
  className?: string;
}

const ACCENT = {
  cyan: {
    border: 'rgba(34,211,238,0.55)',
    inset: 'inset 0 0 30px rgba(34,211,238,0.08)',
    halo: 'rgba(34,211,238,0.18)',
    corner: '#22D3EE',
  },
  violet: {
    border: 'rgba(167,139,250,0.55)',
    inset: 'inset 0 0 30px rgba(167,139,250,0.10)',
    halo: 'rgba(167,139,250,0.18)',
    corner: '#A78BFA',
  },
  gold: {
    border: 'rgba(251,191,36,0.55)',
    inset: 'inset 0 0 30px rgba(251,191,36,0.08)',
    halo: 'rgba(251,191,36,0.18)',
    corner: '#FBBF24',
  },
} as const;

const BEVEL_CLIP =
  'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)';

/** Octagonal HUD frame with L-bracket corner accents — design system's
 *  "menu frame" style for hero panels (AVATAR_SHOWCASE etc.). Outer
 *  blurred halo bleeds neon outside the bezel; four 12x12 spans drawn
 *  with border-* on two sides each give the corner glyphs. */
export default function BevelFrame({ children, accent = 'cyan', className }: Props) {
  const a = ACCENT[accent];
  return (
    <div
      className={clsx('relative', className)}
      style={{
        background: 'linear-gradient(180deg, rgba(10,6,18,0.85), rgba(5,3,10,0.92))',
        border: `1px solid ${a.border}`,
        clipPath: BEVEL_CLIP,
        boxShadow: a.inset,
      }}
    >
      {children}
      {/* Outer neon halo — sits behind the clip, faint blur outside the bezel. */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: '-2px',
          clipPath: BEVEL_CLIP,
          border: `1px solid ${a.halo}`,
          filter: 'blur(2px)',
          zIndex: -1,
        }}
      />
      {/* 4 L-bracket corner accents */}
      <Corner pos="tl" color={a.corner} />
      <Corner pos="tr" color={a.corner} />
      <Corner pos="bl" color={a.corner} />
      <Corner pos="br" color={a.corner} />
    </div>
  );
}

function Corner({
  pos,
  color,
}: {
  pos: 'tl' | 'tr' | 'bl' | 'br';
  color: string;
}) {
  const placement: Record<typeof pos, React.CSSProperties> = {
    tl: { top: 12, left: 12, borderRight: 'none', borderBottom: 'none' },
    tr: { top: 12, right: 12, borderLeft: 'none', borderBottom: 'none' },
    bl: { bottom: 12, left: 12, borderRight: 'none', borderTop: 'none' },
    br: { bottom: 12, right: 12, borderLeft: 'none', borderTop: 'none' },
  };
  return (
    <span
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        width: 12,
        height: 12,
        border: `2px solid ${color}`,
        filter: `drop-shadow(0 0 4px ${color})`,
        ...placement[pos],
      }}
    />
  );
}
