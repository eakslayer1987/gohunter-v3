import type { TribeId, ScoreBreakdown } from '@/types';

// Haversine distance in meters
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface ScoreBand {
  base: number;
  band: string;
  tier: 'S' | 'A' | 'B' | 'C';
  color: string;
}

export function scoreFromDistance(meters: number): ScoreBand {
  if (meters <= 50) return { base: 1000, band: 'BULLSEYE', tier: 'S', color: '#FBBF24' };
  if (meters <= 200) return { base: 800, band: 'EXCELLENT', tier: 'A', color: '#22D3EE' };
  if (meters <= 500) return { base: 500, band: 'GOOD', tier: 'B', color: '#A78BFA' };
  return { base: 100, band: 'CLOSE', tier: 'C', color: '#FD7A6F' };
}

export function computeTotalScore(opts: {
  base: number;
  remainingSeconds: number;
  totalSeconds: number;
  hintsUsed: number;
  streak: number;
  tribe: TribeId;
  distanceMeters: number;
}): ScoreBreakdown {
  const { base, remainingSeconds, totalSeconds, hintsUsed, streak, tribe, distanceMeters } = opts;

  const speedRatio = Math.max(0, remainingSeconds / totalSeconds);
  const speedBonus = Math.round(base * speedRatio * 0.25);
  const noHintBonus = hintsUsed === 0 ? Math.round(base * 0.15) : 0;
  const streakBonus = Math.min(streak, 10) * 30;

  // Tribe bonuses applied based on type
  let tribeBonus = 0;
  if (tribe === 'wolf') {
    // SPEED +15% → 15% extra on speed bonus
    tribeBonus = Math.round(speedBonus * 0.15);
  } else if (tribe === 'lion') {
    // POWER +20% → 20% extra on base if within 200m
    if (distanceMeters <= 200) tribeBonus = Math.round(base * 0.2);
  } else if (tribe === 'falcon') {
    // VISION +25% → 25% extra on noHint bonus
    tribeBonus = Math.round(noHintBonus * 0.25);
  } else if (tribe === 'shark') {
    // HUNT +18% → 18% extra on streak bonus
    tribeBonus = Math.round(streakBonus * 0.18);
  }

  return {
    base,
    speedBonus,
    noHintBonus,
    streakBonus,
    tribeBonus,
    total: base + speedBonus + noHintBonus + streakBonus + tribeBonus,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} ม.`;
  return `${(m / 1000).toFixed(2)} กม.`;
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function randomAgentId(): string {
  const r = Math.floor(1000 + Math.random() * 9000);
  return `${r}-EAK`;
}
