/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cyber Hunter palette — matches colors_and_type.css tokens
        base: {
          DEFAULT: '#0a0612',
          deep: '#05030a',
          panel: 'rgba(10,6,18,0.85)',
        },
        cyber: {
          cyan: '#22D3EE',
          violet: '#A78BFA',
          gold: '#FBBF24',
          red: '#FD1803',
          green: '#4ade80',
          orange: '#FD7A2F',
        },
        tribe: {
          wolf: '#FD1803',
          lion: '#FD7A2F',
          falcon: '#4ade80',
          shark: '#00D9FF',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'Kanit', 'system-ui', 'sans-serif'],
        sans: ['Kanit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Courier New', 'monospace'],
      },
      letterSpacing: {
        cyber: '0.14em',
        widest2: '0.2em',
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
        'pulse-dot': 'pulse-dot 2s infinite',
        'hover-float': 'hover-float 2.4s ease-in-out infinite',
        'shimmer-bg': 'shimmer-bg 4s linear infinite',
        'scan-line': 'scan-line 5s linear infinite',
        'glitch-flicker': 'glitch-flicker 3s infinite',
        'spin-slow': 'spin 8s linear infinite',
        'drift-up': 'drift-up linear infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'translate(-50%,-50%) scale(0.3)', opacity: '1' },
          '100%': { transform: 'translate(-50%,-50%) scale(2.3)', opacity: '0' },
        },
        'pulse-dot': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(34,211,238,0.7)' },
          '50%': { boxShadow: '0 0 0 10px rgba(34,211,238,0)' },
        },
        'hover-float': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        'shimmer-bg': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'glitch-flicker': {
          '0%,100%': { opacity: '1' },
          '48%': { opacity: '0.7' },
          '50%': { opacity: '1' },
          '52%': { opacity: '0.85' },
          '54%': { opacity: '1' },
        },
        'drift-up': {
          '0%': { transform: 'translateY(100vh)' },
          '100%': { transform: 'translateY(-10vh)' },
        },
      },
    },
  },
  plugins: [],
};
