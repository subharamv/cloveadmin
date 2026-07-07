// Service worker for the standalone /visitor PWA shell.
const CACHE = 'visitor-pwa-v1';
const SHELL_ASSETS = ['/visitor', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const { pathname } = new URL(request.url);

  // Never cache API calls — the security portal needs live data.
  if (pathname.startsWith('/api/')) return;

  // Vite's dev server serves raw, constantly-changing modules from these
  // paths (only present in `npm run dev`, never in the production build).
  // Don't intercept them at all — caching/retrying a mid-transform module
  // fetch here breaks HMR and can hard-fail the whole page load if the dev
  // server hiccups (e.g. restarts) while a request is in flight.
  if (pathname.startsWith('/src/') || pathname.startsWith('/@') || pathname.startsWith('/node_modules/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/visitor').then((res) => res || caches.match(request)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request));
    })
  );
});
