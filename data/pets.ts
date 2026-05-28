import type { PetStage } from '@/types';

/** Pet stage metadata — drives emoji, display name, skill timbre, and
 *  the level threshold that promotes the pet to that stage. Mirrors
 *  the design table in CLAUDE.md but stripped to v3's mechanics
 *  (no luck / crystals / coin shrink — just cooldown + radius). */
export interface PetStageMeta {
  stage: PetStage;
  /** Thai display name (ลูกแมว / แมวลาย / แมวเวทย์ / แมวจักรวาล). */
  name: string;
  /** Emoji used in HUD + share card + companion panel. */
  emoji: string;
  /** Minimum pet.level required to enter this stage. Auto-promote
   *  fires from addPetExp() inside the store. */
  levelRequired: number;
  /** Skill metadata copied onto pet.skill when this stage activates. */
  skill: {
    name: string;
    description: string;
    /** Cooldown in seconds — gets shorter at higher stages. */
    cooldown: number;
  };
}

export const PET_STAGES: PetStageMeta[] = [
  {
    stage: 'S1',
    name: 'ลูกแมว',
    emoji: '🐱',
    levelRequired: 1,
    skill: {
      name: 'RADAR_SCAN',
      description: 'เผยโซน 500m รอบเหรียญใน 5 วินาที',
      cooldown: 120,
    },
  },
  {
    stage: 'S2',
    name: 'แมวลาย',
    emoji: '😺',
    levelRequired: 5,
    skill: {
      name: 'RADAR_SCAN+',
      description: 'เผยโซน 750m ใน 7 วินาที · cooldown สั้นลง',
      cooldown: 90,
    },
  },
  {
    stage: 'S3',
    name: 'แมวเวทย์',
    emoji: '😼',
    levelRequired: 10,
    skill: {
      name: 'MYSTIC_SCAN',
      description: 'เผยโซน 1km + bearing arrow ชี้ทาง',
      cooldown: 60,
    },
  },
  {
    stage: 'S4',
    name: 'แมวจักรวาล',
    emoji: '🦁',
    levelRequired: 20,
    skill: {
      name: 'COSMIC_ROAR',
      description: 'เผยทั้ง quadrant + free peek 5 วินาที',
      cooldown: 45,
    },
  },
];

export function getPetStageMeta(stage: PetStage): PetStageMeta {
  return PET_STAGES.find((s) => s.stage === stage) ?? PET_STAGES[0];
}

/** Highest stage the pet has earned given its current level. Used by
 *  addPetExp to auto-promote after level-up. */
export function stageForLevel(level: number): PetStageMeta {
  let highest = PET_STAGES[0];
  for (const meta of PET_STAGES) {
    if (level >= meta.levelRequired) highest = meta;
  }
  return highest;
}

/** Next stage the pet is working toward, or null if already maxed. */
export function nextStageMeta(currentStage: PetStage): PetStageMeta | null {
  const idx = PET_STAGES.findIndex((s) => s.stage === currentStage);
  if (idx < 0 || idx + 1 >= PET_STAGES.length) return null;
  return PET_STAGES[idx + 1];
}
