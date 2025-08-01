/**
 * Main entry point for the Layers Radar States Streets application
 * Modernized and refactored from legacy script.js
 */

import { MapComponent } from './components/map-component.js';

// Global map instance for backward compatibility
let mapComponent = null;

/**
 * Initialize the application with enhanced features
 * @param {string} containerId - Map container element ID
 * @returns {Promise<MapComponent>} - Map component instance
 */
async function initializeApp(containerId = 'map') {
  try {
    // Show loading state
    if (typeof window.loading === 'function') {
      window.loading(true);
    }
    
    // Initialize map component
    mapComponent = new MapComponent(containerId);
    await mapComponent.initialize();
    
    // Expose map globally for backward compatibility
    window.map = mapComponent.getMap();
    window.mapComponent = mapComponent;
    
    // Hide loading state
    if (typeof window.loading === 'function') {
      window.loading(false);
    }
    
    console.log('✅ Map application initialized successfully');
    return mapComponent;
    
  } catch (error) {
    console.error('❌ Failed to initialize map application:', error);
    
    // Show error state
    if (typeof window.errorAlert === 'function') {
      window.errorAlert(null, null, 'Failed to initialize map application');
    }
    
    // Hide loading state
    if (typeof window.loading === 'function') {
      window.loading(false);
    }
    
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 */
function init_load() {
  return initializeApp();
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
    getMapComponent, init_load, initializeApp, isInitialized
};

// Expose functions globally for HTML script tag usage
window.initializeApp = initializeApp;
window.init_load = init_load;
window.initLoad = init_load; // Alternative naming
window.getMapComponent = getMapComponent;
window.isInitialized = isInitialized;

// Auto-initialize if DOM is ready and map container exists
// (Commented out to allow manual initialization with UI components)
// document.addEventListener('DOMContentLoaded', () => {
//   const mapContainer = document.getElementById('map');
//   if (mapContainer) {
//     initializeApp();
//   }
// });