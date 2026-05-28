'use client';

import { create } from 'zustand';

export type ToastVariant = 'error' | 'warn' | 'success' | 'info';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: Toast[];
  pushToast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  dismissToast: (id: number) => void;
}

let nextId = 1;

/** Per-toast dismiss timer — tracked outside the store so rapid duplicate
 *  pushes can reset the same timer without queueing a new dismiss.
 *  Value type is `number` because we use `window.setTimeout` (browser DOM
 *  signature) rather than Node's `setTimeout`. */
const dismissTimers = new Map<number, number>();

export const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],
  pushToast: (message, variant = 'info', durationMs = 2800) => {
    // Dedup — if the most recent toast has the same text and variant
    // (e.g. user spam-clicked DEPLOY NOW), just reset its timer rather
    // than stacking N copies of the same message.
    const cur = get().toasts;
    const last = cur[cur.length - 1];
    if (last && last.message === message && last.variant === variant) {
      const prev = dismissTimers.get(last.id);
      if (prev) clearTimeout(prev);
      if (typeof window !== 'undefined') {
        const t = window.setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((x) => x.id !== last.id) }));
          dismissTimers.delete(last.id);
        }, durationMs);
        dismissTimers.set(last.id, t);
      }
      return;
    }
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    if (typeof window !== 'undefined') {
      const t = window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
        dismissTimers.delete(id);
      }, durationMs);
      dismissTimers.set(id, t);
    }
  },
  dismissToast: (id) => {
    const prev = dismissTimers.get(id);
    if (prev) {
      clearTimeout(prev);
      dismissTimers.delete(id);
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/** Imperative helpers — use from event handlers where pulling the
 *  store via a hook is overkill: `toast.error("STAMINA INSUFFICIENT")`. */
export const toast = {
  error: (m: string) => useToastStore.getState().pushToast(m, 'error'),
  warn: (m: string) => useToastStore.getState().pushToast(m, 'warn'),
  success: (m: string) => useToastStore.getState().pushToast(m, 'success'),
  info: (m: string) => useToastStore.getState().pushToast(m, 'info'),
};
