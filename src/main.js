/**
 * Main entry point for the Layers Radar States Streets application
 * Modernized and refactored from legacy script.js
 */

import { MapComponent } from './components/map-component.js';

// Global map instance for backward compatibility
let mapComponent = null;

/**
 * Initialize the application
 * @param {string} containerId - Map container element ID
 */
function initializeApp(containerId = 'map') {
  try {
    mapComponent = new MapComponent(containerId);
    mapComponent.initialize();
    
    // Expose map globally for backward compatibility
    window.map = mapComponent.getMap();
    window.mapComponent = mapComponent;
    
    console.log('Map application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize map application:', error);
  }
}

/**
 * Legacy function for backward compatibility
 */
function init_load() {
  initializeApp();
}

// Export functions for module usage
export { init_load, initializeApp };

// Expose functions globally for HTML script tag usage
window.initializeApp = initializeApp;
window.init_load = init_load;
window.initLoad = init_load; // Alternative naming

// Auto-initialize if DOM is ready and map container exists
document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    initializeApp();
  }
});