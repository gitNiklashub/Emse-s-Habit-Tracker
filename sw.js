/* Service Worker — App offline verfügbar machen.
   Strategie: network-first für ALLES (frische Dateien, wenn online),
   Cache nur als Offline-Fallback. Bei Änderungen VERSION hochzählen. */

const VERSION = 'v10';
const CACHE = `emse-habits-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first: immer frisch vom Server, Cache nur wenn offline.
// ignoreSearch, damit Cache-Buster-Queries (?v=9) den Fallback nicht brechen.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: true })
          .then((hit) => hit || caches.match('./index.html'))
      )
  );
});
