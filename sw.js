const CACHE_NAME = 'neuro-hub-v1';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './timeLimit.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './shared/theme.css',
  './shared/settings.js',
  './shared/dictionary.js'
];

// Install Event - Precache App Shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching Core App Shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean Up Old Caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Hybrid Stale-While-Revalidate with Cache-on-Demand
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Only handle same-origin GET requests
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache immediately and fetch updated version in the background
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {
              // Ignore background fetch failures (e.g. when offline)
            });
          return cachedResponse;
        }

        // Cache miss: fetch from network and cache on-demand
        return fetch(event.request)
          .then(networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch(error => {
            console.log('[Service Worker] Fetch failed; returning offline fallback if HTML requested:', error);
            // If the user is requesting an HTML page and is offline, return the main hub index
            if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html') || caches.match('./');
            }
          });
      })
  );
});
