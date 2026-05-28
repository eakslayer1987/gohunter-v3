/* Coin Hunter · Bangkok Grid — minimal service worker
 * ----------------------------------------------------
 * - Precache the app shell + brand assets on install
 * - Network-first for HTML navigation (fall back to cached shell)
 * - Cache-first for same-origin static assets (images, fonts, JS, CSS)
 * - Bump CACHE_VERSION to force clients to redownload everything
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `coin-hunter-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `coin-hunter-runtime-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/assets/img/agent-avatar.png',
  '/assets/img/holy-coin.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {
        /* shell precache best-effort — failures shouldn't block install */
      }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // skip third-party

  // HTML navigations: network-first, fall back to cached shell
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match('/'))),
    );
    return;
  }

  // Static assets: cache-first, fall back to network
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        }),
    ),
  );
});
