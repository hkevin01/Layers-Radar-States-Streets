/**
 * Main entry point for the Layers Radar States Streets application
 * Modernized and refactored from legacy script.js with enhanced GUI features
 */

import { AccessibilityHelper } from './components/accessibility-helper.js';
import { DataVisualization } from './components/data-visualization.js';
import { MapComponent } from './components/map-component.js';
import { MobileTouchControls } from './components/mobile-touch-controls.js';
import { PerformanceOptimizer } from './components/performance-optimizer.js';
import { PWAHelper } from './components/pwa-helper.js';
import { UIControls } from './components/ui-controls.js';

// Global instances for backward compatibility and enhanced features
let mapComponent = null;
let uiControls = null;
let mobileControls = null;
let pwaHelper = null;
let dataVisualization = null;
let accessibilityHelper = null;
let performanceOptimizer = null;

/**
 * Initialize the application with enhanced features and modern UI components
 * @param {string} containerId - Map container element ID
 * @returns {Promise<MapComponent>} - Map component instance
 */
async function initializeApp(containerId = 'map') {
  try {
    console.log('🚀 Initializing enhanced map application...');

    // Show loading state
    if (typeof window.loading === 'function') {
      window.loading(true);
    }

    // Initialize performance optimizer first
    console.log('⚡ Initializing performance optimizer...');
    performanceOptimizer = new PerformanceOptimizer({
      tileCacheSize: 500,
      maxMemoryUsage: 0.75,
      preloadAdjacentTiles: true,
      enableWebGLAcceleration: true
    });
    // Expose early for tests
    window.performanceOptimizer = performanceOptimizer;

    // Initialize PWA features with offline support
    console.log('📱 Initializing PWA features...');
    pwaHelper = new PWAHelper({
      enableServiceWorker: true,
      enableOfflineSupport: true,
      cacheStrategy: 'network-first',
      precacheAssets: [
        '/index.html',
        '/styles/main.css',
        '/src/main.js'
      ]
    });

    // Initialize weather radar app
    console.log('🗺️ Initializing weather radar component...');
    const weatherRadarConfig = {
      target: containerId,
      enableGeolocation: true,
      enableControls: true,
      mapOptions: {
        minZoom: 4,
        maxZoom: 16,
        center: [-95.7129, 37.0902], // US center
        zoom: 5
      },
      radarOptions: {
        updateInterval: 300000, // 5 minutes
        maxFrames: 24,
        autoUpdate: true
      }
    };

    const { WeatherRadarApp } = await import('./apps/weather-radar-app.js');
    const weatherRadarApp = new WeatherRadarApp(weatherRadarConfig);
    await weatherRadarApp.init();

    mapComponent = weatherRadarApp.getMap();

    // Update performance optimizer with map instance
    if (performanceOptimizer && mapComponent) {
      performanceOptimizer.setMapComponent(mapComponent);
    }

    // Initialize UI components
    console.log('🎛️ Initializing UI controls...');
    const mapContainer = document.getElementById(containerId);
    uiControls = new UIControls(mapComponent, mapContainer);

    // Initialize mobile controls
    console.log('📱 Initializing mobile controls...');
    mobileControls = new MobileTouchControls(mapComponent, mapContainer);

    // Initialize data visualization
    console.log('📊 Initializing data visualization...');
    dataVisualization = new DataVisualization(mapComponent);

    // Initialize accessibility features
    console.log('♿ Initializing accessibility features...');
    accessibilityHelper = new AccessibilityHelper(mapComponent);

    // Load saved accessibility settings
    accessibilityHelper.loadAccessibilitySettings();

  // Expose instances globally for backward compatibility
  // weatherRadarApp.getMap() returns an ol.Map instance, which does not have getMap().
  // Provide both window.map (ol.Map) and window.mapComponent with a .map property for compatibility with tests.
  window.map = mapComponent;
  window.mapComponent = { map: mapComponent, getMap: () => mapComponent };
    window.uiControls = uiControls;
    window.mobileControls = mobileControls;
    window.pwaHelper = pwaHelper;
    window.dataVisualization = dataVisualization;
    window.accessibilityHelper = accessibilityHelper;
    window.performanceOptimizer = performanceOptimizer;

    // Set up component interactions
    setupComponentInteractions();

    // Hide loading state
    if (typeof window.loading === 'function') {
      window.loading(false);
    }

    // Announce success
    if (accessibilityHelper) {
      accessibilityHelper.announce('Map application loaded successfully with enhanced features');
    }

    // Display performance info
    displayInitializationSummary();

    console.log('✅ Enhanced map application initialized successfully');
    return mapComponent;

  } catch (error) {
    console.error('❌ Failed to initialize enhanced map application:', error);

    // Show error state
    if (typeof window.errorAlert === 'function') {
      window.errorAlert(null, null, 'Failed to initialize map application');
    }

    // Hide loading state
    if (typeof window.loading === 'function') {
      window.loading(false);
    }

    // Announce error to screen readers
    if (accessibilityHelper) {
      accessibilityHelper.announce('Failed to load map application', 'assertive');
    }

    throw error;
  }
}

/**
 * Set up interactions between components
 */
function setupComponentInteractions() {
  // Map events for UI updates
  if (mapComponent && uiControls) {
    // Use ol.View for center/zoom; ol.Map doesn't expose getCenter/getZoom directly
    const view = mapComponent.getView && mapComponent.getView();

    mapComponent.on && mapComponent.on('moveend', () => {
      try {
        const v = mapComponent.getView && mapComponent.getView();
        const center3857 = v && v.getCenter ? v.getCenter() : null;
        const zoom = v && v.getZoom ? v.getZoom() : null;
        const centerLonLat = (center3857 && window.ol?.proj?.toLonLat)
          ? ol.proj.toLonLat(center3857)
          : [null, null];
        uiControls.updateCoordinates(centerLonLat[0], centerLonLat[1]);
        if (typeof zoom === 'number') uiControls.updateZoom(zoom);
      } catch (_) { /* noop */ }
    });

    // View-specific zoom change event (resolution change correlates with zoom changes)
    view && view.on && view.on('change:resolution', () => {
      try {
        const v = mapComponent.getView && mapComponent.getView();
        const zoom = v && v.getZoom ? v.getZoom() : null;
        if (typeof zoom === 'number') uiControls.updateZoom(zoom);
        if (accessibilityHelper && typeof zoom === 'number') {
          accessibilityHelper.announce(`Zoom level ${zoom}`);
        }
      } catch (_) { /* noop */ }
    });
  }

  // Performance monitoring integration
  if (performanceOptimizer && mapComponent) {
    mapComponent.on('layerload', () => {
      // Trigger tile preloading for adjacent areas
      performanceOptimizer.preloadAdjacentTiles();
    });
  }

  // Accessibility integration with UI controls
  if (accessibilityHelper && uiControls) {
    // Add keyboard shortcuts for UI controls
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key === 'l') {
        event.preventDefault();
        const firstLayerToggle = document.querySelector('.layer-toggle');
        if (firstLayerToggle) {
          firstLayerToggle.focus();
          accessibilityHelper.announce('Layer controls focused');
        }
      }
    });
  }

  // PWA integration with data visualization
  if (pwaHelper && dataVisualization) {
    // Register background sync for radar data updates
    pwaHelper.registerBackgroundSync('radar-data-sync');
  }
}

/**
 * Display initialization summary
 */
function displayInitializationSummary() {
  if (!performanceOptimizer) return;

  const report = performanceOptimizer.getPerformanceReport();

  console.group('📊 Application Performance Summary');
  console.log(`🖥️ WebGL Support: ${report.webGL.supported ? '✅' : '❌'}`);
  console.log(`⚡ WebGL Enabled: ${report.webGL.enabled ? '✅' : '❌'}`);
  console.log(`🌐 Connection: ${report.network.connectionType}`);
  console.log(`💾 Cache: ${report.cache.tiles} tiles, ${report.cache.resources} resources`);
  if (report.memory) {
    console.log(`🧠 Memory: ${report.memory.used}MB / ${report.memory.total}MB (${report.memory.usage}%)`);
  }
  console.groupEnd();
}

/**
 * Legacy function for backward compatibility
 */
function init_load() {
  return initializeApp();
}

/**
 * Get all component instances
 * @returns {Object} - All component instances
 */
function getAllComponents() {
  return {
    mapComponent,
    uiControls,
    mobileControls,
    pwaHelper,
    dataVisualization,
    accessibilityHelper,
    performanceOptimizer
  };
}

/**
 * Check if all components are initialized
 * @returns {boolean} - Whether all components are initialized
 */
function isFullyInitialized() {
  return mapComponent !== null &&
         uiControls !== null &&
         mobileControls !== null &&
         pwaHelper !== null &&
         dataVisualization !== null &&
         accessibilityHelper !== null &&
         performanceOptimizer !== null;
}

/**
 * Get performance report from optimizer
 * @returns {Object} - Performance report
 */
function getPerformanceReport() {
  return performanceOptimizer ? performanceOptimizer.getPerformanceReport() : null;
}

/**
 * Enable/disable feature flags
 * @param {string} feature - Feature name
 * @param {boolean} enabled - Whether to enable the feature
 */
function toggleFeature(feature, enabled) {
  switch (feature) {
    case 'webgl':
      if (performanceOptimizer) {
        if (enabled) {
          performanceOptimizer.enableWebGLAcceleration();
        } else {
          performanceOptimizer.disableWebGLAcceleration();
        }
      }
      break;
    case 'accessibility':
      if (accessibilityHelper) {
        // Toggle accessibility features
        accessibilityHelper.announce(`Accessibility features ${enabled ? 'enabled' : 'disabled'}`);
      }
      break;
    case 'mobile-controls':
      if (mobileControls) {
        // Toggle mobile-specific features
        console.log(`Mobile controls ${enabled ? 'enabled' : 'disabled'}`);
      }
      break;
    case 'data-visualization':
      if (dataVisualization) {
        // Toggle advanced data features
        console.log(`Data visualization ${enabled ? 'enabled' : 'disabled'}`);
      }
      break;
  }
}

/**
 * Cleanup all components
 */
function cleanup() {
  if (dataVisualization) {
    dataVisualization.destroy();
    dataVisualization = null;
  }

  if (accessibilityHelper) {
    accessibilityHelper.destroy();
    accessibilityHelper = null;
  }

  if (performanceOptimizer) {
    performanceOptimizer.destroy();
    performanceOptimizer = null;
  }

  if (uiControls) {
    uiControls.destroy();
    uiControls = null;
  }

  if (mobileControls) {
    mobileControls.destroy();
    mobileControls = null;
  }

  if (pwaHelper) {
    pwaHelper.destroy();
    pwaHelper = null;
  }

  if (mapComponent) {
    mapComponent.destroy();
    mapComponent = null;
  }

  // Clear global references
  window.map = undefined;
  window.mapComponent = undefined;
  window.uiControls = undefined;
  window.mobileControls = undefined;
  window.pwaHelper = undefined;
  window.dataVisualization = undefined;
  window.accessibilityHelper = undefined;
  window.performanceOptimizer = undefined;
}

/**
 * Get the current map component instance
 * @returns {MapComponent|null} - Current map component
 */
function getMapComponent() {
  return mapComponent;
}

/**
 * Check if the application is initialized
 * @returns {boolean} - Whether the app is initialized
 */
function isInitialized() {
  return mapComponent !== null && window.map !== undefined;
}

// Export functions for module usage
export {
  cleanup, getAllComponents,
  getMapComponent,
  getPerformanceReport,
  init_load,
  initializeApp,
  isFullyInitialized,
  isInitialized,
  toggleFeature
};

// Expose functions globally for HTML script tag usage
window.initializeApp = initializeApp;
window.init_load = init_load;
window.initLoad = init_load; // Alternative naming
window.getMapComponent = getMapComponent;
window.getAllComponents = getAllComponents;
window.isInitialized = isInitialized;
window.isFullyInitialized = isFullyInitialized;
window.getPerformanceReport = getPerformanceReport;
window.toggleFeature = toggleFeature;
window.cleanup = cleanup;

// Auto-initialize if DOM is ready and map container exists
// (Commented out to allow manual initialization with UI components)
// document.addEventListener('DOMContentLoaded', () => {
//   const mapContainer = document.getElementById('map');
//   if (mapContainer) {
//     initializeApp();
//   }
// });

/**
 * OpenLayers Event Hooks for Testing Infrastructure
 * Provides event synchronization and monitoring for test frameworks
 */
class OpenLayersEventHooks {
  constructor() {
    this.listeners = new Map();
    this.eventQueue = [];
    this.isMapReady = false;
    this.isTilesLoaded = false;
    this.diagnosticData = {
      mapEvents: [],
      tileEvents: [],
      viewEvents: [],
      performance: {}
    };
  }

  /**
   * Initialize event hooks for a map instance
   * @param {ol.Map} map - OpenLayers map instance
   */
  initialize(map) {
    if (!map) {
      console.warn('OpenLayersEventHooks: No map instance provided');
      return;
    }

    // Normalize possible wrappers and ensure we hold a real ol.Map with an .on method
    let resolvedMap = map;
    // If a wrapper with .map property
    if (resolvedMap && !resolvedMap.on && resolvedMap.map) {
      resolvedMap = resolvedMap.map;
    }
    // If global exposes exist, prefer those if they look healthier
    if ((!resolvedMap || !resolvedMap.on) && window.map && window.map.on) {
      resolvedMap = window.map;
    }
    if ((!resolvedMap || !resolvedMap.on) && window.mapComponent && window.mapComponent.map && window.mapComponent.map.on) {
      resolvedMap = window.mapComponent.map;
    }

    this.map = resolvedMap;

  if (!this.map || typeof this.map.on !== 'function') {
      console.warn('OpenLayersEventHooks: Provided map does not support event subscription; skipping hooks');
      return;
    }
  console.debug('OpenLayersEventHooks: attaching map-level listeners (rendercomplete/click/pointermove)');
    this.setupMapEventListeners();
    this.setupViewEventListeners();
    this.setupLayerEventListeners();
    this.setupPerformanceMonitoring();

    console.log('✅ OpenLayers Event Hooks initialized');
  }

  /**
   * Setup map-level event listeners
   */
  setupMapEventListeners() {
    // Map loading/render events
    // Some OL versions don't emit loadstart/loadend at map-level; rely on rendercomplete + tile events
    this.map.on && this.map.on('rendercomplete', (event) => {
      this.isMapReady = true;
      this.recordEvent('map', 'rendercomplete', event);
      this.notifyTestFrameworks('map:rendercomplete', event);
      this.checkAllTilesLoaded();
    });

    // Map interaction events
    this.map.on && this.map.on('click', (event) => {
      this.recordEvent('map', 'click', event);
      this.notifyTestFrameworks('map:click', event);
    });

    this.map.on && this.map.on('pointermove', (event) => {
      this.recordEvent('map', 'pointermove', event);
    });
  }

  /**
   * Setup view-level event listeners
   */
  setupViewEventListeners() {
    const view = this.map.getView();
    if (!view) return;

    // View change events
    view.on('change:center', (event) => {
      this.recordEvent('view', 'change:center', event);
      this.notifyTestFrameworks('view:center-changed', event);
    });

    view.on('change:zoom', (event) => {
      this.recordEvent('view', 'change:zoom', event);
      this.notifyTestFrameworks('view:zoom-changed', event);
    });

    view.on('change:rotation', (event) => {
      this.recordEvent('view', 'change:rotation', event);
      this.notifyTestFrameworks('view:rotation-changed', event);
    });
  }

  /**
   * Setup layer-level event listeners
   */
  setupLayerEventListeners() {
    this.map.getLayers().forEach((layer, index) => {
      this.setupSingleLayerListeners(layer, index);
    });

    // Listen for layer additions/removals
    this.map.getLayers().on('add', (event) => {
      const layer = event.element;
      this.setupSingleLayerListeners(layer, this.map.getLayers().getLength() - 1);
      this.recordEvent('layers', 'add', event);
    });

    this.map.getLayers().on('remove', (event) => {
      this.recordEvent('layers', 'remove', event);
    });
  }

  /**
   * Setup listeners for a single layer
   */
  setupSingleLayerListeners(layer, index) {
    if (!layer) return;

    const source = layer.getSource();
    if (!source) return;

    // Tile loading events
    if (source.on) {
      source.on('tileloadstart', (event) => {
        this.isTilesLoaded = false;
        this.recordEvent('tile', 'loadstart', { ...event, layerIndex: index });
      });

      source.on('tileloadend', (event) => {
        this.recordEvent('tile', 'loadend', { ...event, layerIndex: index });
        this.checkAllTilesLoaded();
      });

      source.on('tileloaderror', (event) => {
        this.recordEvent('tile', 'loaderror', { ...event, layerIndex: index });
        this.notifyTestFrameworks('tile:error', event);
      });

      // Image (single-tile) loading events (e.g., ImageWMS)
      // OpenLayers Image sources emit imageloadstart/imageloadend/imageloaderror
      source.on('imageloadstart', (event) => {
        this.isTilesLoaded = false;
        this.recordEvent('image', 'loadstart', { ...event, layerIndex: index });
      });

      source.on('imageloadend', (event) => {
        this.recordEvent('image', 'loadend', { ...event, layerIndex: index });
        this.checkAllTilesLoaded();
      });

      source.on('imageloaderror', (event) => {
        this.recordEvent('image', 'loaderror', { ...event, layerIndex: index });
        this.notifyTestFrameworks('image:error', event);
      });
    }
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Memory usage monitoring
    setInterval(() => {
      if (performance.memory) {
        this.diagnosticData.performance = {
          memoryUsed: performance.memory.usedJSHeapSize,
          memoryTotal: performance.memory.totalJSHeapSize,
          memoryLimit: performance.memory.jsHeapSizeLimit,
          timestamp: Date.now()
        };
      }
    }, 5000);

    // Frame rate monitoring
    let lastTime = Date.now();
    let frameCount = 0;

    const measureFPS = () => {
      frameCount++;
      const currentTime = Date.now();

      if (currentTime - lastTime >= 1000) {
        this.diagnosticData.performance.fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Check if all tiles are loaded
   */
  checkAllTilesLoaded() {
    // Simple heuristic: wait a bit after last tile event
    clearTimeout(this.tileCheckTimeout);
    this.tileCheckTimeout = setTimeout(() => {
      this.isTilesLoaded = true;
      this.notifyTestFrameworks('tiles:all-loaded', {
        mapReady: this.isMapReady,
        tilesLoaded: this.isTilesLoaded
      });
    }, 500);
  }

  /**
   * Record an event for diagnostic purposes
   */
  recordEvent(category, type, data) {
    const event = {
      category,
      type,
      timestamp: Date.now(),
      data: this.sanitizeEventData(data)
    };

    if (category === 'map') {
      this.diagnosticData.mapEvents.push(event);
    } else if (category === 'tile') {
      this.diagnosticData.tileEvents.push(event);
    } else if (category === 'view') {
      this.diagnosticData.viewEvents.push(event);
    }

    // Keep only last 100 events per category
    Object.keys(this.diagnosticData).forEach(key => {
      if (Array.isArray(this.diagnosticData[key]) && this.diagnosticData[key].length > 100) {
        this.diagnosticData[key] = this.diagnosticData[key].slice(-100);
      }
    });
  }

  /**
   * Sanitize event data for storage
   */
  sanitizeEventData(data) {
    if (!data) return null;

    // Remove circular references and large objects
    const sanitized = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value) && value.length < 10) {
        sanitized[key] = value;
      } else if (key === 'coordinate' && Array.isArray(value)) {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  /**
   * Notify test frameworks of events
   */
  notifyTestFrameworks(eventType, data) {
    // For Cypress
    if (window.Cypress) {
      window.dispatchEvent(new CustomEvent(`ol:${eventType}`, { detail: data }));
    }

    // For Selenium (global state)
    if (!window.olTestEvents) {
      window.olTestEvents = [];
    }
    window.olTestEvents.push({ type: eventType, data, timestamp: Date.now() });

    // Keep only last 50 events for Selenium
    if (window.olTestEvents.length > 50) {
      window.olTestEvents = window.olTestEvents.slice(-50);
    }
  }

  /**
   * Wait for map to be ready
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>}
   */
  waitForMapReady(timeout = 10000) {
    return new Promise((resolve) => {
      if (this.isMapReady) {
        resolve(true);
        return;
      }

      const checkReady = () => {
        if (this.isMapReady) {
          resolve(true);
        } else {
          setTimeout(checkReady, 100);
        }
      };

      setTimeout(() => resolve(false), timeout);
      checkReady();
    });
  }

  /**
   * Wait for all tiles to load
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>}
   */
  waitForTilesLoaded(timeout = 15000) {
    return new Promise((resolve) => {
      if (this.isTilesLoaded) {
        resolve(true);
        return;
      }

      const checkLoaded = () => {
        if (this.isTilesLoaded) {
          resolve(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };

      setTimeout(() => resolve(false), timeout);
      checkLoaded();
    });
  }

  /**
   * Get diagnostic data
   */
  getDiagnosticData() {
    return {
      ...this.diagnosticData,
      status: {
        mapReady: this.isMapReady,
        tilesLoaded: this.isTilesLoaded,
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Diagnostic Overlay for Visual Debugging
 */
class DiagnosticOverlay {
  constructor(mapContainer) {
    this.mapContainer = mapContainer;
    this.overlay = null;
    this.isVisible = false;
    this.eventHooks = null;
    this.updateInterval = null;
  }

  /**
   * Initialize the diagnostic overlay
   */
  initialize(eventHooks) {
    this.eventHooks = eventHooks;
    this.createOverlay();
    this.attachKeyboardShortcuts();
    console.log('✅ Diagnostic Overlay initialized (Press Ctrl+D to toggle)');
  }

  /**
   * Create the overlay DOM elements
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'ol-diagnostic-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      max-height: 400px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      overflow-y: auto;
      display: none;
      border: 1px solid #333;
    `;

    document.body.appendChild(this.overlay);
  }

  /**
   * Attach keyboard shortcuts
   */
  attachKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl+D to toggle overlay
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        this.toggle();
      }

      // Ctrl+Shift+D to clear diagnostic data
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        this.clearData();
      }
    });
  }

  /**
   * Toggle overlay visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
    this.overlay.style.display = this.isVisible ? 'block' : 'none';

    if (this.isVisible) {
      this.startUpdating();
    } else {
      this.stopUpdating();
    }
  }

  /**
   * Start updating the overlay
   */
  startUpdating() {
    this.updateInterval = setInterval(() => {
      this.updateContent();
    }, 1000);
    this.updateContent();
  }

  /**
   * Stop updating the overlay
   */
  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update overlay content
   */
  updateContent() {
    if (!this.eventHooks) {
      this.overlay.innerHTML = '<div style="color: #ff0000;">Event hooks not initialized</div>';
      return;
    }

    const data = this.eventHooks.getDiagnosticData();
    const html = this.formatDiagnosticData(data);
    this.overlay.innerHTML = html;
  }

  /**
   * Format diagnostic data as HTML
   */
  formatDiagnosticData(data) {
    const performance = data.performance || {};
    const status = data.status || {};

    const memoryMB = performance.memoryUsed ?
      Math.round(performance.memoryUsed / 1024 / 1024) : 'N/A';
    const memoryTotalMB = performance.memoryTotal ?
      Math.round(performance.memoryTotal / 1024 / 1024) : 'N/A';

    return `
      <div style="border-bottom: 1px solid #333; margin-bottom: 10px; padding-bottom: 5px;">
        <strong>🔍 OpenLayers Diagnostics</strong>
      </div>

      <div style="margin-bottom: 10px;">
        <strong>Status:</strong><br>
        Map Ready: <span style="color: ${status.mapReady ? '#00ff00' : '#ff0000'}">${status.mapReady ? 'YES' : 'NO'}</span><br>
        Tiles Loaded: <span style="color: ${status.tilesLoaded ? '#00ff00' : '#ff0000'}">${status.tilesLoaded ? 'YES' : 'NO'}</span><br>
      </div>

      <div style="margin-bottom: 10px;">
        <strong>Performance:</strong><br>
        Memory: ${memoryMB}MB / ${memoryTotalMB}MB<br>
        FPS: ${performance.fps || 'N/A'}<br>
      </div>

      <div style="margin-bottom: 10px;">
        <strong>Event Counts:</strong><br>
        Map Events: ${data.mapEvents ? data.mapEvents.length : 0}<br>
        Tile Events: ${data.tileEvents ? data.tileEvents.length : 0}<br>
        View Events: ${data.viewEvents ? data.viewEvents.length : 0}<br>
      </div>

      <div style="margin-bottom: 10px;">
        <strong>Recent Events:</strong><br>
        ${this.formatRecentEvents(data)}
      </div>

      <div style="font-size: 10px; color: #666; border-top: 1px solid #333; margin-top: 10px; padding-top: 5px;">
        Ctrl+D: Toggle | Ctrl+Shift+D: Clear Data
      </div>
    `;
  }

  /**
   * Format recent events for display
   */
  formatRecentEvents(data) {
    const allEvents = [
      ...(data.mapEvents || []).slice(-3),
      ...(data.tileEvents || []).slice(-3),
      ...(data.viewEvents || []).slice(-3)
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

    if (allEvents.length === 0) {
      return '<em>No recent events</em>';
    }

    return allEvents.map(event => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      return `<div style="font-size: 10px; color: #ccc;">${time} - ${event.category}:${event.type}</div>`;
    }).join('');
  }

  /**
   * Clear diagnostic data
   */
  clearData() {
    if (this.eventHooks) {
      this.eventHooks.diagnosticData = {
        mapEvents: [],
        tileEvents: [],
        viewEvents: [],
        performance: {}
      };
      this.updateContent();
    }
  }

  /**
   * Destroy the overlay
   */
  destroy() {
    this.stopUpdating();
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

// Initialize testing infrastructure when map is available
let testingInfrastructure = null;

/**
 * Initialize testing infrastructure
 * @param {ol.Map} map - OpenLayers map instance
 */
function initializeTestingInfrastructure(map) {
  if (!map) {
    console.warn('Cannot initialize testing infrastructure: No map instance');
    return;
  }

  // Initialize event hooks
  const eventHooks = new OpenLayersEventHooks();
  eventHooks.initialize(map);

  // Initialize diagnostic overlay
  const mapContainer = map.getTarget();
  const diagnosticOverlay = new DiagnosticOverlay(mapContainer);
  diagnosticOverlay.initialize(eventHooks);

  // Expose to global scope for test frameworks
  window.olEventHooks = eventHooks;
  window.olDiagnosticOverlay = diagnosticOverlay;

  testingInfrastructure = {
    eventHooks,
    diagnosticOverlay
  };

  console.log('🧪 Testing infrastructure initialized');
  return testingInfrastructure;
}

// Auto-initialize testing infrastructure when map becomes available
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const checkForMap = () => {
      if (window.map || (window.mapComponent && window.mapComponent.map)) {
        const map = window.map || window.mapComponent.map;
        initializeTestingInfrastructure(map);
      } else {
        setTimeout(checkForMap, 1000);
      }
    };
    setTimeout(checkForMap, 2000);
  });
}

// Export for testing frameworks
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OpenLayersEventHooks,
    DiagnosticOverlay,
    initializeTestingInfrastructure
  };
}
