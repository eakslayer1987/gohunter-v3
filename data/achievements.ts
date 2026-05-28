import type { Achievement } from '@/types';

/** Achievement catalog. The unlock condition lives in the store's
 *  checkAchievements() switch — keeping data + logic split lets the
 *  catalog stay a pure declarative list while the matching predicates
 *  can read whatever store state they need (player, runHistory, etc.).
 *
 *  To add a new card: append here AND add a `case` in checkAchievements. */
export const ACHIEVEMENT_CATALOG: Omit<Achievement, 'unlockedAt'>[] = [
  {
    id: 'first_blood',
    name: 'FIRST_BLOOD',
    description: 'จบ contract แรกของคุณ',
    icon: '🎯',
  },
  {
    id: 'bullseye',
    name: 'BULLSEYE',
    description: 'ปักหมุดใกล้เป้าหมาย ≤50m (tier S)',
    icon: '🎖️',
  },
  {
    id: 'perfectionist',
    name: 'PERFECTIONIST',
    description: 'จบ contract ด้วย tier S ทุก mission',
    icon: '👑',
  },
  {
    id: 'marathon',
    name: 'MARATHON',
    description: 'จบ contract ครบ 10 รอบ',
    icon: '🏃',
  },
  {
    id: 'streaker',
    name: 'STREAKER',
    description: 'streak ติดต่อกัน 5 mission (score ≥500)',
    icon: '🔥',
  },
  {
    id: 'explorer_10',
    name: 'EXPLORER_10',
    description: 'เยือน 10 สถานที่ไม่ซ้ำ',
    icon: '🗺️',
  },
  {
    id: 'explorer_all',
    name: 'EXPLORER_ALL',
    description: 'เยือนครบทุกสถานที่ใน Bangkok Grid',
    icon: '🌐',
  },
  {
    id: 'tribe_rover',
    name: 'TRIBE_ROVER',
    description: 'เล่น contract ด้วยทั้ง 4 tribe (Wolf/Lion/Falcon/Shark)',
    icon: '🐺',
  },
  {
    id: 'daily_devotee',
    name: 'DAILY_DEVOTEE',
    description: 'login streak ติดต่อกัน 7 วัน',
    icon: '📅',
  },
  {
    id: 'gold_hoarder',
    name: 'GOLD_HOARDER',
    description: 'สะสม credits ถึง 10,000 CR',
    icon: '💰',
  },
  {
    id: 'pet_max',
    name: 'PET_MAX',
    description: 'พา companion วิวัฒนาการเป็น S4 แมวจักรวาล',
    icon: '🦁',
  },
];
