'use client';

import { useEffect, useState } from 'react';
import { useToastStore } from '@/store/toastStore';

/** beforeinstallprompt is a Chrome-flavoured event not yet in TS lib.
 *  Hand-roll the bits we use. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** Mounts once in app/layout.tsx. Does three things:
 *  1. Registers /sw.js on load (skips on localhost http to avoid SW
 *     development friction — Render gives us https).
 *  2. Captures the beforeinstallprompt event so we can show a custom
 *     install button later (the captured event is the only handle
 *     that can call prompt()).
 *  3. Shows a small fixed install pill bottom-right when the prompt
 *     is available + the app isn't already installed. Pill tucks
 *     itself away after acceptance, dismissal, or a manual close. */
export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Register SW
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Skip on dev-localhost-http so we don't poison the dev cache.
    if (
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      return;
    }
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {
          /* swallow — fail silently if SW registration breaks */
        });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  // beforeinstallprompt capture
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    // Detect already-installed standalone session
    const matchMedia = window.matchMedia('(display-mode: standalone)');
    if (matchMedia.matches) setInstalled(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const onInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      useToastStore.getState().pushToast('▸ APP_INSTALLED', 'success', 2400);
      setInstalled(true);
    } else {
      useToastStore.getState().pushToast('▸ INSTALL_DISMISSED', 'info', 1800);
    }
    setDeferredPrompt(null);
  };

  if (installed || dismissed || !deferredPrompt) return null;

  return (
    <div
      className="fixed z-[60] flex items-center gap-2 px-3 py-2 backdrop-blur-md"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0) + 14px)',
        right: 14,
        background: 'rgba(5,3,10,0.95)',
        border: '1px solid rgba(34,211,238,0.55)',
        boxShadow: '0 0 18px rgba(34,211,238,0.35), 0 8px 24px rgba(0,0,0,0.6)',
        clipPath:
          'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)',
      }}
    >
      <span className="font-mono text-[10px] text-cyber-cyan tracking-cyber">
        ▸ INSTALL_APP
      </span>
      <button
        type="button"
        onClick={onInstall}
        className="font-display text-[10px] font-bold text-cyber-cyan tracking-cyber px-2 py-1 border border-cyber-cyan/50 hover:bg-cyber-cyan/15 transition"
        style={{
          clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
        }}
      >
        ADD
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss install prompt"
        className="text-white/45 hover:text-white text-[12px] leading-none px-1"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
