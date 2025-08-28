/**
 * Service Worker for Layers Radar States Streets PWA
 * Provides offline functionality, caching, and background sync
 *
 * When registered with a URL containing ?e2e=1, the worker becomes a no-op
 * passthrough to avoid interference with E2E tests (no precache, no cache use).
 */

// Detect E2E test mode by query parameter on the script URL
const SCRIPT_URL = (typeof self !== 'undefined' && self.registration && self.registration.scriptURL) || '';
const E2E_MODE = /[?&]e2e=1(?:&|$)/.test(SCRIPT_URL);

const CACHE_NAME = "radar-map-v6.0.0";
const STATIC_CACHE = "radar-static-v6.0.0";
const DYNAMIC_CACHE = "radar-dynamic-v6.0.0";

// Files to cache for offline usage (ignored in E2E_MODE)
const STATIC_FILES = [
  "/",
  "/public/weather-radar.html",
  "/public/radar-diagnostics.html",
  "/public/radar-simple.html",
  "/index.html",
  "/public/manifest.json",
  "/public/js/script.js",
  "/icons/radar-icon-192.png",
  "/icons/radar-icon-512.png",
  "/favicon.ico"
];

// Tile servers and API endpoints that should be cached
const CACHEABLE_DOMAINS = [
  "tile.openstreetmap.org",
  "server.arcgisonline.com",
  "mesonet.agron.iastate.edu",
  "mapservices.weather.noaa.gov",
  "tilecache.rainviewer.com"
];

/**
 * Install event - cache static files
 */
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker: Installing...");
  if (E2E_MODE) {
    // In E2E mode, do not precache to avoid unexpected network traffic
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log("📦 Service Worker: Caching static files");
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log("✅ Service Worker: Installation complete");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("❌ Service Worker: Installation failed:", error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker: Activating...");
  if (E2E_MODE) {
    // In E2E mode, aggressively claim clients and skip cache cleanup to be fast
    event.waitUntil(self.clients.claim());
    return;
  }

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("🗑️ Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("✅ Service Worker: Activation complete");
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - handle network requests with caching strategy
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // In E2E mode, act as a transparent proxy
  if (E2E_MODE) {
    event.respondWith(fetch(request));
    return;
  }

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Handle different types of requests with appropriate strategies
  // Documents (HTML): always Network First to ensure latest UI
  if (isDocumentRequest(request)) {
    event.respondWith(networkFirst(request, { noStore: true }));
  }
  // Scripts and styles: Network First to propagate updates, fallback to cache
  else if (isScriptOrStyle(request)) {
    event.respondWith(networkFirst(request, { noStore: true }));
  }
  // RainViewer tiles: Network Only (no SW caching) to avoid stale loops
  else if (isRainviewerTile(request.url)) {
    event.respondWith(networkOnly(request));
  }
  // Other static assets: Cache First
  else if (isStaticFile(request.url)) {
    event.respondWith(cacheFirst(request));
  }
  // Other map tiles: Stale While Revalidate
  else if (isTileRequest(request.url)) {
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
self.addEventListener("sync", (event) => {
  console.log("🔄 Service Worker: Background sync triggered:", event.tag);
  if (E2E_MODE) return; // Disabled in E2E mode

  if (event.tag === "radar-data-sync") {
    event.waitUntil(syncRadarData());
  } else if (event.tag === "location-sync") {
    event.waitUntil(syncLocationData());
  }
});

/**
 * Push notifications for weather alerts
 */
self.addEventListener("push", (event) => {
  console.log("📢 Service Worker: Push notification received");
  if (E2E_MODE) return; // Disabled in E2E mode

  const options = {
    body: event.data ? event.data.text() : "Weather update available",
    icon: "/assets/icons/icon-144x144.png",
    vibrate: [200, 100, 200],
    tag: "weather-alert",
    actions: [
      {
        action: "view",
        title: "View Map"
      },
      {
        action: "dismiss",
        title: "Dismiss"
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification("Weather Radar Update", options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Service Worker: Notification clicked:", event.action);
  if (E2E_MODE) return; // Disabled in E2E mode

  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(
      self.clients.openWindow("/")
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
  console.error("Cache First strategy failed:", error);
  return new Response("Offline content not available", { status: 503 });
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
    new Response("Tile not available offline", { status: 503 });
}

/**
 * Network First Strategy - for API data
 */
async function networkFirst(request, opts = {}) {
  try {
    const fetchReq = opts.noStore ? new Request(request, { cache: 'no-store' }) : request;
    const networkResponse = await fetch(fetchReq);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse ||
      new Response("API data not available offline", { status: 503 });
  }
}

/**
 * Network Only Strategy - bypass caching entirely
 */
async function networkOnly(request) {
  try {
    const fetchReq = new Request(request, { cache: 'no-store' });
    return await fetch(fetchReq);
  } catch (error) {
    return new Response("Network unavailable", { status: 503 });
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
      new Response("Content not available offline", { status: 503 });
  }
}

// Helper Functions

function isStaticFile(url) {
  return STATIC_FILES.some(file => url.includes(file)) ||
         url.includes("/src/") ||
         url.includes("/assets/") ||
         url.includes("manifest.json");
}

function isTileRequest(url) {
  return CACHEABLE_DOMAINS.some(domain => url.includes(domain)) ||
         url.includes("/tile/") ||
         url.includes("/tiles/");
}

function isAPIRequest(url) {
  return url.includes("/api/") ||
         url.includes("weather.gov") ||
         url.includes("noaa.gov");
}

function isRainviewerTile(url) {
  return url.includes('tilecache.rainviewer.com');
}

function isDocumentRequest(request) {
  return request.destination === 'document' || (request.headers.get('accept') || '').includes('text/html');
}

function isScriptOrStyle(request) {
  return request.destination === 'script' || request.destination === 'style' || /\.(js|css)(\?|$)/.test(request.url);
}

/**
 * Background sync for radar data
 */
async function syncRadarData() {
  try {
    console.log("🔄 Syncing radar data in background...");

    // Fetch latest radar data
    const response = await fetch("/api/radar/latest");
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put("/api/radar/latest", response.clone());
      console.log("Radar data updated in cache");
    }
  } catch (error) {
    console.error("Background radar sync failed:", error);
  }
}

/**
 * Background sync for location data
 */
async function syncLocationData() {
  try {
    console.log("🔄 Syncing location data in background...");

    // This would sync any cached location-based data
    // Implementation depends on specific location services used

  } catch (error) {
    console.error("Background location sync failed:", error);
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
    const dateHeader = response.headers.get("date");

    if (dateHeader && new Date(dateHeader).getTime() < oneDayAgo) {
      cache.delete(request);
    }
  });
}

// Run cleanup periodically
setInterval(cleanupCache, 60 * 60 * 1000); // Every hour
