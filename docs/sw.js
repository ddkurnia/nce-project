/* ============================================================================
 * NCE — Service Worker
 * ============================================================================ */

const CACHE_NAME = 'nce-v2.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/variables.css',
  './assets/css/base.css',
  './assets/css/components.css',
  './assets/css/views.css',
  './assets/js/app.js',
  './assets/js/config.js',
  './assets/js/api.js',
  './assets/js/auth.js',
  './assets/js/state.js',
  './assets/js/router.js',
  './assets/js/utils/formatter.js',
  './assets/js/utils/helpers.js',
  './assets/js/services/commodityService.js',
  './assets/js/services/requestService.js',
  './assets/js/services/propertyService.js',
  './assets/js/services/userService.js',
  './assets/js/components/header.js',
  './assets/js/components/bottomNav.js',
  './assets/js/components/cards.js',
  './assets/js/components/marketBoard.js',
  './assets/js/components/marketPulse.js',
  './assets/js/components/modal.js',
  './assets/js/components/toast.js',
  './assets/js/views/homeView.js',
  './assets/js/views/marketView.js',
  './assets/js/views/rfqView.js',
  './assets/js/views/messagesView.js',
  './assets/js/views/profileView.js',
  './assets/images/nce-icon.svg'
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and API calls
  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((cached) => {
          return cached || new Response('Offline', { status: 503 });
        });
      })
  );
});
