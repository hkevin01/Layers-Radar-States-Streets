/**
 * Service Worker for Weather Radar Application
 * Provides offline support and tile caching
 * @version 1.0.0
 */

const CACHE_NAME = 'weather-radar-cache-v1';
const TILE_CACHE_NAME = 'weather-radar-tiles-v1';
const API_CACHE_NAME = 'weather-radar-api-v1';

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/apps/weather-radar-app.js',
  '/src/core/weather-radar-core.js',
  '/styles/main.css'
];

// Install event - precache critical assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then(cache => {
        console.log('📦 Precaching application assets...');
        return cache.addAll(PRECACHE_ASSETS);
      }),

      // Create tile cache
      caches.open(TILE_CACHE_NAME),

      // Create API cache
      caches.open(API_CACHE_NAME)
    ])
    .then(() => {
      console.log('✅ Precaching complete');
      return self.skipWaiting();
    })
  );
});

// Activation event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // Cleanup old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Remove old versions of caches
              return cacheName.startsWith('weather-radar-') &&
                     ![CACHE_NAME, TILE_CACHE_NAME, API_CACHE_NAME].includes(cacheName);
            })
            .map(cacheName => {
              console.log(`🧹 Removing old cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      }),

      // Claim clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Handle tile requests
  if (url.pathname.includes('/tiles/')) {
    event.respondWith(handleTileRequest(event.request));
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(event.request));
});

/**
 * Handle tile request with caching
 */
async function handleTileRequest(request) {
  // Check cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Return cached tile
    return cachedResponse;
  }

  try {
    // Fetch new tile
    const response = await fetch(request);

    if (response.ok) {
      // Cache the tile
      const cache = await caches.open(TILE_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;

  } catch (error) {
    console.error('Failed to fetch tile:', error);
    // Return offline tile placeholder
    return new Response(null, {
      status: 404,
      statusText: 'Tile not available offline'
    });
  }
}

/**
 * Handle API request with network-first strategy
 */
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);

    if (response.ok) {
      // Cache successful response
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    }

    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available
    throw new Error('API request failed');

  } catch (error) {
    console.error('API request failed:', error);

    // Check cache for offline support
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return error response
    return new Response(JSON.stringify({
      error: 'Failed to fetch data',
      offline: true
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Handle static asset request with cache-first strategy
 */
async function handleStaticRequest(request) {
  // Check cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fetch from network
    const response = await fetch(request);

    if (response.ok) {
      // Cache successful response
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;

  } catch (error) {
    console.error('Failed to fetch static asset:', error);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    // Return error response
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-radar-data') {
    event.waitUntil(syncRadarData());
  }
});

/**
 * Sync radar data when back online
 */
async function syncRadarData() {
  try {
    // Get all cached requests that need syncing
    const cache = await caches.open(API_CACHE_NAME);
    const requests = await cache.keys();

    // Sync each request
    await Promise.all(
      requests.map(async request => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response);
          }
        } catch (error) {
          console.error('Failed to sync request:', error);
        }
      })
    );

    console.log('📡 Radar data synced successfully');

  } catch (error) {
    console.error('Failed to sync radar data:', error);
    throw error;
  }
}

// Push notification handler
self.addEventListener('push', event => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icons/radar-icon-192.png',
    badge: '/icons/radar-badge-96.png',
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification('Weather Radar Update', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
