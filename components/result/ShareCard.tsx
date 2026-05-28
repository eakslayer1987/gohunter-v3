'use client';

import { forwardRef } from 'react';

interface Props {
  /** Total score that the player banked on this mission. */
  score: number;
  /** Tier letter from distance band (S / A / B / C). */
  tier: 'S' | 'A' | 'B' | 'C';
  /** Distance label, formatted (e.g. "142 ม.", "1.20 กม."). */
  distanceLabel: string;
  /** Mission target name to print as the "you found" reveal. */
  targetName: string;
  /** Run total across all completed missions in the current match. */
  runTotal: number;
  /** Player tribe emoji + label for the badge. */
  tribeEmoji: string;
  tribeName: string;
  /** ISO-ish date label for the footer. */
  dateLabel: string;
}

const TIER_COLOR: Record<'S' | 'A' | 'B' | 'C', string> = {
  S: '#FBBF24',
  A: '#22D3EE',
  B: '#A78BFA',
  C: '#FD7A6F',
};

/**
 * 1080×1080 (1:1) square card optimised for IG/Twitter share.
 *
 * Rendered offscreen by /result then snapshotted via html-to-image —
 * MUST use inline styles (not CSS modules / Tailwind classes) so the
 * output PNG is self-contained. html-to-image needs computed styles
 * on the cloned subtree; Tailwind utilities resolve fine in dev but
 * have caused issues with `clip-path` + gradient text in production
 * builds. Inline is safer.
 *
 * Fonts: relies on Orbitron/JetBrains/Kanit already loaded via the
 * root layout <link>. html-to-image inlines the font in the cloned
 * tree once they've rendered to the DOM at least once.
 */
const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(props, ref) {
  const {
    score,
    tier,
    distanceLabel,
    targetName,
    runTotal,
    tribeEmoji,
    tribeName,
    dateLabel,
  } = props;
  const accent = TIER_COLOR[tier];

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1080,
        background: 'radial-gradient(circle at 20% 0%, rgba(167,139,250,0.25), transparent 55%), radial-gradient(circle at 80% 100%, rgba(34,211,238,0.20), transparent 55%), #05030a',
        position: 'relative',
        overflow: 'hidden',
        color: '#e5e7ff',
        fontFamily: 'Kanit, system-ui, sans-serif',
        padding: 60,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Hex bg pattern — subtle */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'%3E%3Cpath d='M30 0L60 17v18L30 52 0 35V17z' fill='none' stroke='%23A78BFA' stroke-width='0.6' opacity='0.18'/%3E%3C/svg%3E\")",
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18 }}>
        <svg width="64" height="64" viewBox="0 0 46 46">
          <polygon points="23,2 42,13 42,33 23,44 4,33 4,13" fill="none" stroke="#22D3EE" strokeWidth="2" />
          <polygon points="23,8 36,16 36,30 23,38 10,30 10,16" fill="rgba(34,211,238,.2)" />
          <text x="23" y="29" textAnchor="middle" fill="#22D3EE" fontSize="14" fontWeight="800" fontFamily="Orbitron">
            CH
          </text>
        </svg>
        <div>
          <div
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: '0.14em',
              color: '#22D3EE',
            }}
          >
            COIN HUNTER
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 14,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.2em',
            }}
          >
            // BANGKOK_GRID
          </div>
        </div>
      </div>

      {/* Center — big tier letter + score */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginTop: 30,
        }}
      >
        <div
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 800,
            fontSize: 380,
            lineHeight: 1,
            color: accent,
            textShadow: `0 0 80px ${accent}AA, 0 0 30px ${accent}66`,
          }}
        >
          {tier}
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 18,
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.5)',
            marginTop: 10,
          }}
        >
          ▸ TIER_{tier} // {distanceLabel} FROM TARGET
        </div>

        <div
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 800,
            fontSize: 120,
            lineHeight: 1,
            marginTop: 40,
            background: 'linear-gradient(90deg, #22D3EE, #A78BFA, #FBBF24)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {score.toLocaleString()}
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 16,
            letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.5)',
            marginTop: 6,
          }}
        >
          ▸ XP_CREDITS
        </div>
      </div>

      {/* Target reveal */}
      <div
        style={{
          padding: '16px 24px',
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.5)',
          clipPath: 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 14,
            color: 'rgba(251,191,36,0.7)',
            letterSpacing: '0.2em',
          }}
        >
          ▸ TARGET_REVEAL
        </div>
        <div
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 700,
            fontSize: 36,
            color: '#FBBF24',
            letterSpacing: '0.1em',
            marginTop: 4,
          }}
        >
          {targetName.toUpperCase().replace(/ /g, '_')}
        </div>
      </div>

      {/* Footer row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 24,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 16,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.15em',
        }}
      >
        <span>▸ RUN_TOTAL {runTotal.toLocaleString()}</span>
        <span>
          {tribeEmoji} {tribeName}
        </span>
        <span>// {dateLabel}</span>
      </div>
    </div>
  );
});

export default ShareCard;
