'use client';

/** Holy Coin centerpiece with 3 tilted orbital rings + drifting glow
 *  dots. Pure CSS — no asset pipeline. Each ring is an absolute-
 *  positioned div clipped to an ellipse via rotateX(72deg), spun
 *  around Z axis at different speeds, with small dot children riding
 *  along the rim. Outer halo + tick marks on the gold mid-ring give
 *  the "hovering sigil" feel from the reference render. */
export default function HolyCoinAura() {
  return (
    <div
      className="relative animate-hover-float"
      style={{
        width: '360px',
        height: '360px',
        perspective: '900px',
      }}
    >
      {/* Outer glow halo — soft radial behind everything */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,194,60,0.35), rgba(255,43,187,0.15) 45%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Orbit 1 — outer cyan ring, slow CCW */}
      <Orbit color="rgba(34,211,238,0.45)" inset={0} spin="ccw" speed={18}>
        <Dot color="#22D3EE" angleStyle={{ top: 0, left: '50%', transform: 'translateX(-50%)' }} size={6} />
        <Dot color="#FBBF24" angleStyle={{ top: '50%', right: 0, transform: 'translateY(-50%)' }} size={7} />
        <Dot color="#22D3EE" angleStyle={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }} size={5} />
        <Dot color="#A78BFA" angleStyle={{ top: '50%', left: 0, transform: 'translateY(-50%)' }} size={6} />
      </Orbit>

      {/* Orbit 2 — middle gold ring with tick marks, CW */}
      <Orbit color="rgba(251,191,36,0.55)" inset={30} spin="cw" speed={14} withTicks>
        <Dot color="#FBBF24" angleStyle={{ top: 0, left: '50%', transform: 'translateX(-50%)' }} size={7} />
        <Dot color="#FF35E6" angleStyle={{ top: '30%', right: '6%' }} size={6} />
        <Dot color="#FBBF24" angleStyle={{ bottom: '20%', left: '8%' }} size={5} />
      </Orbit>

      {/* Orbit 3 — inner magenta ring, fast CCW */}
      <Orbit color="rgba(255,43,187,0.5)" inset={60} spin="ccw" speed={10}>
        <Dot color="#FF35E6" angleStyle={{ top: 0, left: '50%', transform: 'translateX(-50%)' }} size={6} />
        <Dot color="#22D3EE" angleStyle={{ bottom: '20%', right: '20%' }} size={5} />
        <Dot color="#FBBF24" angleStyle={{ bottom: '30%', left: '15%' }} size={5} />
      </Orbit>

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
            width: '230px',
            height: '230px',
            objectFit: 'contain',
            transform: 'rotate(-8deg)',
            transformOrigin: 'center center',
          }}
          onError={(e) => {
            // Fallback to CSS coin if image missing
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}

interface OrbitProps {
  color: string;
  /** Insets from the wrapper's 360px box. */
  inset: number;
  spin: 'cw' | 'ccw';
  /** Animation duration in seconds. */
  speed: number;
  /** Add 8 tick marks evenly around the rim (decoration for the gold ring). */
  withTicks?: boolean;
  children?: React.ReactNode;
}

function Orbit({ color, inset, spin, speed, withTicks, children }: OrbitProps) {
  const animName = spin === 'cw' ? 'orbit-spin-cw' : 'orbit-spin-ccw';
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        inset,
        borderRadius: '50%',
        border: `1px solid ${color}`,
        // rotateX flattens the circle into an ellipse (perspective ring);
        // the Z spin happens via keyframes that include the same rotateX.
        transform: 'rotateX(70deg)',
        transformStyle: 'preserve-3d',
        animation: `${animName} ${speed}s linear infinite`,
        boxShadow: `0 0 14px ${color}, inset 0 0 18px ${color.replace(/0?\.\d+/, '0.18')}`,
      }}
    >
      {withTicks && (
        <>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '2px',
                height: '8px',
                background: color,
                transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-${50}%)`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </>
      )}
      {children}
      <style jsx>{`
        @keyframes orbit-spin-cw {
          from { transform: rotateX(70deg) rotateZ(0deg); }
          to   { transform: rotateX(70deg) rotateZ(360deg); }
        }
        @keyframes orbit-spin-ccw {
          from { transform: rotateX(70deg) rotateZ(0deg); }
          to   { transform: rotateX(70deg) rotateZ(-360deg); }
        }
      `}</style>
    </div>
  );
}

interface DotProps {
  color: string;
  /** Where on the orbit rim — top/right/bottom/left or pct. */
  angleStyle: React.CSSProperties;
  size: number;
}

function Dot({ color, angleStyle, size }: DotProps) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}, 0 0 14px ${color}`,
        ...angleStyle,
      }}
    />
  );
}
