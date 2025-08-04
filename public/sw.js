/**
 * Service Worker for Layers Radar States Streets PWA
 * Provides offline functionality, caching, and background sync
 */

const CACHE_NAME = 'radar-map-v2.0.0';
const STATIC_CACHE = 'radar-static-v2.0.0';
const DYNAMIC_CACHE = 'radar-dynamic-v2.0.0';

// Files to cache for offline usage
const STATIC_FILES = [
  '/',
  '/public/weather-radar.html',
  '/public/weather-radar-fixed.html',
  '/public/simple-radar-test.html',
  '/public/project-tracker.html',
  // External libraries (served from CDN)
  'https://cdn.jsdelivr.net/npm/ol@8.2.0/ol.css',
  'https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js',
  'https://unpkg.com/ol-layerswitcher@4.1.1/dist/ol-layerswitcher.css',
  'https://unpkg.com/ol-layerswitcher@4.1.1',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/weather-icons/2.0.12/css/weather-icons.min.css'
];

// Tile servers and API endpoints that should be cached
const CACHEABLE_DOMAINS = [
  'tile.openstreetmap.org',
  'server.arcgisonline.com',
  'mesonet.agron.iastate.edu',
  'mapservices.weather.noaa.gov',
  'tilecache.rainviewer.com'
];

/**
 * Install event - cache static files
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - handle network requests with caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests with appropriate strategies
  if (isStaticFile(request.url)) {
    // Static files: Cache First strategy
    event.respondWith(cacheFirst(request));
  } else if (isTileRequest(request.url)) {
    // Map tiles: Stale While Revalidate strategy
    event.respondWith(staleWhileRevalidate(request));
  } else if (isAPIRequest(request.url)) {
    // API data: Network First strategy
    event.respondWith(networkFirst(request));
  } else {
    // Other requests: Network with cache fallback
    event.respondWith(networkWithCacheFallback(request));
  }
});

/**
 * Background sync for data updates
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'radar-data-sync') {
    event.waitUntil(syncRadarData());
  } else if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationData());
  }
});

/**
 * Push notifications for weather alerts
 */
self.addEventListener('push', (event) => {
  console.log('📢 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Weather update available',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'weather-alert',
    actions: [
      {
        action: 'view',
        title: 'View Map',
        icon: '/assets/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/assets/icons/dismiss-action.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Weather Radar Update', options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Caching Strategies

/**
 * Cache First Strategy - for static files
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.error('Cache First strategy failed:', error);
    return new Response('Offline content not available', { status: 503 });
  }
}

/**
 * Stale While Revalidate Strategy - for map tiles
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const networkResponsePromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  
  return cachedResponse || await networkResponsePromise || 
    new Response('Tile not available offline', { status: 503 });
}

/**
 * Network First Strategy - for API data
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || 
      new Response('API data not available offline', { status: 503 });
  }
}

/**
 * Network with Cache Fallback Strategy
 */
async function networkWithCacheFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || 
      new Response('Content not available offline', { status: 503 });
  }
}

// Helper Functions

function isStaticFile(url) {
  return STATIC_FILES.some(file => url.includes(file)) ||
         url.includes('/src/') ||
         url.includes('/assets/') ||
         url.includes('manifest.json');
}

function isTileRequest(url) {
  return CACHEABLE_DOMAINS.some(domain => url.includes(domain)) ||
         url.includes('/tile/') ||
         url.includes('/tiles/');
}

function isAPIRequest(url) {
  return url.includes('/api/') ||
         url.includes('weather.gov') ||
         url.includes('noaa.gov');
}

/**
 * Background sync for radar data
 */
async function syncRadarData() {
  try {
    console.log('🔄 Syncing radar data in background...');
    
    // Fetch latest radar data
    const response = await fetch('/api/radar/latest');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put('/api/radar/latest', response.clone());
      
      // Notify clients of update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'RADAR_DATA_UPDATED',
          timestamp: Date.now()
        });
      });
    }
  } catch (error) {
    console.error('Background radar sync failed:', error);
  }
}

/**
 * Background sync for location data
 */
async function syncLocationData() {
  try {
    console.log('🔄 Syncing location data in background...');
    
    // This would sync any cached location-based data
    // Implementation depends on specific location services used
    
  } catch (error) {
    console.error('Background location sync failed:', error);
  }
}

/**
 * Clean up old cache entries
 */
async function cleanupCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  
  // Remove entries older than 24 hours
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  requests.forEach(async (request) => {
    const response = await cache.match(request);
    const dateHeader = response.headers.get('date');
    
    if (dateHeader && new Date(dateHeader).getTime() < oneDayAgo) {
      cache.delete(request);
    }
  });
}

// Run cleanup periodically
setInterval(cleanupCache, 60 * 60 * 1000); // Every hour
