const CACHE_NAME = 'nce-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/variables.css',
  '/assets/css/base/reset.css',
  '/assets/css/base/utilities.css',
  '/assets/css/components/buttons.css',
  '/assets/css/components/cards.css',
  '/assets/css/components/data.css',
  '/assets/css/components/forms.css',
  '/assets/css/components/skeleton.css',
  '/assets/css/components/profile.css',
  '/assets/css/components/rfq.css',
  '/assets/css/components/modal.css',
  '/assets/css/components/toast.css',
  '/assets/css/components/notif-panel.css',
  '/assets/css/components/trust-score.css',
  '/assets/css/components/verification.css',
  '/assets/css/views/home.css',
  '/assets/css/views/business-match.css',
  '/assets/css/views/market.css',
  '/assets/css/views/detail-common.css',
  '/assets/css/views/detail-chart.css',
  '/assets/css/views/detail-rfq.css',
  '/assets/css/navigation/header.css',
  '/assets/css/navigation/bottom-nav.css',
  '/assets/css/navigation/pulse-bar.css',
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
  '/assets/js/services/messagingService.js',
  '/assets/js/services/matchingService.js',
  '/assets/js/services/intelligenceService.js',
  '/assets/js/services/trustScoreService.js',
  '/assets/js/utils/helpers.js',
  '/assets/js/utils/formatter.js',
  '/assets/js/utils/indicators.js',
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
  '/assets/js/components/chartRenderer.js',
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

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'NCE', body: 'Pemberitahuan baru', icon: '/assets/images/icons/icon-192x192.png' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/assets/images/icons/icon-192x192.png',
    badge: '/assets/images/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: data.actions || [],
    tag: data.tag || 'nce-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  const actionUrl = event.action?.url;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(actionUrl || targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(actionUrl || targetUrl);
    })
  );
});

// Background sync handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
  if (event.tag === 'sync-price-alerts') {
    event.waitUntil(syncPriceAlerts());
  }
});

async function syncNotifications() {
  // Notify main app to refresh notifications
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => client.postMessage({ type: 'SYNC_NOTIFICATIONS' }));
}

async function syncPriceAlerts() {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => client.postMessage({ type: 'SYNC_PRICE_ALERTS' }));
}
