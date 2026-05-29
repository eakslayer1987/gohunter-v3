'use client';

import { useEffect } from 'react';
import { useSettingsStore, type ThemeAccent } from '@/store/settingsStore';

const THEME_CLASSES: ThemeAccent[] = ['cyan', 'violet', 'gold', 'green'];

/** Applies the active theme accent to <body> as a class. Pure side
 *  effect; renders nothing. Sits in the root layout so every page
 *  picks up the user's preference without explicit wiring.
 *
 *  CSS in globals.css defines per-theme overrides for
 *  --theme-accent + glow variants. Components that opt in (TopBar
 *  active tab, .btn-cyber gradient, .text-accent utility) read
 *  those vars; everything else keeps its branded colour
 *  (tribe-red, tier-gold, etc.). */
export default function ThemeProvider() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const body = document.body;
    for (const t of THEME_CLASSES) body.classList.remove(`theme-${t}`);
    body.classList.add(`theme-${theme}`);
  }, [theme]);

  return null;
}
