'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setMuted } from '@/lib/sound';

interface SoundStore {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
}

/** Sound on/off toggle, persisted via localStorage so the player's
 *  choice survives reload. On rehydrate we push the value into the
 *  sound lib's `_muted` flag so playback respects the saved setting
 *  before any UI subscribes. */
export const useSoundStore = create<SoundStore>()(
  persist(
    (set, get) => ({
      enabled: true,
      toggle: () => {
        const next = !get().enabled;
        set({ enabled: next });
        setMuted(!next);
      },
      setEnabled: (v) => {
        set({ enabled: v });
        setMuted(!v);
      },
    }),
    {
      name: 'coin-hunter-sound',
      onRehydrateStorage: () => (state) => {
        if (state) setMuted(!state.enabled);
      },
    },
  ),
);
