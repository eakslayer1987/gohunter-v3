'use client';

interface Props {
  accent?: 'cyan' | 'violet' | 'gold';
  withRadar?: boolean;
}

export default function CyberBackdrop({ accent = 'violet', withRadar = false }: Props) {
  const color = accent === 'gold' ? '#FBBF24' : accent === 'cyan' ? '#22D3EE' : '#A78BFA';
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1400 800"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 opacity-40 pointer-events-none"
    >
      <defs>
        <pattern id="hex-pattern" width="60" height="52" patternUnits="userSpaceOnUse">
          <path
            d="M30 0L60 17v18L30 52 0 35V17z"
            fill="none"
            stroke={color}
            strokeWidth="0.4"
            opacity="0.35"
          />
        </pattern>
      </defs>
      <rect width="1400" height="800" fill="url(#hex-pattern)" />
      {withRadar && (
        <g stroke="#22D3EE" strokeWidth="0.5" opacity="0.3" fill="none">
          <circle cx="700" cy="400" r="200" />
          <circle cx="700" cy="400" r="280" />
          <circle cx="700" cy="400" r="360" />
          <line x1="0" y1="400" x2="1400" y2="400" />
          <line x1="700" y1="0" x2="700" y2="800" />
        </g>
      )}
    </svg>
  );
}
