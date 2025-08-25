/**
 * Performance Optimizer Component
 * Provides comprehensive performance optimizations including WebGL rendering,
 * tile caching, lazy loading, and resource management
 */

export class PerformanceOptimizer {
  constructor(mapComponent) {
    this.mapComponent = mapComponent;
    this.webGLSupported = this.checkWebGLSupport();
    this.webGLEnabled = false;
    this.tileCache = new Map();
    this.resourceCache = new Map();
    this.lazyLoadQueue = [];
    this.observedElements = new Set();
    this.performanceMetrics = {
      frameRate: [],
      loadTimes: [],
      memorySamples: [],
      networkRequests: []
    };
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.isMonitoring = false;
    this.compressionEnabled = false;
    this.prefetchQueue = [];
    this.connectionInfo = null;

    this.init();
  }

  /**
   * Safely get visible bounds in EPSG:4326 with guards for nulls
   */
  _getVisibleBounds4326() {
    const DEFAULT = [-180, -85, 180, 85];
    try {
      const map = this.mapComponent?.getMap?.() || this.mapComponent;
      const view = map && map.getView ? map.getView() : null;
      const size = map && map.getSize ? map.getSize() : null;
      if (!map || !view || !view.calculateExtent || !size || !isFinite(size[0]) || !isFinite(size[1])) {
        console.warn('Bounds fallback used due to missing map/view/size');
        return DEFAULT;
      }
      const extent = view.calculateExtent(size);
      if (window.ol && ol.proj && typeof ol.proj.transformExtent === 'function') {
        try {
          return ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
        } catch (e) {
          console.warn('transformExtent failed, returning default', e);
          return DEFAULT;
        }
      }
      return DEFAULT;
    } catch (e) {
      console.warn('Error computing visible bounds, returning default', e);
      return DEFAULT;
    }
  }

  _getZoom() {
    try {
      const map = this.mapComponent?.getMap?.() || this.mapComponent;
      const view = map && map.getView ? map.getView() : null;
      const z = view && view.getZoom ? view.getZoom() : null;
      return typeof z === 'number' && isFinite(z) ? z : 3;
    } catch (_) {
      return 3;
    }
  }

  /**
   * Initialize performance optimizations
   */
  init() {
    this.detectConnectionQuality();
    this.setupTilePreloading();
    this.setupLazyLoading();
    this.setupResourceCaching();
    this.setupCompressionHandling();
    this.startPerformanceMonitoring();
    this.optimizeForDevice();

    console.log('⚡ Performance Optimizer initialized');
    console.log(`📊 WebGL Support: ${this.webGLSupported ? 'Yes' : 'No'}`);
    console.log(`📱 Device Type: ${this.getDeviceType()}`);
    console.log(`🌐 Connection: ${this.connectionInfo?.effectiveType || 'Unknown'}`);
  }

  /**
   * Check WebGL support
   */
  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect connection quality and adapt behavior
   */
  detectConnectionQuality() {
    if ('connection' in navigator) {
      this.connectionInfo = navigator.connection;

      // Adapt to connection quality
      const effectiveType = this.connectionInfo.effectiveType;

      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          this.enableDataSavingMode();
          break;
        case '3g':
          this.enableMediumQualityMode();
          break;
        case '4g':
        default:
          this.enableHighQualityMode();
          break;
      }

      // Listen for connection changes
      this.connectionInfo.addEventListener('change', () => {
        this.detectConnectionQuality();
      });
    }
  }

  /**
   * Enable WebGL acceleration
   */
  enableWebGLAcceleration() {
    if (!this.webGLSupported) {
      console.warn('⚠️ WebGL not supported on this device');
      return false;
    }

    this.webGLEnabled = true;

    // Configure map for WebGL rendering
    if (this.mapComponent && this.mapComponent.enableWebGL) {
      this.mapComponent.enableWebGL();
    }

    console.log('🚀 WebGL acceleration enabled');
    return true;
  }

  /**
   * Disable WebGL acceleration
   */
  disableWebGLAcceleration() {
    this.webGLEnabled = false;

    if (this.mapComponent && this.mapComponent.disableWebGL) {
      this.mapComponent.disableWebGL();
    }

    console.log('🔽 WebGL acceleration disabled');
  }

  /**
   * Setup tile preloading and caching
   */
  setupTilePreloading() {
    this.tileCache = new Map();
    this.maxCacheSize = this.getOptimalCacheSize();

    // Preload tiles based on viewport
    this.preloadVisibleTiles();

    // Preload adjacent tiles
    this.preloadAdjacentTiles();
  }

  /**
   * Get optimal cache size based on device capabilities
   */
  getOptimalCacheSize() {
    const deviceMemory = navigator.deviceMemory || 4; // GB
    const baseSize = 50; // Base number of tiles

    if (deviceMemory >= 8) {
      return baseSize * 4; // 200 tiles
    } else if (deviceMemory >= 4) {
      return baseSize * 2; // 100 tiles
    } else {
      return baseSize; // 50 tiles
    }
  }

  /**
   * Preload visible tiles
   */
  preloadVisibleTiles() {
    if (!this.mapComponent) return;

    const bounds = this._getVisibleBounds4326();
    const zoom = this._getZoom();

    this.queueTilePreload(bounds, zoom);
  }

  /**
   * Preload adjacent tiles
   */
  preloadAdjacentTiles() {
    if (!this.mapComponent) return;

    const bounds = this._getVisibleBounds4326();
    const zoom = this._getZoom();

    // Expand bounds to include adjacent areas
    const expandedBounds = this.expandBounds(bounds, 1.5);

    this.queueTilePreload(expandedBounds, zoom, 'low');
  }

  /**
   * Queue tile for preloading
   */
  queueTilePreload(bounds, zoom, priority = 'normal') {
    const tiles = this.generateTileList(bounds, zoom);

    tiles.forEach(tile => {
      if (!this.tileCache.has(tile.url)) {
        this.prefetchQueue.push({
          url: tile.url,
          priority,
          bounds: tile.bounds,
          zoom
        });
      }
    });

    this.processPrefetchQueue();
  }

  /**
   * Process prefetch queue with throttling
   */
  async processPrefetchQueue() {
    if (this.prefetchQueue.length === 0) return;

    // Sort by priority
    this.prefetchQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process tiles with network-aware throttling
    const concurrency = this.getOptimalConcurrency();
    const batch = this.prefetchQueue.splice(0, concurrency);

    const promises = batch.map(tile => this.preloadTile(tile));
    await Promise.allSettled(promises);

    // Continue processing if queue not empty
    if (this.prefetchQueue.length > 0) {
      setTimeout(() => this.processPrefetchQueue(), 100);
    }
  }

  /**
   * Get optimal concurrency based on connection
   */
  getOptimalConcurrency() {
    if (!this.connectionInfo) return 3;

    switch (this.connectionInfo.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 1;
      case '3g':
        return 2;
      case '4g':
      default:
        return 4;
    }
  }

  /**
   * Preload individual tile
   */
  async preloadTile(tile) {
    try {
      const startTime = performance.now();

      const response = await fetch(tile.url, {
        method: 'GET',
        cache: 'force-cache'
      });

      if (response.ok) {
        const blob = await response.blob();
        const loadTime = performance.now() - startTime;

        // Cache the tile
        this.cacheTile(tile.url, blob, loadTime);

        this.performanceMetrics.networkRequests.push({
          url: tile.url,
          loadTime,
          size: blob.size,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.warn('Failed to preload tile:', tile.url, error);
    }
  }

  /**
   * Cache tile with size management
   */
  cacheTile(url, blob, loadTime) {
    // Remove oldest tiles if cache is full
    if (this.tileCache.size >= this.maxCacheSize) {
      const oldestKey = this.tileCache.keys().next().value;
      this.tileCache.delete(oldestKey);
    }

    this.tileCache.set(url, {
      blob,
      loadTime,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  /**
   * Get cached tile
   */
  getCachedTile(url) {
    const cached = this.tileCache.get(url);
    if (cached) {
      cached.accessCount++;
      cached.lastAccess = Date.now();
      return cached.blob;
    }
    return null;
  }

  /**
   * Setup lazy loading for images and resources
   */
  setupLazyLoading() {
    // Create intersection observer for lazy loading
    this.lazyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadLazyElement(entry.target);
            this.lazyObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 50px 50px 50px', // Load 50px before entering viewport
        threshold: 0.1
      }
    );

    // Observe existing lazy elements
    this.observeLazyElements();
  }

  /**
   * Observe elements for lazy loading
   */
  observeLazyElements() {
    const lazyElements = document.querySelectorAll('[data-lazy], [loading="lazy"]');
    lazyElements.forEach(element => {
      this.lazyObserver.observe(element);
      this.observedElements.add(element);
    });
  }

  /**
   * Load lazy element
   */
  loadLazyElement(element) {
    const startTime = performance.now();

    if (element.dataset.lazy) {
      // Load data-lazy attribute
      const src = element.dataset.lazy;

      if (element.tagName === 'IMG') {
        element.onload = () => {
          const loadTime = performance.now() - startTime;
          this.performanceMetrics.loadTimes.push({
            type: 'image',
            loadTime,
            size: element.naturalWidth * element.naturalHeight
          });
        };
        element.src = src;
      } else {
        // Handle other elements
        this.loadResource(src).then(data => {
          const loadTime = performance.now() - startTime;
          this.performanceMetrics.loadTimes.push({
            type: 'resource',
            loadTime,
            size: data.length
          });
        });
      }

      element.removeAttribute('data-lazy');
    }
  }

  /**
   * Setup resource caching
   */
  setupResourceCaching() {
    // Intercept fetch requests for caching
    const originalFetch = window.fetch;

    window.fetch = async (url, options = {}) => {
      // Check cache first
      const cacheKey = this.generateCacheKey(url, options);
      const cached = this.resourceCache.get(cacheKey);

      if (cached && !this.isCacheExpired(cached)) {
        return new Response(cached.data, {
          status: 200,
          statusText: 'OK (cached)',
          headers: cached.headers
        });
      }

      // Fetch from network
      try {
        const response = await originalFetch(url, options);

        // Cache successful responses
        if (response.ok && this.shouldCache(url, options)) {
          const clonedResponse = response.clone();
          const data = await clonedResponse.arrayBuffer();

          this.resourceCache.set(cacheKey, {
            data,
            headers: Object.fromEntries(response.headers.entries()),
            timestamp: Date.now(),
            url
          });
        }

        return response;
      } catch (error) {
        // Return cached version if network fails
        if (cached) {
          console.log('🔄 Using cached version due to network error:', url);
          return new Response(cached.data, {
            status: 200,
            statusText: 'OK (cached fallback)',
            headers: cached.headers
          });
        }
        throw error;
      }
    };
  }

  /**
   * Generate cache key for resource
   */
  generateCacheKey(url, options) {
    const method = options.method || 'GET';
    const headers = JSON.stringify(options.headers || {});
    return `${method}:${url}:${headers}`;
  }

  /**
   * Check if cache entry is expired
   */
  isCacheExpired(cached) {
    const maxAge = 3600000; // 1 hour
    return Date.now() - cached.timestamp > maxAge;
  }

  /**
   * Determine if resource should be cached
   */
  shouldCache(url, options) {
    // Only cache GET requests
    if (options.method && options.method !== 'GET') return false;

    // Cache tiles, images, and static resources
    return /\.(png|jpg|jpeg|gif|svg|json|css|js)$/i.test(url) ||
           url.includes('/tile/') ||
           url.includes('tile.openstreetmap.org') ||
           url.includes('radar.weather.gov');
  }

  /**
   * Setup compression handling
   */
  setupCompressionHandling() {
    // Check if compression is supported
    this.compressionSupported = 'CompressionStream' in window;

    if (this.compressionSupported) {
      console.log('📦 Compression support detected');
    }
  }

  /**
   * Enable data compression
   */
  enableCompression() {
    if (!this.compressionSupported) {
      console.warn('⚠️ Compression not supported on this browser');
      return false;
    }

    this.compressionEnabled = true;
    console.log('📦 Data compression enabled');
    return true;
  }

  /**
   * Compress data
   */
  async compressData(data) {
    if (!this.compressionEnabled || !this.compressionSupported) {
      return data;
    }

    try {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(new TextEncoder().encode(JSON.stringify(data)));
      writer.close();

      const chunks = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
    } catch (error) {
      console.warn('Compression failed:', error);
      return data;
    }
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();

    // Monitor frame rate
    this.monitorFrameRate();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor network performance
    this.monitorNetworkPerformance();

    console.log('📊 Performance monitoring started');
  }

  /**
   * Monitor frame rate
   */
  monitorFrameRate() {
    const measureFrame = (currentTime) => {
      if (!this.isMonitoring) return;

      this.frameCount++;
      const deltaTime = currentTime - this.lastFrameTime;

      if (deltaTime >= 1000) { // Calculate FPS every second
        const fps = (this.frameCount * 1000) / deltaTime;
        this.performanceMetrics.frameRate.push({
          fps,
          timestamp: Date.now()
        });

        // Keep only last 60 samples
        if (this.performanceMetrics.frameRate.length > 60) {
          this.performanceMetrics.frameRate.shift();
        }

        this.frameCount = 0;
        this.lastFrameTime = currentTime;

        // Adjust quality based on FPS
        this.adjustQualityBasedOnFPS(fps);
      }

      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if (!('memory' in performance)) return;

    setInterval(() => {
      if (!this.isMonitoring) return;

      const memory = performance.memory;
      this.performanceMetrics.memorySamples.push({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      });

      // Keep only last 120 samples (10 minutes at 5s intervals)
      if (this.performanceMetrics.memorySamples.length > 120) {
        this.performanceMetrics.memorySamples.shift();
      }

      // Trigger garbage collection if memory usage is high
      this.checkMemoryPressure();

    }, 5000); // Every 5 seconds
  }

  /**
   * Monitor network performance
   */
  monitorNetworkPerformance() {
    // Monitor resource timing
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.performanceMetrics.networkRequests.push({
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize || 0,
              timestamp: entry.startTime
            });
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Adjust quality based on FPS
   */
  adjustQualityBasedOnFPS(fps) {
    if (fps < 30) {
      this.enablePerformanceMode();
    } else if (fps > 50) {
      this.enableQualityMode();
    }
  }

  /**
   * Check memory pressure and cleanup if needed
   */
  checkMemoryPressure() {
    if (!('memory' in performance)) return;

    const memory = performance.memory;
    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    if (usageRatio > 0.85) {
      console.warn('⚠️ High memory usage detected, cleaning up...');
      this.performMemoryCleanup();
    }
  }

  /**
   * Perform memory cleanup
   */
  performMemoryCleanup() {
    // Clear old cache entries
    this.cleanupTileCache();
    this.cleanupResourceCache();

    // Clear old performance metrics
    this.cleanupPerformanceMetrics();

    // Suggest garbage collection (if available)
    if ('gc' in window) {
      window.gc();
    }
  }

  /**
   * Cleanup tile cache
   */
  cleanupTileCache() {
    const now = Date.now();
    const maxAge = 1800000; // 30 minutes

    for (const [key, value] of this.tileCache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.tileCache.delete(key);
      }
    }
  }

  /**
   * Cleanup resource cache
   */
  cleanupResourceCache() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [key, value] of this.resourceCache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.resourceCache.delete(key);
      }
    }
  }

  /**
   * Cleanup performance metrics
   */
  cleanupPerformanceMetrics() {
    // Keep only recent data
    const cutoff = Date.now() - 1800000; // 30 minutes

    this.performanceMetrics.frameRate = this.performanceMetrics.frameRate.filter(
      sample => sample.timestamp > cutoff
    );

    this.performanceMetrics.memorySamples = this.performanceMetrics.memorySamples.filter(
      sample => sample.timestamp > cutoff
    );

    this.performanceMetrics.networkRequests = this.performanceMetrics.networkRequests.filter(
      request => request.timestamp > cutoff
    );
  }

  /**
   * Optimize for device type
   */
  optimizeForDevice() {
    const deviceType = this.getDeviceType();

    switch (deviceType) {
      case 'mobile':
        this.enableMobileOptimizations();
        break;
      case 'tablet':
        this.enableTabletOptimizations();
        break;
      case 'desktop':
        this.enableDesktopOptimizations();
        break;
    }
  }

  /**
   * Get device type
   */
  getDeviceType() {
    const width = window.innerWidth;
    const userAgent = navigator.userAgent;

    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return width < 768 ? 'mobile' : 'tablet';
    }

    return width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
  }

  // Quality mode methods
  enableDataSavingMode() {
    this.tileQuality = 'low';
    this.prefetchEnabled = false;
    this.maxCacheSize = Math.floor(this.maxCacheSize * 0.5);
    console.log('📱 Data saving mode enabled');
  }

  enableMediumQualityMode() {
    this.tileQuality = 'medium';
    this.prefetchEnabled = true;
    console.log('📊 Medium quality mode enabled');
  }

  enableHighQualityMode() {
    this.tileQuality = 'high';
    this.prefetchEnabled = true;
    console.log('💎 High quality mode enabled');
  }

  enablePerformanceMode() {
    this.tileQuality = 'low';
    this.disableWebGLAcceleration();
    console.log('⚡ Performance mode enabled');
  }

  enableQualityMode() {
    this.tileQuality = 'high';
    if (this.webGLSupported) {
      this.enableWebGLAcceleration();
    }
    console.log('🎨 Quality mode enabled');
  }

  // Device-specific optimizations
  enableMobileOptimizations() {
    this.maxCacheSize = Math.floor(this.maxCacheSize * 0.5);
    this.enableDataSavingMode();
    this.disableWebGLAcceleration(); // Save battery
    console.log('📱 Mobile optimizations enabled');
  }

  enableTabletOptimizations() {
    this.enableMediumQualityMode();
    console.log('📱 Tablet optimizations enabled');
  }

  enableDesktopOptimizations() {
    this.enableHighQualityMode();
    if (this.webGLSupported) {
      this.enableWebGLAcceleration();
    }
    console.log('💻 Desktop optimizations enabled');
  }

  // Utility methods
  expandBounds(bounds, factor) {
    const width = bounds.right - bounds.left;
    const height = bounds.top - bounds.bottom;
    const extraWidth = width * (factor - 1) / 2;
    const extraHeight = height * (factor - 1) / 2;

    return {
      left: bounds.left - extraWidth,
      right: bounds.right + extraWidth,
      top: bounds.top + extraHeight,
      bottom: bounds.bottom - extraHeight
    };
  }

  generateTileList(bounds, zoom) {
    // This would generate a list of tile URLs based on bounds and zoom
    // Implementation depends on tile server format
    const tiles = [];

    // Example tile generation (simplified)
    const tileSize = 256;
    const numTiles = Math.pow(2, zoom);

    const leftTile = Math.floor((bounds.left + 180) / 360 * numTiles);
    const rightTile = Math.floor((bounds.right + 180) / 360 * numTiles);
    const topTile = Math.floor((1 - Math.log(Math.tan(bounds.top * Math.PI / 180) + 1 / Math.cos(bounds.top * Math.PI / 180)) / Math.PI) / 2 * numTiles);
    const bottomTile = Math.floor((1 - Math.log(Math.tan(bounds.bottom * Math.PI / 180) + 1 / Math.cos(bounds.bottom * Math.PI / 180)) / Math.PI) / 2 * numTiles);

    for (let x = leftTile; x <= rightTile; x++) {
      for (let y = topTile; y <= bottomTile; y++) {
        tiles.push({
          url: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
          bounds: { x, y, zoom }
        });
      }
    }

    return tiles;
  }

  async loadResource(url) {
    const response = await fetch(url);
    return response.text();
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const avgFPS = this.performanceMetrics.frameRate.length > 0
      ? this.performanceMetrics.frameRate.reduce((sum, sample) => sum + sample.fps, 0) / this.performanceMetrics.frameRate.length
      : 0;

    const avgLoadTime = this.performanceMetrics.loadTimes.length > 0
      ? this.performanceMetrics.loadTimes.reduce((sum, sample) => sum + sample.loadTime, 0) / this.performanceMetrics.loadTimes.length
      : 0;

    const currentMemory = this.performanceMetrics.memorySamples.length > 0
      ? this.performanceMetrics.memorySamples[this.performanceMetrics.memorySamples.length - 1]
      : null;

    return {
      webGL: {
        supported: this.webGLSupported,
        enabled: this.webGLEnabled
      },
      performance: {
        averageFPS: Math.round(avgFPS * 100) / 100,
        averageLoadTime: Math.round(avgLoadTime * 100) / 100,
        cacheHitRate: this.calculateCacheHitRate()
      },
      memory: currentMemory ? {
        used: Math.round(currentMemory.used / 1024 / 1024), // MB
        total: Math.round(currentMemory.total / 1024 / 1024), // MB
        usage: Math.round((currentMemory.used / currentMemory.total) * 100) // %
      } : null,
      cache: {
        tiles: this.tileCache.size,
        resources: this.resourceCache.size,
        maxSize: this.maxCacheSize
      },
      network: {
        connectionType: this.connectionInfo?.effectiveType || 'unknown',
        requests: this.performanceMetrics.networkRequests.length
      }
    };
  }

  calculateCacheHitRate() {
    // This would calculate actual cache hit rate
    // For now, return estimated value
    return 0.75; // 75% hit rate
  }

  /**
   * Stop performance monitoring
   */
  stopPerformanceMonitoring() {
    this.isMonitoring = false;
    console.log('📊 Performance monitoring stopped');
  }

  /**
   * Destroy performance optimizer
   */
  destroy() {
    this.stopPerformanceMonitoring();

    if (this.lazyObserver) {
      this.lazyObserver.disconnect();
    }

    this.tileCache.clear();
    this.resourceCache.clear();
    this.prefetchQueue = [];

    // Restore original fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
  }
}

// Intentionally no duplicate exported helper here; public build should import from src if needed.
