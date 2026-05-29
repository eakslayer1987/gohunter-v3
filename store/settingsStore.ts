'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'TH' | 'EN';
export type ThemeAccent = 'cyan' | 'violet' | 'gold' | 'green';

interface SettingsStore {
  lang: Lang;
  theme: ThemeAccent;
  haptics: boolean;
  /** Test mode — when on, contracts ignore stamina cost so the player
   *  can deploy back-to-back without waiting for regen or hitting
   *  /profile to DEV_REFILL. Default true for now since we're still
   *  in the testing phase; switch off when shipping for real users. */
  testMode: boolean;
  /** Last /play view-mode the user picked (Street View vs top-down
   *  Map). Persists across navigation + refresh so toggling once
   *  sticks until the user flips it again. null = follow the
   *  default (Street View when key is present). */
  playViewMode: 'streetview' | 'map' | null;
  /** Timestamp (Date.now()) of the last time the user opened the
   *  notifications dropdown. Anything in the derived feed newer than
   *  this counts as "unread" for the bell badge. */
  notificationsSeenAt: number;
  setLang: (v: Lang) => void;
  setTheme: (v: ThemeAccent) => void;
  setHaptics: (v: boolean) => void;
  setTestMode: (v: boolean) => void;
  setPlayViewMode: (v: 'streetview' | 'map' | null) => void;
  markNotificationsSeen: () => void;
}

/** Cross-session UI prefs. Sound has its own store (soundStore) because
 *  the sound library reads it eagerly at module load via setMuted.
 *  Everything here is decorative + safe to read lazily inside components. */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      lang: 'TH',
      theme: 'cyan',
      haptics: true,
      testMode: true,
      playViewMode: null,
      notificationsSeenAt: 0,
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setHaptics: (haptics) => set({ haptics }),
      setTestMode: (testMode) => set({ testMode }),
      setPlayViewMode: (playViewMode) => set({ playViewMode }),
      markNotificationsSeen: () => set({ notificationsSeenAt: Date.now() }),
    }),
    {
      name: 'coin-hunter-settings',
    },
  ),
);
