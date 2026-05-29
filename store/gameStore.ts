'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerState, Pet, Mission, LeaderboardEntry, Location, TribeId, ScoreBreakdown, RunHistoryEntry, Achievement } from '@/types';
import { BANGKOK_LOCATIONS, INITIAL_LEADERBOARD, MATCHES } from '@/data/locations';
import { ACHIEVEMENT_CATALOG } from '@/data/achievements';
import { stageForLevel } from '@/data/pets';
import { distanceMeters, todayKey, randomAgentId } from '@/lib/utils';
import { useToastStore } from '@/store/toastStore';
import { useSettingsStore } from '@/store/settingsStore';
import { playUnlock } from '@/lib/sound';

interface GameStore {
  // Player
  player: PlayerState;
  setNickname: (name: string) => void;
  setTribe: (tribe: TribeId) => void;
  addStamina: (n: number) => void;
  spendStamina: (n: number) => boolean;
  regenStamina: () => void;
  /** Generates and persists an agentId the first time it's called, no-op
   *  otherwise. Splitting random ID generation out of DEFAULT_PLAYER
   *  avoids the SSR/CSR hydration mismatch you get when randomAgentId()
   *  runs at module-load time in both environments and produces
   *  different values. */
  ensureAgentId: () => void;
  addCredits: (n: number) => void;
  addScore: (n: number) => void;
  addXp: (n: number) => void;
  bumpStreak: () => void;
  resetStreak: () => void;

  // Pet
  pet: Pet;
  feedPet: () => void;
  usePetSkill: () => boolean;
  petSkillReady: () => boolean;
  petSkillCooldownLeft: () => number;
  /** Add pet experience. Auto-levels (exp >= expToNext → level+1) and
   *  auto-promotes stage when the new level crosses a threshold in
   *  PET_STAGES. Emits toast + chime on stage change. */
  addPetExp: (n: number) => void;

  // Mission
  currentMatchId: string | null;
  missionsInMatch: Mission[];
  currentMissionIndex: number;
  startMatch: (matchId: string, locations: Location[]) => void;
  setPin: (lat: number, lng: number) => void;
  dragPin: (lat: number, lng: number) => void;
  /** Decrypt the next clue. Costs HINT_COST_CR credits (free in
   *  TEST_MODE). Returns false + leaves state untouched when the
   *  player can't afford it; UI surfaces an INSUFFICIENT toast. */
  useHint: () => boolean;
  extendTime: (seconds: number) => void;
  submitMission: (opts: {
    score: number;
    distance: number;
    remainingSeconds: number;
    breakdown?: ScoreBreakdown;
  }) => void;
  nextMission: () => boolean;
  exitMatch: () => void;

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  refreshLeaderboard: () => void;

  // Run history — most recent first, capped at 50 entries.
  runHistory: RunHistoryEntry[];
  recordRun: (entry: RunHistoryEntry) => void;
  clearRunHistory: () => void;

  // Achievements — full catalog, unlockedAt set per card.
  achievements: Achievement[];
  /** Re-evaluates every locked card against current state, unlocks any
   *  that match, and fires a success toast per new unlock. Idempotent —
   *  already-unlocked cards are skipped. Call after submit / login /
   *  credit changes. */
  checkAchievements: () => void;

  // Daily login
  checkDailyLogin: () => { rewarded: boolean; reward: number };

  // Pin energy
  pinEnergy: number;
  consumePinEnergy: (n: number) => void;
  refillPinEnergy: () => void;
}

const STAMINA_REGEN_INTERVAL_MS = 5 * 60 * 1000; // +1 stamina every 5 minutes
const RUN_HISTORY_CAP = 50;
const HINT_COST_CR = 50;

/** Distance → tier letter — mirrors lib/utils.ts scoreFromDistance
 *  thresholds. Duplicated to keep the store free of UI-tier coupling
 *  (utils.ts also exports band metadata; we only need the letter). */
function tierForDistance(m: number): 'S' | 'A' | 'B' | 'C' {
  if (m <= 50) return 'S';
  if (m <= 200) return 'A';
  if (m <= 500) return 'B';
  return 'C';
}

const DEFAULT_PLAYER: PlayerState = {
  nickname: 'พี่เอก',
  // Empty by default — populated on client mount via ensureAgentId().
  // Module-level randomAgentId() would differ between SSR + CSR.
  agentId: '',
  tribe: 'wolf',
  stamina: 80,
  maxStamina: 100,
  credits: 2840,
  streak: 0,
  totalScore: 0,
  weeklyScore: 2580,
  xp: 1240,
  xpToNext: 2000,
  level: 12,
  lastLogin: 0,
  loginStreak: 0,
  lastStaminaRegenAt: Date.now(),
};

const DEFAULT_PET: Pet = {
  name: 'มีคุง',
  stage: 'S1',
  level: 3,
  happiness: 70,
  exp: 120,
  expToNext: 200,
  skill: {
    name: 'RADAR_SCAN',
    description: 'เผยโซน 500m รอบเหรียญใน 5 วินาที',
    cooldown: 120,
    lastUsed: 0,
  },
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: DEFAULT_PLAYER,
      pet: DEFAULT_PET,
      currentMatchId: null,
      missionsInMatch: [],
      currentMissionIndex: 0,
      leaderboard: INITIAL_LEADERBOARD,
      runHistory: [],
      achievements: ACHIEVEMENT_CATALOG.map((a) => ({ ...a })),
      pinEnergy: 20,

      setNickname: (name) => set((s) => ({ player: { ...s.player, nickname: name } })),

      setTribe: (tribe) => set((s) => ({ player: { ...s.player, tribe } })),

      addStamina: (n) =>
        set((s) => ({
          player: {
            ...s.player,
            stamina: Math.min(s.player.maxStamina, s.player.stamina + n),
          },
        })),

      ensureAgentId: () => {
        if (get().player.agentId) return;
        set((s) => ({ player: { ...s.player, agentId: randomAgentId() } }));
      },

      spendStamina: (n) => {
        // TEST_MODE — bypass the stamina gate entirely so QA can play
        // contracts back-to-back without waiting on regen or DEV_REFILL.
        // Settings persists, so toggling off in /settings disables this.
        if (useSettingsStore.getState().testMode) return true;
        const cur = get().player.stamina;
        if (cur < n) return false;
        set((s) => {
          // First spend after being capped — start the regen clock NOW so the
          // player doesn't instantly bank hours of accumulated regen.
          const wasAtCap = s.player.stamina >= s.player.maxStamina;
          return {
            player: {
              ...s.player,
              stamina: s.player.stamina - n,
              lastStaminaRegenAt: wasAtCap ? Date.now() : s.player.lastStaminaRegenAt,
            },
          };
        });
        return true;
      },

      regenStamina: () => {
        set((s) => {
          // Capped — keep the timer pinned to "now" so the next spend starts
          // a fresh 5-minute window instead of unlocking a backlog.
          if (s.player.stamina >= s.player.maxStamina) {
            return { player: { ...s.player, lastStaminaRegenAt: Date.now() } };
          }
          const lastRegen = s.player.lastStaminaRegenAt ?? Date.now();
          const elapsed = Date.now() - lastRegen;
          const gained = Math.floor(elapsed / STAMINA_REGEN_INTERVAL_MS);
          if (gained <= 0) return s;
          const newStamina = Math.min(s.player.maxStamina, s.player.stamina + gained);
          // Advance the timestamp by exactly the amount credited so any
          // leftover < 5min window keeps accumulating toward the next point.
          const newTimestamp = lastRegen + gained * STAMINA_REGEN_INTERVAL_MS;
          return {
            player: {
              ...s.player,
              stamina: newStamina,
              lastStaminaRegenAt: newTimestamp,
            },
          };
        });
      },

      addCredits: (n) => {
        set((s) => ({ player: { ...s.player, credits: s.player.credits + n } }));
        // GOLD_HOARDER unlock fires when credits cross the threshold —
        // works for DEV_REFILL, daily login, mission credits alike.
        get().checkAchievements();
      },

      addScore: (n) =>
        set((s) => ({
          player: {
            ...s.player,
            totalScore: s.player.totalScore + n,
            weeklyScore: s.player.weeklyScore + n,
          },
        })),

      addXp: (n) =>
        set((s) => {
          let xp = s.player.xp + n;
          let level = s.player.level;
          let xpToNext = s.player.xpToNext;
          while (xp >= xpToNext) {
            xp -= xpToNext;
            level += 1;
            xpToNext = Math.round(xpToNext * 1.4);
          }
          return { player: { ...s.player, xp, level, xpToNext } };
        }),

      bumpStreak: () => set((s) => ({ player: { ...s.player, streak: s.player.streak + 1 } })),

      resetStreak: () => set((s) => ({ player: { ...s.player, streak: 0 } })),

      feedPet: () => {
        // Pet stats + player credits/stamina move atomically. EXP gain
        // is delegated to addPetExp so level-up + stage promotion +
        // toast/sound run through one code path.
        set((s) => ({
          pet: { ...s.pet, happiness: Math.min(100, s.pet.happiness + 15) },
          player: {
            ...s.player,
            stamina: Math.min(s.player.maxStamina, s.player.stamina + 8),
            credits: Math.max(0, s.player.credits - 10),
          },
        }));
        get().addPetExp(20);
      },

      addPetExp: (n) => {
        const before = get().pet;
        const stageBefore = before.stage;
        const levelBefore = before.level;

        set((s) => {
          let exp = s.pet.exp + n;
          let level = s.pet.level;
          let expToNext = s.pet.expToNext;
          // Loop in case a large exp grant spans multiple level-ups.
          while (exp >= expToNext) {
            exp -= expToNext;
            level += 1;
            // Gentler curve than player XP (1.3 vs 1.4) so pet still
            // levels at a perceivable pace in the long tail.
            expToNext = Math.round(expToNext * 1.3);
          }
          const newStageMeta = stageForLevel(level);
          const stageChanged = newStageMeta.stage !== s.pet.stage;
          return {
            pet: {
              ...s.pet,
              exp,
              level,
              expToNext,
              stage: newStageMeta.stage,
              // Stage change resets the skill cooldown clock and swaps
              // the metadata wholesale (name + description + cooldown).
              skill: stageChanged
                ? { ...newStageMeta.skill, lastUsed: 0 }
                : s.pet.skill,
            },
          };
        });

        const after = get().pet;
        const toast = useToastStore.getState().pushToast;
        if (after.level > levelBefore) {
          toast(`▸ ${after.name} // LV.${after.level}`, 'info', 2200);
        }
        if (after.stage !== stageBefore) {
          const meta = stageForLevel(after.level);
          toast(
            `▸ EVOLVED ${meta.emoji} // ${meta.stage} ${meta.name}`,
            'success',
            4500,
          );
          playUnlock();
        }
        get().checkAchievements();
      },

      petSkillReady: () => {
        const { pet } = get();
        return Date.now() - pet.skill.lastUsed >= pet.skill.cooldown * 1000;
      },

      petSkillCooldownLeft: () => {
        const { pet } = get();
        const elapsed = (Date.now() - pet.skill.lastUsed) / 1000;
        return Math.max(0, pet.skill.cooldown - elapsed);
      },

      usePetSkill: () => {
        if (!get().petSkillReady()) return false;
        set((s) => ({
          pet: { ...s.pet, skill: { ...s.pet.skill, lastUsed: Date.now() } },
        }));
        return true;
      },

      startMatch: (matchId, locations) => {
        const pool = [...(locations.length ? locations : BANGKOK_LOCATIONS)];
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        // Mission count comes from the Match catalog now — adding a new
        // contract type only requires editing data/locations.ts, no
        // store change needed. Falls back to 5 if matchId is unknown.
        const matchMeta = MATCHES.find((m) => m.id === matchId);
        const count = matchMeta?.missionCount ?? 5;
        const missions: Mission[] = pool.slice(0, count).map((loc, idx) => ({
          id: `m-${Date.now()}-${idx}`,
          location: loc,
          startedAt: 0,
          duration: 180,
          hintsUsed: 0,
          timeExtensions: 0,
          dragCost: 0,
          completed: false,
        }));
        set({
          currentMatchId: matchId,
          missionsInMatch: missions,
          currentMissionIndex: 0,
          pinEnergy: 20,
        });
      },

      setPin: (lat, lng) =>
        set((s) => {
          const list = [...s.missionsInMatch];
          const cur = list[s.currentMissionIndex];
          if (!cur) return s;
          list[s.currentMissionIndex] = { ...cur, pinPosition: { lat, lng } };
          return { missionsInMatch: list };
        }),

      dragPin: (lat, lng) =>
        set((s) => {
          const list = [...s.missionsInMatch];
          const cur = list[s.currentMissionIndex];
          if (!cur || !cur.pinPosition) return s;
          const dragged = distanceMeters(cur.pinPosition.lat, cur.pinPosition.lng, lat, lng);
          const cost = Math.floor(dragged / 100);
          const newEnergy = Math.max(0, s.pinEnergy - cost);
          list[s.currentMissionIndex] = {
            ...cur,
            pinPosition: { lat, lng },
            dragCost: cur.dragCost + cost,
          };
          return { missionsInMatch: list, pinEnergy: newEnergy };
        }),

      useHint: () => {
        const state = get();
        const cur = state.missionsInMatch[state.currentMissionIndex];
        if (!cur) return false;
        // Already revealed every clue? Nothing to do.
        if (cur.hintsUsed >= cur.location.clues.length - 1) return false;

        // TEST_MODE — clue free of charge. Real mode — deduct 50CR.
        const testMode = useSettingsStore.getState().testMode;
        if (!testMode) {
          if (state.player.credits < HINT_COST_CR) return false;
          set((s) => ({
            player: { ...s.player, credits: s.player.credits - HINT_COST_CR },
          }));
        }

        set((s) => {
          const list = [...s.missionsInMatch];
          const m = list[s.currentMissionIndex];
          if (!m) return s;
          list[s.currentMissionIndex] = { ...m, hintsUsed: m.hintsUsed + 1 };
          return { missionsInMatch: list };
        });
        return true;
      },

      extendTime: (seconds) =>
        set((s) => {
          const list = [...s.missionsInMatch];
          const cur = list[s.currentMissionIndex];
          if (!cur) return s;
          list[s.currentMissionIndex] = {
            ...cur,
            duration: cur.duration + seconds,
            timeExtensions: cur.timeExtensions + 1,
          };
          return { missionsInMatch: list };
        }),

      submitMission: ({ score, distance, remainingSeconds, breakdown }) => {
        // Snapshot whether this submit completes the match BEFORE the
        // set() runs so we can grant the contract bonus + tag the
        // mission with it in a single update.
        const stateBefore = get();
        const isFinal =
          stateBefore.currentMissionIndex + 1 >= stateBefore.missionsInMatch.length;
        const matchBonus = isFinal
          ? MATCHES.find((m) => m.id === stateBefore.currentMatchId)?.reward ?? 0
          : 0;

        set((s) => {
          const list = [...s.missionsInMatch];
          const cur = list[s.currentMissionIndex];
          if (!cur) return s;
          list[s.currentMissionIndex] = {
            ...cur,
            completed: true,
            score,
            distanceMeters: distance,
            breakdown,
            remainingSecondsAtSubmit: remainingSeconds,
            matchCompletionBonus: matchBonus > 0 ? matchBonus : undefined,
          };
          const better = score >= 500;
          const newStreak = better ? s.player.streak + 1 : 0;
          return {
            missionsInMatch: list,
            player: {
              ...s.player,
              totalScore: s.player.totalScore + score,
              weeklyScore: s.player.weeklyScore + score,
              streak: newStreak,
              // Per-mission credits + match-completion bonus on the
              // final round (Match.reward, e.g. CLASSIC = +300 CR).
              credits: s.player.credits + Math.floor(score / 20) + matchBonus,
            },
          };
        });
        // XP grows from raw score; refresh leaderboard so "me" reflects the new weekly total.
        get().addXp(Math.floor(score / 5));
        get().refreshLeaderboard();
        // Pet earns a small exp drip per mission (independent of feed)
        // so it levels through play even if the player never feeds.
        // 5 exp × ~5 missions/match = 25 exp/match.
        get().addPetExp(5);

        // Final mission — snapshot the whole match into run history.
        if (isFinal) {
          const after = get();
          const matchMeta = MATCHES.find((m) => m.id === after.currentMatchId);
          const totalScore = after.missionsInMatch.reduce(
            (sum, m) => sum + (m.score ?? 0),
            0,
          );
          const perMissionCredits = after.missionsInMatch.reduce(
            (sum, m) => sum + Math.floor((m.score ?? 0) / 20),
            0,
          );
          const entry: RunHistoryEntry = {
            id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            matchId: after.currentMatchId ?? 'unknown',
            matchCodename: matchMeta?.codename ?? 'UNKNOWN',
            completedAt: Date.now(),
            totalScore,
            matchBonus,
            creditEarned: perMissionCredits + matchBonus,
            tribeUsed: after.player.tribe,
            rounds: after.missionsInMatch.map((m) => ({
              locationName: m.location.name,
              locationDistrict: m.location.district,
              score: m.score ?? 0,
              distanceMeters: m.distanceMeters ?? 0,
              tier: tierForDistance(m.distanceMeters ?? 0),
            })),
          };
          get().recordRun(entry);
        }

        // Check achievement progress whether or not this was the final
        // mission — BULLSEYE / STREAKER can unlock mid-match.
        get().checkAchievements();
      },

      nextMission: () => {
        const { currentMissionIndex, missionsInMatch } = get();
        if (currentMissionIndex + 1 >= missionsInMatch.length) return false;
        set({ currentMissionIndex: currentMissionIndex + 1, pinEnergy: 20 });
        return true;
      },

      exitMatch: () =>
        // Reset pinEnergy too — otherwise an abort mid-match leaves
        // depleted energy for the NEXT match's first round.
        set({
          currentMatchId: null,
          missionsInMatch: [],
          currentMissionIndex: 0,
          pinEnergy: 20,
        }),

      refreshLeaderboard: () => {
        const { leaderboard, player } = get();
        // Snapshot current ranks BEFORE the update so ▲▼ delta reflects movement.
        const prevRanks: Record<string, number> = {};
        leaderboard.forEach((e, i) => {
          prevRanks[e.id] = i + 1;
        });
        const others = leaderboard.filter((e) => e.id !== 'me');
        const myEntry: LeaderboardEntry = {
          id: 'me',
          name: player.nickname,
          score: player.weeklyScore,
          streak: player.streak,
          tribe: player.tribe,
        };
        const updated = [...others, myEntry]
          .sort((a, b) => b.score - a.score)
          .map((e, i) => ({ ...e, previousRank: prevRanks[e.id] ?? i + 1 }));
        set({ leaderboard: updated });
      },

      checkDailyLogin: () => {
        const today = todayKey();
        const { player } = get();
        const lastDay = player.lastLogin ? new Date(player.lastLogin).toDateString() : null;
        const todayDate = new Date().toDateString();
        if (lastDay === todayDate) return { rewarded: false, reward: 0 };
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = lastDay === yesterday.toDateString();
        const newStreak = wasYesterday ? player.loginStreak + 1 : 1;
        const reward = 20 + newStreak * 10;
        set((s) => ({
          player: {
            ...s.player,
            lastLogin: Date.now(),
            loginStreak: newStreak,
            credits: s.player.credits + reward,
            stamina: Math.min(s.player.maxStamina, s.player.stamina + 15),
          },
        }));
        // DAILY_DEVOTEE unlock fires on the 7th consecutive day login.
        get().checkAchievements();
        return { rewarded: true, reward };
      },

      consumePinEnergy: (n) => set((s) => ({ pinEnergy: Math.max(0, s.pinEnergy - n) })),
      refillPinEnergy: () => set({ pinEnergy: 20 }),

      recordRun: (entry) =>
        set((s) => ({
          runHistory: [entry, ...s.runHistory].slice(0, RUN_HISTORY_CAP),
        })),
      clearRunHistory: () => set({ runHistory: [] }),

      checkAchievements: () => {
        const state = get();
        // Derive metrics once instead of recomputing per predicate.
        const uniqueLocations = new Set<string>();
        const tribesUsed = new Set<TribeId>();
        let hasBullseye = false;
        let hasPerfectMatch = false;
        for (const r of state.runHistory) {
          if (r.tribeUsed) tribesUsed.add(r.tribeUsed);
          let allS = r.rounds.length > 0;
          for (const rd of r.rounds) {
            uniqueLocations.add(rd.locationName);
            if (rd.tier === 'S') hasBullseye = true;
            if (rd.tier !== 'S') allS = false;
          }
          if (allS) hasPerfectMatch = true;
        }
        const totalLocations = BANGKOK_LOCATIONS.length;

        const predicate = (id: string): boolean => {
          switch (id) {
            case 'first_blood':
              return state.runHistory.length >= 1;
            case 'bullseye':
              return hasBullseye;
            case 'perfectionist':
              return hasPerfectMatch;
            case 'marathon':
              return state.runHistory.length >= 10;
            case 'streaker':
              return state.player.streak >= 5;
            case 'explorer_10':
              return uniqueLocations.size >= 10;
            case 'explorer_all':
              return uniqueLocations.size >= totalLocations;
            case 'tribe_rover':
              return tribesUsed.size >= 4;
            case 'daily_devotee':
              return state.player.loginStreak >= 7;
            case 'gold_hoarder':
              return state.player.credits >= 10000;
            case 'pet_max':
              return state.pet.stage === 'S4';
            default:
              return false;
          }
        };

        const now = Date.now();
        const newlyUnlocked: Achievement[] = [];
        const updated = state.achievements.map((a) => {
          if (a.unlockedAt) return a;
          if (!predicate(a.id)) return a;
          const u: Achievement = { ...a, unlockedAt: now };
          newlyUnlocked.push(u);
          return u;
        });

        if (newlyUnlocked.length === 0) return;
        set({ achievements: updated });
        // Triad chime once (not per-card) so multiple simultaneous
        // unlocks don't overlap into chord soup. Toasts then fire
        // per-card so the player can read each name.
        playUnlock();
        const toast = useToastStore.getState().pushToast;
        for (const a of newlyUnlocked) {
          toast(`▸ ACHIEVEMENT // ${a.icon} ${a.name}`, 'success', 4000);
        }
      },
    }),
    {
      name: 'coin-hunter-cyber-bangkok',
      partialize: (s) => ({
        player: s.player,
        pet: s.pet,
        leaderboard: s.leaderboard,
        runHistory: s.runHistory,
        achievements: s.achievements,
        // In-progress match state persists too — reload mid-match no
        // longer loses the run. /play guards on currentMatchId so
        // missing state still bounces to /.
        currentMatchId: s.currentMatchId,
        missionsInMatch: s.missionsInMatch,
        currentMissionIndex: s.currentMissionIndex,
        pinEnergy: s.pinEnergy,
      }),
    },
  ),
);
