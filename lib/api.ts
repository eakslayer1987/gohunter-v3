'use client';

/**
 * Coin Hunter API client + mock layer (TS port of ui_kits/coin-hunter/api.jsx).
 *
 * All screens read data through this module. To wire a real backend later:
 *   1. Set window.__API_BASE__ = 'https://api.coinhunter.gg/v1' before app boot
 *   2. Set window.__API_MOCK__ = false
 * Until then every useApi/useAction hits the in-process mock with simulated
 * latency + 4 % random failure so loading + error states get exercised.
 */

import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    __API_BASE__?: string;
    __API_MOCK__?: boolean;
  }
}

const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) || '/api/v1';
const API_MOCK =
  typeof window === 'undefined'
    ? true
    : window.__API_MOCK__ !== false;
const MOCK_LATENCY = 220;

// ───────────────────────────────────────────── ENDPOINT MAP
export type EndpointKey =
  | 'auth.requestOtp'
  | 'auth.verifyOtp'
  | 'auth.signup'
  | 'auth.me'
  | 'auth.logout'
  | 'hunter.profile'
  | 'hunter.update'
  | 'hunter.setTribe'
  | 'hunter.runs'
  | 'tribes.list'
  | 'tribes.stats'
  | 'contracts.list'
  | 'contracts.deploy'
  | 'play.start'
  | 'play.submit'
  | 'play.result'
  | 'pets.list'
  | 'pets.bind'
  | 'pets.feed'
  | 'pets.swap'
  | 'pets.chat'
  | 'market.items'
  | 'market.buy'
  | 'shop.bundles'
  | 'shop.purchase'
  | 'leaderboard'
  | 'leaderboard.tabs';

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
}

export const ENDPOINTS: Record<EndpointKey, Endpoint> = {
  'auth.requestOtp':  { method: 'POST',  path: '/auth/otp/request' },
  'auth.verifyOtp':   { method: 'POST',  path: '/auth/otp/verify' },
  'auth.signup':      { method: 'POST',  path: '/auth/signup' },
  'auth.me':          { method: 'GET',   path: '/auth/me' },
  'auth.logout':      { method: 'POST',  path: '/auth/logout' },

  'hunter.profile':   { method: 'GET',   path: '/hunter/me' },
  'hunter.update':    { method: 'PATCH', path: '/hunter/me' },
  'hunter.setTribe':  { method: 'POST',  path: '/hunter/tribe' },
  'hunter.runs':      { method: 'GET',   path: '/hunter/runs' },

  'tribes.list':      { method: 'GET',   path: '/tribes' },
  'tribes.stats':     { method: 'GET',   path: '/tribes/stats' },

  'contracts.list':   { method: 'GET',   path: '/contracts' },
  'contracts.deploy': { method: 'POST',  path: '/contracts/deploy' },

  'play.start':       { method: 'POST',  path: '/play/start' },
  'play.submit':      { method: 'POST',  path: '/play/submit' },
  'play.result':      { method: 'GET',   path: '/play/result/:id' },

  'pets.list':        { method: 'GET',   path: '/pets' },
  'pets.bind':        { method: 'POST',  path: '/pets/bind' },
  'pets.feed':        { method: 'POST',  path: '/pets/feed' },
  'pets.swap':        { method: 'POST',  path: '/pets/swap' },
  'pets.chat':        { method: 'POST',  path: '/pets/chat' },

  'market.items':     { method: 'GET',   path: '/market/items' },
  'market.buy':       { method: 'POST',  path: '/market/buy' },
  'shop.bundles':     { method: 'GET',   path: '/shop/bundles' },
  'shop.purchase':    { method: 'POST',  path: '/shop/purchase' },

  'leaderboard':      { method: 'GET',   path: '/leaderboard' },
  'leaderboard.tabs': { method: 'GET',   path: '/leaderboard/tabs' },
};

// ───────────────────────────────────────────── MOCK DATA
type MockCtx = { params: Record<string, string | number>; body: Record<string, unknown> };
type MockHandler = (ctx: MockCtx) => unknown;

const MOCK: Partial<Record<EndpointKey, MockHandler>> = {
  // ── Auth — accept any phone / any 6-digit code in mock mode.
  'auth.requestOtp': ({ body }) => ({
    ok: true,
    masked: `+66 ***-***-${String(body.phone ?? '').slice(-4) || '****'}`,
    ttl: 30,
  }),
  'auth.verifyOtp': ({ body }) => ({
    ok: true,
    token: 'mock-jwt-' + Math.random().toString(36).slice(2, 10),
    isNewUser: !body.signupComplete,
  }),
  'auth.signup': ({ body }) => ({
    ok: true,
    token: 'mock-jwt-' + Math.random().toString(36).slice(2, 10),
    hunter: { nickname: body.nickname, tribe: body.tribe, petId: body.petId },
  }),
  'auth.me': () => ({
    hunter: {
      id: 'NX-7412',
      nickname: 'พี่เอก',
      tribe: 'wolf',
      level: 12,
      credits: 2840,
    },
  }),
  'auth.logout': () => ({ ok: true }),

  'tribes.list': () => ({
    tribes: [
      { id: 'wolf',   name: 'WOLF',   emoji: '🐺', color: '#FD1803', bonusLabel: 'SPEED +15%',  bonus: 0.15, desc_th: 'นักวิ่งกลางคืน · ความเร็วในการ pin' },
      { id: 'lion',   name: 'LION',   emoji: '🦁', color: '#FD7A2F', bonusLabel: 'POWER +20%',  bonus: 0.20, desc_th: 'ผู้บัญชาการ · พลังโจมตีในการล่า' },
      { id: 'falcon', name: 'FALCON', emoji: '🦅', color: '#4ade80', bonusLabel: 'VISION +25%', bonus: 0.25, desc_th: 'จับตามอง · มองเห็นเบาะแสไกล' },
      { id: 'shark',  name: 'SHARK',  emoji: '🦈', color: '#00D9FF', bonusLabel: 'HUNT +18%',   bonus: 0.18, desc_th: 'ผู้สำรวจน้ำลึก · ค่าล่าเหรียญสูง' },
    ],
  }),
  'tribes.stats': () => ({
    stats: {
      wolf:   { hunters: 712, winRate: 0.58, topAgent: 'NeonHunter88' },
      lion:   { hunters: 684, winRate: 0.52, topAgent: 'GoldenTuk'    },
      falcon: { hunters: 597, winRate: 0.61, topAgent: 'SiamGhost'    },
      shark:  { hunters: 848, winRate: 0.54, topAgent: 'BangkokRiver' },
    },
  }),
  'hunter.setTribe': ({ body }) => ({ ok: true, tribe: body.tribeId }),

  'pets.list': () => ({
    pets: [
      { id: 'volt',  nick: 'VOLT BABY', name: 'DK09', element: 'FAIRY',   level: 2, stage: 'BABY',     hp: 70,  hpMax: 70,  en: 100, enMax: 120, atk: 7,  sync: 92, link: true,  msg: 'พรืด~ สวัสดี HUNTER! ฉันหิวจัง... ให้อาหารหน่อยน้า 🥺' },
      { id: 'lumen', nick: 'LUMEN PUP', name: 'DK11', element: 'BEAST',   level: 4, stage: 'ROOKIE',   hp: 95,  hpMax: 95,  en: 140, enMax: 140, atk: 11, sync: 78, link: true,  msg: 'โว้ฟ! พร้อมออกล่าหรือยัง hunter? วันนี้ฉันรู้สึกฟิตเป็นพิเศษ ✨' },
      { id: 'nyx',   nick: 'NYX OWL',   name: 'DK17', element: 'PSYCHIC', level: 6, stage: 'ROOKIE',   hp: 88,  hpMax: 100, en: 180, enMax: 180, atk: 9,  sync: 64, link: false, msg: 'ฮูก... ฉันมองเห็นบางอย่างในเงามืด... สแกนเรดาร์พร้อมแล้ว 🔮' },
      { id: 'horn',  nick: 'HORN CUB',  name: 'DK21', element: 'DARK',    level: 7, stage: 'CHAMPION', hp: 60,  hpMax: 110, en: 95,  enMax: 160, atk: 14, sync: 51, link: false, msg: 'ggrr... ต้องการอาหารและพักผ่อน HP เหลือน้อยแล้ว ⚠️' },
    ],
  }),
  'pets.feed': ({ body }) => ({ ok: true, petId: body.petId, hp: 80, en: 110, happiness: 95 }),
  'pets.bind': ({ body }) => ({ ok: true, petId: body.petId }),
  'pets.swap': ({ body }) => ({ ok: true, petId: body.petId }),
  'pets.chat': ({ body }) => {
    const msg = String(body.message ?? '').toLowerCase();
    const persona = String(body.persona ?? 'FAIRY');
    const replies: Record<string, string[]> = {
      FAIRY:   ['พรืด~ ดีใจที่ได้คุย!', 'ฉันรักคุณมากเลย 💖', 'อยากกินอะไรไหม?'],
      BEAST:   ['โว้ฟ! พร้อมล่า!', 'หิวแล้ว... ให้อาหารหน่อย', 'วันนี้ฟิตมาก'],
      PSYCHIC: ['ฮูก... ฉันรู้คำตอบ', 'เงียบ... ฟังเสียงดาว', 'มีบางอย่างอยู่ใกล้'],
      DARK:    ['ggrr...', 'ต้องการเลือดมากกว่านี้', 'เงาบอกฉันว่า...'],
    };
    const pool = replies[persona] ?? replies.FAIRY;
    let reply = pool[Math.floor(Math.random() * pool.length)];
    if (msg.includes('hi') || msg.includes('สวัสดี')) reply = 'สวัสดี HUNTER! ดีใจมากที่ได้คุย ✨';
    if (msg.includes('feed') || msg.includes('กิน')) reply = 'หิวจัง! ให้อาหารฉันหน่อย 🍖';
    return { ok: true, reply };
  },

  'contracts.list': () => ({
    contracts: [
      { id: 'flash',   codename: 'FLASH_LUNCH',  window: '12:00 — 12:30', missions: 3, cost: 10, reward: 150, accent: 'gold',   badge: 'URGENT' },
      { id: 'classic', codename: 'CLASSIC_GRID', window: '12:00 — 24:00', missions: 5, cost: 20, reward: 300, accent: 'cyan',   badge: 'DAILY' },
      { id: 'night',   codename: 'NIGHT_HUNT',   window: '19:00 — 21:00', missions: 4, cost: 15, reward: 240, accent: 'violet', badge: '2X BONUS' },
      { id: 'raid',    codename: 'RAID_OPEN',    window: '24H WEEKEND',   missions: 7, cost: 25, reward: 500, accent: 'red',    badge: 'ELITE' },
    ],
  }),
  'contracts.deploy': ({ body }) => ({ ok: true, matchId: `match-${Date.now()}`, contractId: body.contractId }),

  'market.items': () => ({
    items: [
      { id: 'stm10',  name: 'STAMINA_PACK_10',    icon: '⚡', desc: '+10 stamina recharge',         price: 80,  color: '#22D3EE' },
      { id: 'stm30',  name: 'STAMINA_PACK_30',    icon: '⚡', desc: '+30 stamina (bulk discount)',  price: 200, color: '#22D3EE' },
      { id: 'xpb24',  name: 'XP_BOOSTER_24H',     icon: '⭐', desc: '2x XP for 24 hours',           price: 450, color: '#A78BFA' },
      { id: 'penr',   name: 'PIN_ENERGY_PACK',    icon: '🎯', desc: '+5 pin energy reserve',        price: 120, color: '#FBBF24' },
      { id: 'food10', name: 'COMPANION_FOOD_X10', icon: '🍖', desc: 'Feed your jelly cat ×10',      price: 150, color: '#FD7A2F' },
      { id: 'reveal', name: 'CLUE_REVEAL_PACK',   icon: '🔓', desc: 'Reveal 3 extra clues per run', price: 320, color: '#4ade80' },
    ],
  }),
  'market.buy': ({ body }) => ({ ok: true, itemId: body.itemId }),

  'shop.bundles': () => ({
    bundles: [
      { id: 'starter', name: 'STARTER_PACK', cr:   500, gem:   0, price: '฿39',  best: false },
      { id: 'agent',   name: 'AGENT_PACK',   cr:  1500, gem:  10, price: '฿99',  best: false },
      { id: 'hunter',  name: 'HUNTER_PACK',  cr:  4000, gem:  30, price: '฿259', best: true  },
      { id: 'elite',   name: 'ELITE_PACK',   cr: 12000, gem: 100, price: '฿699', best: false },
    ],
  }),
  'shop.purchase': ({ body }) => ({ ok: true, bundleId: body.bundleId }),

  'leaderboard': ({ params }) => ({
    tab: params.tab ?? 'weekly',
    rows: [
      { rank: 1, name: 'NeonHunter88', score: 9420, streak: 12, tribe: 'wolf',   delta:  0, country: 'TH' },
      { rank: 2, name: 'BangkokRiver', score: 8870, streak:  9, tribe: 'shark',  delta: +1, country: 'TH' },
      { rank: 3, name: '__YOU__',      score: 8210, streak:  7, tribe: 'shark',  delta: +2, country: 'TH', isMe: true },
      { rank: 4, name: 'CoinSamurai',  score: 7660, streak:  6, tribe: 'lion',   delta: -1, country: 'JP' },
      { rank: 5, name: 'GoldenTuk',    score: 7100, streak:  5, tribe: 'falcon', delta: -1, country: 'TH' },
      { rank: 6, name: 'SiamGhost',    score: 6840, streak:  4, tribe: 'wolf',   delta:  0, country: 'TH' },
      { rank: 7, name: 'NightProwler', score: 6320, streak:  3, tribe: 'shark',  delta: +2, country: 'SG' },
      { rank: 8, name: 'ChaoPhrayaQ',  score: 5980, streak:  2, tribe: 'lion',   delta: -2, country: 'TH' },
    ],
  }),
  'leaderboard.tabs': () => ({ tabs: ['weekly', 'monthly', 'all-time', 'tribe'] }),

  'hunter.runs': () => ({
    summary: { totalRuns: 47, tierSWins: 11, avgDist: 218, bestStreak: 12 },
    runs: [
      { id: 1, contract: 'FLASH_LUNCH',  target: 'BTS Asok',      tier: 'S', dist: 32,  score: 1240, date: '27 พ.ค. 26 · 12:14' },
      { id: 2, contract: 'CLASSIC_GRID', target: 'Wat Arun',      tier: 'A', dist: 180, score:  980, date: '27 พ.ค. 26 · 09:42' },
      { id: 3, contract: 'NIGHT_HUNT',   target: 'Khao San Road', tier: 'B', dist: 420, score:  640, date: '26 พ.ค. 26 · 20:08' },
      { id: 4, contract: 'CLASSIC_GRID', target: 'Chatuchak',     tier: 'C', dist: 880, score:  220, date: '26 พ.ค. 26 · 14:30' },
      { id: 5, contract: 'FLASH_LUNCH',  target: 'Siam Paragon',  tier: 'A', dist: 156, score: 1060, date: '25 พ.ค. 26 · 12:22' },
      { id: 6, contract: 'NIGHT_HUNT',   target: 'Yaowarat',      tier: 'S', dist: 44,  score: 1380, date: '24 พ.ค. 26 · 21:15' },
    ],
  }),

  'hunter.profile': () => ({
    profile: {
      id: 'NX-7412',
      joined: '14 พ.ค. 26',
      rank: 47,
      achievements: [
        { icon: '🎯', name: 'FIRST_HUNT',     desc: 'Complete first contract', unlocked: true,  date: '12 พ.ค. 26' },
        { icon: '⚡', name: 'BULLSEYE_x1',    desc: 'Pin within 50m',          unlocked: true,  date: '18 พ.ค. 26' },
        { icon: '🔥', name: 'STREAK_05',      desc: 'Win 5 in a row',          unlocked: true,  date: '23 พ.ค. 26' },
        { icon: '🦈', name: 'SHARK_LOYALIST', desc: '10 contracts as Shark',   unlocked: true,  date: '26 พ.ค. 26' },
        { icon: '🌙', name: 'NIGHT_PROWLER',  desc: 'Complete NIGHT_HUNT',     unlocked: false },
        { icon: '👑', name: 'TOP_03_WEEKLY',  desc: 'Top 3 on weekly board',   unlocked: false },
      ],
    },
  }),
};

// ───────────────────────────────────────────── HTTP / MOCK
class ApiError extends Error {
  status: number;
  body?: string;
  constructor(message: string, status: number, body?: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function rawFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`API_${res.status}`, res.status, text);
  }
  return res.json();
}

function mockFetch<T>(key: EndpointKey, ctx: MockCtx): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 4 % random fail so loading + error UI gets exercised, except on
      // auth.me — that's the boot probe and a false negative would
      // unnecessarily punt users to /login on every refresh.
      if (Math.random() < 0.04 && key !== 'auth.me') {
        return reject(new ApiError('MOCK_NETWORK_ERR', 503));
      }
      const handler = MOCK[key];
      if (!handler) return reject(new ApiError(`MOCK_MISSING: ${key}`, 501));
      try { resolve(handler(ctx) as T); }
      catch (e) { reject(e); }
    }, MOCK_LATENCY + Math.random() * 180);
  });
}

interface CallOpts {
  params?: Record<string, string | number>;
  body?: Record<string, unknown>;
}

export const api = {
  endpoint: (key: EndpointKey) => ENDPOINTS[key] ?? null,
  isMock: () => API_MOCK,
  base: () => API_BASE,

  async call<T = unknown>(key: EndpointKey, opts: CallOpts = {}): Promise<T> {
    const ep = ENDPOINTS[key];
    if (!ep) throw new ApiError(`UNKNOWN_ENDPOINT: ${key}`, 400);
    const ctx: MockCtx = { params: opts.params ?? {}, body: opts.body ?? {} };
    if (API_MOCK) return mockFetch<T>(key, ctx);
    // Substitute :id-style params in path.
    let path = ep.path;
    if (opts.params) {
      for (const k of Object.keys(opts.params)) {
        path = path.replace(`:${k}`, encodeURIComponent(String(opts.params[k])));
      }
    }
    return rawFetch<T>(ep.method, path, opts.body);
  },

  get<T = unknown>(key: EndpointKey, params?: Record<string, string | number>) {
    return api.call<T>(key, { params });
  },
  post<T = unknown>(key: EndpointKey, body?: Record<string, unknown>) {
    return api.call<T>(key, { body });
  },
};

// ───────────────────────────────────────────── REACT HOOKS

interface UseApiOpts {
  params?: Record<string, string | number>;
  body?: Record<string, unknown>;
  /** Re-runs the call whenever any entry changes. */
  deps?: unknown[];
  /** Skip the fetch entirely until flipped to false (e.g. gated by auth). */
  skip?: boolean;
}

/** useApi — fetch on mount + when deps change. Returns { data, error, loading, refetch }. */
export function useApi<T = unknown>(key: EndpointKey, opts: UseApiOpts = {}) {
  const { params, body, deps = [], skip = false } = opts;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(!skip);

  const run = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.call<T>(key, { params, body });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, skip, ...deps]);

  useEffect(() => { run(); }, [run]);

  return { data, error, loading, refetch: run };
}

/** useAction — for POST/PATCH mutations. Returns { run, loading, error, data }. */
export function useAction<T = unknown, B = Record<string, unknown>>(key: EndpointKey) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const run = useCallback(
    async (body?: B): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.call<T>(key, { body: body as Record<string, unknown> });
        setData(res);
        return res;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [key],
  );

  return { run, loading, error, data };
}
