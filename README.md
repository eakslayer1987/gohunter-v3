# Coin Hunter · Bangkok Grid (FRESH BUILD)

Fresh Next.js 14 production scaffold for **Coin Hunter · Bangkok Grid** — built strictly per the design system spec in `Coin Hunter Bangkok _ Design System/`.

Sibling to the iterative `gohunter-v3` build at `D:/hunterV3/`. Same logic, fresh visual layer.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind 3.4
- Zustand persist (player, pet, leaderboard, runs, achievements, pin energy)
- Framer Motion (modal animations only)
- MapLibre GL (OpenFreeMap tiles — no API key needed)
- Google Street View embed (fallback to top-down map without key)
- html-to-image (offscreen share card)

## Screens
1. `/` BOOT_GRID (Lobby) — 6-tab nav, hero + holy coin + avatar showcase, game modes, contracts, companion, leaderboard, footer
2. `/play` HUNT_MODE — street view (or fallback) + guess minimap + sticky LOCK_TARGET on mobile
3. `/result` DEBRIEF — tactical replay + big tier letter + breakdown + SHARE PNG
4. `/profile` Agent Dossier — stats, recent runs, achievements grid
5. `/runs` archive — collapsible runs list

## Run

```bash
npm install
npm run dev    # http://localhost:3000
```

## Env

Copy `.env.example` to `.env.local` and set if you have a key:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

Without the key: `/play` falls back to top-down MapLibre map (still fully playable).

## Deploy (Render)

1. Push to GitHub
2. Render dashboard → New + → Blueprint → connect repo
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Environment (optional)
4. After first deploy, add the Render origin to Google Maps key HTTP referrer restrictions

© 2026 EAKSLAYER LABS
