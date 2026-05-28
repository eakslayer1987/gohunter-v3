'use client';

interface Props {
  /** Square px box. Default 80 — used in CompanionPanel. /profile uses
   *  larger sizes (120-160), /play uses smaller (48). */
  size?: number;
  /** Toggle the slow halo spin behind the body. Off for tiny instances. */
  withHalo?: boolean;
  /** Optional tint shift per pet stage: S1 base purple, S2/S3/S4 lean
   *  more cosmic (cyan + pink mix intensifies). Default 'S1'. */
  stage?: 'S1' | 'S2' | 'S3' | 'S4';
}

/** Jelly Cat visual — CSS/SVG-drawn bell-shape blob with multi-radial
 *  gradient body and two glowing eyes. Replaces the placeholder cat
 *  emoji in CompanionPanel et al. to match the design mockup.
 *
 *  Pure CSS — no asset pipeline needed. Scales cleanly via the `size`
 *  prop. Stage prop nudges body shadow intensity so higher stages
 *  read as more powerful without needing a separate asset per stage. */
export default function JellyCat({ size = 80, withHalo = true, stage = 'S1' }: Props) {
  const haloIntensity = stage === 'S4' ? 0.55 : stage === 'S3' ? 0.5 : stage === 'S2' ? 0.45 : 0.4;
  const bodyShadow =
    stage === 'S4'
      ? '0 0 36px #ff35e6, 0 0 18px #00eaff'
      : stage === 'S3'
      ? '0 0 30px #b428ff, 0 0 14px #00eaff'
      : stage === 'S2'
      ? '0 0 26px #9d28ff, 0 0 12px #00eaff'
      : '0 0 24px #8d28ff, 0 0 10px #00eaff';

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Outer slow-spin halo */}
      {withHalo && (
        <div
          className="absolute inset-0 rounded-full animate-spin-slow"
          style={{
            background: `radial-gradient(circle, rgba(141,40,255,${haloIntensity}), transparent 65%)`,
          }}
        />
      )}
      {/* Jelly body — bell shape (rounded top, slightly flat bottom).
          Stacked radial gradients give the highlights + dark base. */}
      <div
        className="absolute inset-[10%] animate-hover-float"
        style={{
          background:
            'radial-gradient(circle at 35% 26%, #ffa5ff, transparent 14%), radial-gradient(circle at 65% 28%, #c1f6ff, transparent 14%), radial-gradient(circle at 50% 60%, #36195b, #120024 72%)',
          borderRadius: '48% 48% 38% 38%',
          boxShadow: bodyShadow,
        }}
      >
        {/* Left eye (pink-tinged) */}
        <div
          className="absolute"
          style={{
            top: '32%',
            left: '28%',
            width: '15%',
            height: '15%',
            background: 'radial-gradient(circle, #ffffff 30%, #ffa5ff 80%)',
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(255,165,255,0.9)',
          }}
        />
        {/* Right eye (cyan-tinged) */}
        <div
          className="absolute"
          style={{
            top: '32%',
            right: '28%',
            width: '15%',
            height: '15%',
            background: 'radial-gradient(circle, #ffffff 30%, #c1f6ff 80%)',
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(0,234,255,0.9)',
          }}
        />
        {/* Cosmic dust speck on body — only at S3+ for "evolved" feel */}
        {(stage === 'S3' || stage === 'S4') && (
          <div
            className="absolute"
            style={{
              top: '60%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '6%',
              height: '6%',
              background: '#FBBF24',
              borderRadius: '50%',
              boxShadow: '0 0 8px #FBBF24',
            }}
          />
        )}
      </div>
      {/* Floor glow disc */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '10%',
          right: '10%',
          bottom: '-4%',
          height: '12%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(141,40,255,0.45), transparent 70%)',
          filter: 'blur(2px)',
        }}
      />
    </div>
  );
}
