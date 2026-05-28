'use client';

/** Holy Coin centerpiece — gently-tilted concentric orbital rings
 *  scattered with many small glow dots. Pure CSS — each dot is
 *  placed via translate+rotate+translate trick so they distribute
 *  evenly around the rim regardless of ring radius. */
export default function HolyCoinAura() {
  return (
    <div
      className="relative animate-hover-float"
      style={{
        width: '380px',
        height: '380px',
        perspective: '1200px',
      }}
    >
      {/* Outer glow halo */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,194,60,0.35), rgba(255,43,187,0.15) 45%, transparent 70%)',
          filter: 'blur(10px)',
        }}
      />

      {/* OUTER RING — bigger, slow CCW, lots of dots + ticks */}
      <Orbit
        radius={190}
        spin="ccw"
        speed={26}
        tilt={22}
        color="rgba(255,194,60,0.45)"
        dotPattern={outerDots}
        withTicks
      />

      {/* INNER RING — tighter, CW faster, fewer but punchier dots */}
      <Orbit
        radius={155}
        spin="cw"
        speed={18}
        tilt={22}
        color="rgba(255,43,187,0.45)"
        dotPattern={innerDots}
      />

      {/* Center coin */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          filter:
            'drop-shadow(0 0 36px rgba(255,194,60,0.65)) drop-shadow(0 0 64px rgba(255,43,187,0.35))',
        }}
      >
        <img
          src="/assets/img/holy-coin.png"
          alt=""
          style={{
            width: '240px',
            height: '240px',
            objectFit: 'contain',
            transform: 'rotate(-8deg)',
            transformOrigin: 'center center',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}

interface DotSpec {
  /** Angle in degrees, 0 = top, going clockwise. */
  angle: number;
  /** px diameter. */
  size: number;
  /** CSS colour string (also used for glow). */
  color: string;
}

/** 18 dots around the outer rim — gold-heavy with a few cyan/violet
 *  accents at irregular spacing so it doesn't look mechanical. */
const outerDots: DotSpec[] = [
  { angle: 0,   size: 4, color: '#FBBF24' },
  { angle: 18,  size: 3, color: '#FBBF24' },
  { angle: 38,  size: 5, color: '#22D3EE' },
  { angle: 60,  size: 3, color: '#FBBF24' },
  { angle: 82,  size: 4, color: '#FBBF24' },
  { angle: 105, size: 3, color: '#FF35E6' },
  { angle: 128, size: 4, color: '#FBBF24' },
  { angle: 150, size: 5, color: '#22D3EE' },
  { angle: 172, size: 3, color: '#FBBF24' },
  { angle: 195, size: 4, color: '#FBBF24' },
  { angle: 218, size: 3, color: '#FF35E6' },
  { angle: 240, size: 5, color: '#FBBF24' },
  { angle: 262, size: 4, color: '#22D3EE' },
  { angle: 282, size: 3, color: '#FBBF24' },
  { angle: 302, size: 5, color: '#FBBF24' },
  { angle: 322, size: 3, color: '#FF35E6' },
  { angle: 340, size: 4, color: '#FBBF24' },
  { angle: 355, size: 3, color: '#22D3EE' },
];

/** 10 dots on the inner ring — more magenta-leaning since it's the
 *  faster ring closer to the coin. */
const innerDots: DotSpec[] = [
  { angle: 12,  size: 4, color: '#FF35E6' },
  { angle: 48,  size: 3, color: '#FBBF24' },
  { angle: 80,  size: 5, color: '#FF35E6' },
  { angle: 115, size: 3, color: '#22D3EE' },
  { angle: 148, size: 4, color: '#FF35E6' },
  { angle: 188, size: 3, color: '#FBBF24' },
  { angle: 220, size: 5, color: '#FF35E6' },
  { angle: 252, size: 3, color: '#22D3EE' },
  { angle: 290, size: 4, color: '#FF35E6' },
  { angle: 328, size: 3, color: '#FBBF24' },
];

interface OrbitProps {
  /** Distance from wrapper center to ring rim (px). */
  radius: number;
  spin: 'cw' | 'ccw';
  /** Animation duration in seconds. */
  speed: number;
  /** Perspective tilt (rotateX) in degrees. 0 = flat circle, 90 = edge-on. */
  tilt: number;
  /** Ring border colour (will be reused for inset glow). */
  color: string;
  /** Dots placed on the rim — see DotSpec. */
  dotPattern: DotSpec[];
  /** Add tick marks every 30° (decoration for the outer ring). */
  withTicks?: boolean;
}

function Orbit({ radius, spin, speed, tilt, color, dotPattern, withTicks }: OrbitProps) {
  const size = radius * 2;
  const dir = spin === 'cw' ? 360 : -360;
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        top: '50%',
        left: '50%',
        width: size,
        height: size,
        marginLeft: -radius,
        marginTop: -radius,
        borderRadius: '50%',
        border: `1px solid ${color}`,
        boxShadow: `0 0 14px ${color}, inset 0 0 12px ${color}`,
        transform: `rotateX(${tilt}deg)`,
        transformStyle: 'preserve-3d',
        animation: `orbit-${spin}-${speed} ${speed}s linear infinite`,
      }}
    >
      {/* Tick marks every 30° — short radial dashes */}
      {withTicks &&
        Array.from({ length: 12 }).map((_, i) => (
          <span
            key={`tick-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '2px',
              height: '10px',
              background: color,
              transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-${radius - 2}px)`,
              transformOrigin: 'center',
              opacity: 0.7,
            }}
          />
        ))}
      {/* Dots — placed on rim via rotate+translate trick */}
      {dotPattern.map((d, i) => (
        <span
          key={`dot-${i}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: d.size,
            height: d.size,
            borderRadius: '50%',
            background: d.color,
            boxShadow: `0 0 6px ${d.color}, 0 0 10px ${d.color}`,
            transform: `translate(-50%, -50%) rotate(${d.angle}deg) translateY(-${radius}px)`,
            transformOrigin: 'center',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes orbit-${spin}-${speed} {
          from { transform: rotateX(${tilt}deg) rotateZ(0deg); }
          to   { transform: rotateX(${tilt}deg) rotateZ(${dir}deg); }
        }
      `}</style>
    </div>
  );
}
