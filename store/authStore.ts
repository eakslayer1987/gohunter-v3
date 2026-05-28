'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TribeId } from '@/types';

export type PortraitColor = 'cyan' | 'violet' | 'gold' | 'pink' | 'green';

export interface AuthState {
  /** True until the user signs in or completes onboarding. Guests can
   *  browse most pages but anything destructive (purchase, save runs,
   *  bind pet permanently) prompts them to /login first. */
  guest: boolean;
  /** Last verified phone (without country code). Empty when guest. */
  phone: string;
  /** ISO date string yyyy-mm-dd. Empty when not collected yet. */
  birthDate: string;
  nickname: string;
  portrait: PortraitColor;
  /** Selected starter pet id (from /pets list). Empty until onboarded. */
  starterPetId: string;
  /** Mock JWT — present once verifyOtp / signup returns ok. */
  token: string;

  setPhone: (phone: string) => void;
  setBirthDate: (date: string) => void;
  setNickname: (name: string) => void;
  setPortrait: (color: PortraitColor) => void;
  setStarterPet: (id: string) => void;
  setToken: (token: string) => void;
  /** Marks onboarding complete + clears guest flag. Caller should
   *  push the persisted tribe + nickname into gameStore separately. */
  completeOnboarding: (opts: {
    nickname: string;
    tribe: TribeId;
    petId: string;
    token: string;
  }) => void;
  /** Returning hunter via Login. Mock-friendly: no real network call. */
  signIn: (opts: { phone: string; token: string; nickname?: string }) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      guest: true,
      phone: '',
      birthDate: '',
      nickname: '',
      portrait: 'cyan',
      starterPetId: '',
      token: '',

      setPhone: (phone) => set({ phone }),
      setBirthDate: (birthDate) => set({ birthDate }),
      setNickname: (nickname) => set({ nickname }),
      setPortrait: (portrait) => set({ portrait }),
      setStarterPet: (starterPetId) => set({ starterPetId }),
      setToken: (token) => set({ token }),

      completeOnboarding: ({ nickname, petId, token }) => {
        set({
          guest: false,
          nickname,
          starterPetId: petId,
          token,
        });
      },

      signIn: ({ phone, token, nickname }) => {
        set((s) => ({
          guest: false,
          phone,
          token,
          nickname: nickname ?? s.nickname,
        }));
      },

      signOut: () => {
        set({ guest: true, token: '' });
      },
    }),
    {
      name: 'coin-hunter-auth',
    },
  ),
);
