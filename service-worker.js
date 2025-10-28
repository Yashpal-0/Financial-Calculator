const CACHE_NAME = 'loan-tools-v4';
const OFFLINE_URLS = [
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './favicon.svg',
  './scripts/util.js',
  './scripts/finance.js',
  './scripts/ui.js',
  './scripts/main.js',
  './scripts/app.js',
  './pages/emi.html',
  './scripts/emi.js',
  './pages/prepayment.html',
  './pages/affordability.html',
  './scripts/affordability.js',
  './pages/balance-transfer.html',
  './scripts/balance-transfer.js',
  './pages/education.html',
  './scripts/education.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(OFFLINE_URLS);
    self.skipWaiting(); // Force activation of new service worker
  })());
});

// Notify clients about updates
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); }));
    self.clients.claim();
    
    // Notify all clients about the update
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'UPDATE_AVAILABLE' });
    });
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
      return res;
    } catch (e) {
      const url = new URL(req.url);
      if (url.origin === location.origin) {
        if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
          return caches.match('./index.html');
        }
      }
      throw e;
    }
  })());
});