const CACHE_NAME = 'fincalc-premium-v1';
const OFFLINE_URLS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './favicon.svg',
  './scripts/util.js',
  './scripts/finance.js',
  './scripts/ui.js',
  './scripts/prepayment.js',
  './scripts/app.js',
  './scripts/state.js',
  './pages/emi.html',
  './scripts/emi.js',
  './pages/prepayment.html',
  './pages/affordability.html',
  './scripts/affordability.js',
  './pages/balance-transfer.html',
  './scripts/balance-transfer.js',
  './pages/education.html',
  './scripts/education.js',
  './pages/sip.html',
  './scripts/sip.js',
  './pages/step-up-sip.html',
  './scripts/step-up-sip.js',
  './pages/mutual-fund.html',
  './scripts/mutual-fund.js',
  './pages/lumpsum.html',
  './scripts/lumpsum.js',
  './pages/fd.html',
  './scripts/fd.js',
  './pages/rd.html',
  './scripts/rd.js',
  './scripts/components/RDCalculator.js',
  './scripts/components/UI.js',
  './scripts/components/Layout.js',
  './pages/ppf.html',
  './scripts/ppf.js',
  './pages/ssy.html',
  './scripts/ssy.js',
  './scripts/components/SSYCalculator.js',
  './pages/pomis.html',
  './scripts/pomis.js',
  './pages/cagr.html',
  './scripts/cagr.js',
  './pages/retirement.html',
  './scripts/components/RetirementCalculator.js',
  './pages/income-tax.html',
  './scripts/components/IncomeTaxCalculator.js',
  './pages/inflation.html',
  './scripts/inflation.js',
  './pages/gst.html',
  './scripts/gst.js',
  './scripts/components/GSTCalculator.js',
  './pages/gratuity.html',
  './scripts/gratuity.js'
];

// Install event: cache all core assets
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(OFFLINE_URLS);
    self.skipWaiting();
  })());
});

// Activate event: clean up old caches and claim clients
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    let removedOldCache = false;
    await Promise.all(keys.map(async k => {
      if (k !== CACHE_NAME) {
        removedOldCache = true;
        await caches.delete(k);
      }
    }));

    await self.clients.claim();

    if (removedOldCache) {
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ type: 'UPDATE_AVAILABLE' });
      });
    }
  })());
});

// Fetch event: Stale-While-Revalidate strategy for robustness
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(req);

    const fetchPromise = fetch(req).then(async networkResponse => {
      if (networkResponse && networkResponse.ok && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
        await cache.put(req, networkResponse.clone());
      }
      return networkResponse;
    });

    // If we have a cached response, return it but update in background
    if (cachedResponse) {
      event.waitUntil(fetchPromise.catch(() => {})); // Ignore background fetch errors
      return cachedResponse;
    }

    // If not in cache, wait for network
    try {
      return await fetchPromise;
    } catch (err) {
      // Offline fallback for navigation
      if (req.mode === 'navigate') {
        return cache.match('./index.html');
      }
      throw err;
    }
  })());
});
