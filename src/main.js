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
      maxMemoryUsage: 0.75, // 75% of available memory
      preloadAdjacentTiles: true,
      enableWebGLAcceleration: true
    });

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
    performanceOptimizer.mapComponent = mapComponent;

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
    window.map = mapComponent.getMap();
    window.mapComponent = mapComponent;
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
    mapComponent.on('moveend', () => {
      const center = mapComponent.getCenter();
      const zoom = mapComponent.getZoom();
      uiControls.updateCoordinates(center.lon, center.lat);
      uiControls.updateZoom(zoom);
    });

    mapComponent.on('zoomend', () => {
      const zoom = mapComponent.getZoom();
      uiControls.updateZoom(zoom);
      if (accessibilityHelper) {
        accessibilityHelper.announce(`Zoom level ${zoom}`);
      }
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
