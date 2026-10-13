// CyberTrace Service Worker — Offline Cache & Network Strategy
const CACHE_NAME = 'cybertrace-v1.0.4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/components.css',
  '/js/phoneData.js',
  '/js/phoneOsint.js',
  '/js/geoTracker.js',
  '/js/telecomLab.js',
  '/js/app.js',
  '/manifest.json',
  '/favicon.svg'
];

// ── Install: pre-cache all static assets ──────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing CyberTrace Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[SW] Installation complete — skipping wait');
      return self.skipWaiting();
    })
  );
});

// ── Activate: clean up old caches ─────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating new Service Worker...');
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => {
      console.log('[SW] Now ready to serve CyberTrace offline!');
      return self.clients.claim();
    })
  );
});

// ── Fetch: network-first for API, cache-first for static ──────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Always go network for API calls (never cache live telemetry/DB data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline — API unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Network-first for CDN external resources (Leaflet, Google Fonts)
  if (!url.origin.includes('localhost') && !url.origin.includes('127.0.0.1')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache a copy of the external resource
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for all static local assets
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // Not in cache — fetch, then store
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        return response;
      });
    })
  );
});

// ── Background Sync placeholder ────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-telemetry') {
    console.log('[SW] Background sync: telemetry data');
  }
});

// ── Push Notification placeholder ─────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  self.registration.showNotification('CyberTrace Alert', {
    body: data.message || 'New security event detected.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'cybertrace-alert',
    data: { url: '/' }
  });
});
