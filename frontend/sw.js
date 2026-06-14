// ============================================================================
// NCE Service Worker - Nusantara Commodity Exchange
// Version: 1.0.0
// Cache Strategy:
//   - Static assets (CSS, JS, images): Cache-first with network fallback
//   - HTML pages: Network-first with cache fallback
//   - API calls: Network-first (no cache fallback by default)
// ============================================================================

const CACHE_NAME = 'nce-v1';

// Resources to pre-cache during the install event
const PRECACHE_URLS = [
  '/index.html',
  '/commodities.html',
  '/buy-requests.html',
  '/property.html',
  '/dashboard.html',
  '/profile.html',
  '/assets/css/main.css',
  '/manifest.json'
];

// File extensions that should use cache-first strategy
const CACHE_FIRST_EXTENSIONS = [
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf'
];

// File extensions that indicate HTML pages (network-first)
const HTML_EXTENSIONS = ['.html', '.htm'];

// Maximum time (in ms) to wait for network before falling back to cache
const NETWORK_TIMEOUT = 3000;

// Maximum number of entries in the cache (to prevent unbounded growth)
const MAX_CACHE_ENTRIES = 200;

// ============================================================================
// INSTALL EVENT
// Pre-cache critical resources so the app works offline on first load
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('[NCE SW] Install event fired');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[NCE SW] Pre-caching critical resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Skip waiting so the new service worker activates immediately
        // instead of waiting for the old one to finish controlling pages
        console.log('[NCE SW] Pre-caching complete, skipping waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[NCE SW] Pre-caching failed:', error);
      })
  );
});

// ============================================================================
// ACTIVATE EVENT
// Clean up old caches when a new service worker version takes over
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('[NCE SW] Activate event fired');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete any cache that doesn't match our current cache name
              return cacheName.startsWith('nce-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[NCE SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Take control of all open pages immediately so the new SW
        // applies to them without requiring a reload
        console.log('[NCE SW] Claiming all clients');
        return self.clients.claim();
      })
      .then(() => {
        // Trim the cache to prevent it from growing too large
        return trimCache();
      })
  );
});

// ============================================================================
// FETCH EVENT
// Intercept network requests and apply the appropriate caching strategy
// ============================================================================
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Only handle GET requests (POST, PUT, DELETE should always go to network)
  if (event.request.method !== 'GET') {
    return;
  }

  // Only handle same-origin requests
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Determine the strategy based on the request type
  const strategy = getStrategy(event.request);

  switch (strategy) {
    case 'NETWORK_FIRST':
      event.respondWith(networkFirst(event.request));
      break;

    case 'CACHE_FIRST':
      event.respondWith(cacheFirst(event.request));
      break;

    case 'NETWORK_ONLY':
      event.respondWith(networkOnly(event.request));
      break;

    default:
      event.respondWith(networkFirst(event.request));
  }
});

// ============================================================================
// STRATEGY DETERMINATION
// ============================================================================
function getStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // API calls: always network-first (effectively network-only for data freshness)
  if (pathname.includes('/api/')) {
    return 'NETWORK_FIRST';
  }

  // Check by file extension
  const ext = getExtension(pathname);

  // HTML pages: network-first with cache fallback
  if (HTML_EXTENSIONS.includes(ext) || pathname === '/' || pathname.endsWith('/')) {
    return 'NETWORK_FIRST';
  }

  // Static assets (CSS, JS, images, fonts): cache-first
  if (CACHE_FIRST_EXTENSIONS.includes(ext)) {
    return 'CACHE_FIRST';
  }

  // Default to network-first for anything else
  return 'NETWORK_FIRST';
}

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Network-first strategy:
 * Try the network first. If it succeeds, cache the response and return it.
 * If the network fails (offline, timeout), fall back to cache.
 * Used for: HTML pages, API calls
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Attempt to fetch from network with a timeout
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);

    // If we got a valid response, cache it and return it
    if (networkResponse && networkResponse.ok) {
      // Clone the response before putting it in the cache
      // since response can only be consumed once
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    // Network failed — try the cache
    console.log('[NCE SW] Network failed for:', request.url, '— trying cache');

    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If this is a navigation request (HTML page) and we have no cache,
    // try to return the cached index.html as a fallback
    if (request.mode === 'navigate') {
      const fallbackResponse = await cache.match('/index.html');
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }

    // Return a basic offline response
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Cache-first strategy:
 * Check the cache first. If found, return the cached response.
 * If not in cache, fetch from network, cache the response, and return it.
 * Used for: Static assets (CSS, JS, images, fonts)
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  // Check cache first
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Not in cache — fetch from network
  try {
    const networkResponse = await fetch(request);

    // Only cache valid responses
    if (networkResponse && networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    // Network failed and not in cache
    console.log('[NCE SW] Cache miss and network failed for:', request.url);

    // For images, return a transparent 1x1 pixel as fallback
    if (isImageRequest(request)) {
      return getTransparentPixel();
    }

    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Network-only strategy:
 * Always fetch from the network. No caching.
 * Used for: Non-GET requests (handled earlier), or sensitive API calls
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch with a timeout to avoid hanging indefinitely on slow networks
 */
function fetchWithTimeout(request, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Fetch timeout'));
    }, timeout);

    fetch(request)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Extract the file extension from a URL pathname
 */
function getExtension(pathname) {
  const lastDot = pathname.lastIndexOf('.');
  if (lastDot === -1) return '';
  return pathname.slice(lastDot).toLowerCase();
}

/**
 * Check if the request is for an image
 */
function isImageRequest(request) {
  const ext = getExtension(new URL(request.url).pathname);
  return ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(ext);
}

/**
 * Return a transparent 1x1 pixel PNG as a fallback for failed image requests
 */
function getTransparentPixel() {
  const pixelData = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02,
    0x00, 0x01, 0xE5, 0x27, 0xDE, 0xFC, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
    0x60, 0x82
  ]);

  return new Response(pixelData, {
    status: 200,
    statusText: 'OK',
    headers: { 'Content-Type': 'image/png' }
  });
}

/**
 * Trim the cache to prevent unbounded growth.
 * Removes oldest entries if cache exceeds MAX_CACHE_ENTRIES.
 */
async function trimCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  if (keys.length > MAX_CACHE_ENTRIES) {
    const deleteCount = keys.length - MAX_CACHE_ENTRIES;
    const keysToDelete = keys.slice(0, deleteCount);

    await Promise.all(
      keysToDelete.map((key) => cache.delete(key))
    );

    console.log(`[NCE SW] Trimmed ${deleteCount} entries from cache`);
  }
}

// ============================================================================
// BACKGROUND SYNC (Placeholder)
// ============================================================================
self.addEventListener('sync', (event) => {
  console.log('[NCE SW] Background sync event fired:', event.tag);

  if (event.tag === 'nce-sync-commodities') {
    event.waitUntil(syncCommodities());
  } else if (event.tag === 'nce-sync-buy-requests') {
    event.waitUntil(syncBuyRequests());
  } else if (event.tag === 'nce-sync-property') {
    event.waitUntil(syncProperty());
  } else if (event.tag === 'nce-sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

/**
 * Placeholder: Sync commodities data in the background
 */
async function syncCommodities() {
  console.log('[NCE SW] Syncing commodities data...');
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch('/api/commodities');
    if (response && response.ok) {
      await cache.put('/api/commodities', response);
      console.log('[NCE SW] Commodities sync complete');
    }
  } catch (error) {
    console.error('[NCE SW] Commodities sync failed:', error);
    throw error; // Re-throw so the sync event can retry
  }
}

/**
 * Placeholder: Sync buy requests data in the background
 */
async function syncBuyRequests() {
  console.log('[NCE SW] Syncing buy requests data...');
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch('/api/buy-requests');
    if (response && response.ok) {
      await cache.put('/api/buy-requests', response);
      console.log('[NCE SW] Buy requests sync complete');
    }
  } catch (error) {
    console.error('[NCE SW] Buy requests sync failed:', error);
    throw error;
  }
}

/**
 * Placeholder: Sync property data in the background
 */
async function syncProperty() {
  console.log('[NCE SW] Syncing property data...');
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch('/api/property');
    if (response && response.ok) {
      await cache.put('/api/property', response);
      console.log('[NCE SW] Property sync complete');
    }
  } catch (error) {
    console.error('[NCE SW] Property sync failed:', error);
    throw error;
  }
}

/**
 * Placeholder: Sync user data in the background
 */
async function syncUserData() {
  console.log('[NCE SW] Syncing user data...');
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch('/api/user/profile');
    if (response && response.ok) {
      await cache.put('/api/user/profile', response);
      console.log('[NCE SW] User data sync complete');
    }
  } catch (error) {
    console.error('[NCE SW] User data sync failed:', error);
    throw error;
  }
}

// ============================================================================
// PUSH NOTIFICATION EVENT
// ============================================================================
self.addEventListener('push', (event) => {
  console.log('[NCE SW] Push notification event fired');

  let notificationData = {
    title: 'NCE - Notifikasi Baru',
    body: 'Anda memiliki notifikasi baru dari Nusantara Commodity Exchange.',
    icon: 'assets/images/icons/icon-192x192.png',
    badge: 'assets/images/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Buka'
      },
      {
        action: 'dismiss',
        title: 'Tutup'
      }
    ]
  };

  // Parse the push payload if available
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: {
          url: payload.url || payload.data?.url || '/',
          type: payload.type || 'general',
          id: payload.id || null,
          ...payload.data
        },
        actions: payload.actions || notificationData.actions,
        tag: payload.tag || 'nce-notification',
        requireInteraction: payload.requireInteraction || false,
        renotify: payload.renotify || true
      };
    } catch (error) {
      console.error('[NCE SW] Failed to parse push data:', error);
      // Use default notification data
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// ============================================================================
// NOTIFICATION CLICK EVENT
// ============================================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[NCE SW] Notification click event fired:', event.action);

  event.notification.close();

  // If the user clicked "dismiss", do nothing
  if (event.action === 'dismiss') {
    return;
  }

  // Determine the URL to open
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/';

  // Resolve relative URLs against the service worker's scope
  const fullUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === fullUrl && 'focus' in client) {
            return client.focus();
          }
        }

        // Check if there's any open window we can navigate
        for (const client of clientList) {
          if ('focus' in client && 'navigate' in client) {
            client.navigate(fullUrl);
            return client.focus();
          }
        }

        // No existing window found — open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
      })
  );
});

// ============================================================================
// MESSAGE EVENT
// Listen for messages from the main thread
// ============================================================================
self.addEventListener('message', (event) => {
  console.log('[NCE SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[NCE SW] Cache cleared');
        event.ports[0]?.postMessage({ type: 'CACHE_CLEARED' });
      })
    );
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.keys())
        .then((keys) => {
          event.ports[0]?.postMessage({
            type: 'CACHE_SIZE',
            size: keys.length
          });
        })
    );
  }

  if (event.data && event.data.type === 'REGISTER_SYNC') {
    const tag = event.data.tag;
    if (tag && 'sync' in self.registration) {
      self.registration.sync.register(tag)
        .then(() => {
          console.log('[NCE SW] Background sync registered:', tag);
        })
        .catch((error) => {
          console.error('[NCE SW] Background sync registration failed:', error);
        });
    }
  }
});
