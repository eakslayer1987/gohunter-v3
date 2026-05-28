'use client';

import { useEffect, useState } from 'react';

/** Holy Coin centerpiece — v3.
 *  Layered concentric SVG rings (cyan outer + magenta arcs + dashed gold +
 *  inner gold), all flat (no tilt) so the spin reads as a true halo rather
 *  than an orbiting plate. Sparkles dust pattern overlays around the coin.
 *
 *  Responsive sizing: shrinks on lg (~1024-1279px) where the coin column
 *  is only 280px wide, expands on xl+ where it gets 320px+. */
export default function HolyCoinAura() {
  const [isXl, setIsXl] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const update = () => setIsXl(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Scale factor — xl gives full-size rings (matches design ref), lg trims.
  const scale = isXl ? 1 : 0.8;
  const wrapper = Math.round(420 * scale);
  const coin = Math.round(240 * scale);

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: wrapper, height: wrapper }}
    >
      {/* Ambient purple halo behind everything */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          width: Math.round(380 * scale),
          height: Math.round(380 * scale),
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(167,139,250,0.30) 0%, rgba(116,58,255,0.18) 35%, rgba(255,43,187,0.10) 55%, transparent 72%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Outermost thin cyan ring — slow CCW drift */}
      <svg
        width={Math.round(400 * scale)}
        height={Math.round(400 * scale)}
        viewBox="0 0 400 400"
        className="absolute"
        style={{ animation: 'spin 80s linear infinite reverse' }}
        aria-hidden
      >
        <circle cx="200" cy="200" r="195" fill="none" stroke="#22D3EE" strokeWidth="1" opacity="0.45" />
      </svg>

      {/* Magenta accent arcs — slow CW spin, neon drop-shadow */}
      <svg
        width={Math.round(384 * scale)}
        height={Math.round(384 * scale)}
        viewBox="0 0 384 384"
        className="absolute"
        style={{
          animation: 'spin 40s linear infinite',
          filter: 'drop-shadow(0 0 8px rgba(255,53,230,0.7))',
        }}
        aria-hidden
      >
        <path
          d="M 76 192 A 116 116 0 0 1 192 76"
          fill="none"
          stroke="#FF35E6"
          strokeWidth="1.5"
          opacity="0.85"
          strokeLinecap="round"
        />
        <path
          d="M 308 192 A 116 116 0 0 1 192 308"
          fill="none"
          stroke="#FF35E6"
          strokeWidth="1.5"
          opacity="0.85"
          strokeLinecap="round"
        />
      </svg>

      {/* Dashed gold ring — slow CCW */}
      <svg
        width={Math.round(352 * scale)}
        height={Math.round(352 * scale)}
        viewBox="0 0 352 352"
        className="absolute"
        style={{ animation: 'spin 55s linear infinite reverse' }}
        aria-hidden
      >
        <circle
          cx="176"
          cy="176"
          r="168"
          fill="none"
          stroke="#FBBF24"
          strokeWidth="0.8"
          strokeDasharray="2 6"
          opacity="0.55"
        />
      </svg>

      {/* Inner gold ring — stationary, just glows */}
      <svg
        width={Math.round(320 * scale)}
        height={Math.round(320 * scale)}
        viewBox="0 0 320 320"
        className="absolute"
        style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }}
        aria-hidden
      >
        <circle cx="160" cy="160" r="152" fill="none" stroke="#FBBF24" strokeWidth="0.8" opacity="0.55" />
      </svg>

      {/* The coin itself — float + tilt preserved */}
      <div
        className="relative animate-hover-float"
        style={{
          width: coin,
          height: coin,
          zIndex: 2,
          filter:
            'drop-shadow(0 0 36px rgba(255,194,60,0.7)) drop-shadow(0 0 60px rgba(255,43,187,0.4))',
        }}
      >
        <img
          src="/assets/img/holy-coin.png"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: 'rotate(-8deg)',
            transformOrigin: 'center center',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      <Sparkles scale={scale} />
    </div>
  );
}

/** Scattered dust — gold + magenta dots, varying sizes, gentle float.
 *  Pure positioned dots — no spinning, contrasts the rings' rotation. */
function Sparkles({ scale }: { scale: number }) {
  const pts: Array<{ x: number; y: number; c: string; s: number }> = [
    { x: 6, y: 22, c: '#FBBF24', s: 3 }, { x: 94, y: 18, c: '#FBBF24', s: 4 },
    { x: 4, y: 56, c: '#FBBF24', s: 3 }, { x: 96, y: 52, c: '#FBBF24', s: 3 },
    { x: 12, y: 84, c: '#FBBF24', s: 4 }, { x: 88, y: 80, c: '#FBBF24', s: 3 },
    { x: 50, y: 8, c: '#FBBF24', s: 3 }, { x: 48, y: 92, c: '#FBBF24', s: 3 },
    { x: 18, y: 40, c: '#FF35E6', s: 3 }, { x: 82, y: 36, c: '#FF35E6', s: 3 },
    { x: 26, y: 70, c: '#FF35E6', s: 2 }, { x: 76, y: 66, c: '#FF35E6', s: 2 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {pts.map((p, i) => {
        const size = Math.max(2, Math.round(p.s * scale));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: p.c,
              boxShadow: `0 0 ${size * 4}px ${p.c}`,
              opacity: 0.85,
              animation: `hover-float ${1.6 + (i % 4) * 0.35}s ease-in-out infinite`,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        );
      })}
    </div>
  );
}
