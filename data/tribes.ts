import type { Tribe } from '@/types';

export const TRIBES: Tribe[] = [
  {
    id: 'wolf',
    name: 'WOLF',
    emoji: '🐺',
    color: '#FD1803',
    bonus: { type: 'speed', value: 15 },
    bonusLabel: 'SPEED +15%',
  },
  {
    id: 'lion',
    name: 'LION',
    emoji: '🦁',
    color: '#FD7A2F',
    bonus: { type: 'power', value: 20 },
    bonusLabel: 'POWER +20%',
  },
  {
    id: 'falcon',
    name: 'FALCON',
    emoji: '🦅',
    color: '#4ade80',
    bonus: { type: 'vision', value: 25 },
    bonusLabel: 'VISION +25%',
  },
  {
    id: 'shark',
    name: 'SHARK',
    emoji: '🦈',
    color: '#00D9FF',
    bonus: { type: 'hunt', value: 18 },
    bonusLabel: 'HUNT +18%',
  },
];

export const getTribe = (id: string) => TRIBES.find((t) => t.id === id) ?? TRIBES[0];
