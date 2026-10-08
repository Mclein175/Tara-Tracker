// Offline support: every file the app needs is cached on first visit.
const CACHE = 'dance-pilates-steps-sleep-dd8ff7335c';
const ASSETS = [
  "./",
  "fonts/barlow-semi-condensed-500.woff2",
  "fonts/barlow-semi-condensed-700.woff2",
  "fonts/big-shoulders-display-800.woff2",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "index.html",
  "manifest.webmanifest"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Answer from the cache at once, then refresh that file in the background for next launch.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  const network = fetch(req)
    .then((res) => {
      if (!res || !res.ok) return res;
      const copy = res.clone();
      return caches.open(CACHE)
        .then((cache) => cache.put(req, copy))
        .then(() => res, () => res);
    })
    .catch(() => null);
  event.waitUntil(network);

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return network.then((res) => {
        if (res) return res;
        if (req.mode === 'navigate') return caches.match('./');
        return Response.error();
      });
    })
  );
});
