'use client';

import { useEffect, useState } from 'react';

interface Props {
  count?: number;
}

interface ParticleSpec {
  key: number;
  left: string;
  size: number;
  duration: string;
  delay: string;
}

/** Drifting coin particles backdrop. Random positions/timings are
 *  generated only after mount — server-side render and the initial
 *  client render both produce an empty container so React's hydration
 *  pass doesn't see Math.random() mismatches. */
export default function Particles({ count = 8 }: Props) {
  const [particles, setParticles] = useState<ParticleSpec[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        key: i,
        left: (Math.random() * 100).toFixed(1),
        size: 5 + Math.floor(Math.random() * 6),
        duration: (8 + Math.random() * 7).toFixed(1),
        delay: (Math.random() * 6).toFixed(1),
      })),
    );
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
      {particles.map((p) => (
        <div
          key={p.key}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
