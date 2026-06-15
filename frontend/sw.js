const CACHE_NAME = 'nce-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/variables.css',
  '/assets/css/base.css',
  '/assets/css/components.css',
  '/assets/css/overlay.css',
  '/assets/css/views.css',
  '/assets/css/views-detail.css',
  '/assets/css/navigation.css',
  '/assets/js/app.js',
  '/assets/js/router.js',
  '/assets/js/config.js',
  '/assets/js/auth.js',
  '/assets/js/state.js',
  '/assets/js/api.js',
  '/assets/js/constants/commodities.js',
  '/assets/js/constants/properties.js',
  '/assets/js/constants/requests.js',
  '/assets/js/services/userService.js',
  '/assets/js/services/commodityService.js',
  '/assets/js/services/propertyService.js',
  '/assets/js/services/requestService.js',
  '/assets/js/services/notificationService.js',
  '/assets/js/utils/helpers.js',
  '/assets/js/utils/formatter.js',
  '/assets/js/components/header.js',
  '/assets/js/components/bottomNav.js',
  '/assets/js/components/marketBoard.js',
  '/assets/js/components/sparkline.js',
  '/assets/js/components/cards.js',
  '/assets/js/components/modal.js',
  '/assets/js/components/toast.js',
  '/assets/js/components/loading.js',
  '/assets/js/components/trustScore.js',
  '/assets/js/components/businessMatch.js',
  '/assets/js/components/notifPanel.js',
  '/assets/js/views/homeView.js',
  '/assets/js/views/marketView.js',
  '/assets/js/views/marketDetailView.js',
  '/assets/js/views/rfqView.js',
  '/assets/js/views/rfqDetailView.js',
  '/assets/js/views/messagesView.js',
  '/assets/js/views/profileView.js',
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — Network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Don't cache API or Firebase requests
  if (url.hostname.includes('cloudfunctions.net') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
