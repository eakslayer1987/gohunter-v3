'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'TH' | 'EN';
export type ThemeAccent = 'cyan' | 'violet' | 'gold' | 'green';

interface SettingsStore {
  lang: Lang;
  theme: ThemeAccent;
  haptics: boolean;
  setLang: (v: Lang) => void;
  setTheme: (v: ThemeAccent) => void;
  setHaptics: (v: boolean) => void;
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
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setHaptics: (haptics) => set({ haptics }),
    }),
    {
      name: 'coin-hunter-settings',
    },
  ),
);
