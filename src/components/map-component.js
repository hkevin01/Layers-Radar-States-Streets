/**
 * Map component - handles map initialization and management
 */

import { MAP_CONFIG } from '../config/map-config.js';
import {
    createHazardLayer,
    createOSMLayer,
    createRadarLayer,
    createStreetsLayer
} from '../layers/layer-factory.js';
import {
    enforceMinZoom,
    handleAjaxError,
    processMessage,
    toggleLoading,
    transformCoordinates
} from '../utils/map-utils.js';

/**
 * Map component class
 */
export class MapComponent {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.layers = {};
  }

  /**
   * Initialize the map
   */
  initialize() {
    // Create map instance
    this.map = new OpenLayers.Map(this.containerId, {
      units: 'm',
      projection: new OpenLayers.Projection(MAP_CONFIG.projection.map),
      displayProjection: new OpenLayers.Projection(MAP_CONFIG.projection.display)
    });

    // Create and add layers
    this.setupLayers();
    
    // Add controls
    this.addControls();
    
    // Set initial view
    this.setInitialView();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Load initial data
    this.loadInitialData();
  }

  /**
   * Set up all map layers
   */
  setupLayers() {
    this.layers.streets = createStreetsLayer();
    this.layers.osm = createOSMLayer();
    this.layers.radar = createRadarLayer();
    this.layers.hazard = createHazardLayer();
    
    // Optionally add states layer
    // this.layers.states = createStatesLayer();

    // Add layers to map
    this.map.addLayer(this.layers.streets);
    this.map.addLayer(this.layers.osm);
    // this.map.addLayer(this.layers.states);
    this.map.addLayer(this.layers.radar);
    this.map.addLayer(this.layers.hazard);
  }

  /**
   * Add map controls
   */
  addControls() {
    this.map.addControl(new OpenLayers.Control.LayerSwitcher());
  }

  /**
   * Set initial map view
   */
  setInitialView() {
    const center = transformCoordinates(
      MAP_CONFIG.center.longitude,
      MAP_CONFIG.center.latitude,
      MAP_CONFIG.projection.display,
      MAP_CONFIG.projection.map
    );
    
    this.map.setCenter(center, MAP_CONFIG.center.zoom);
  }

  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    // Enforce minimum zoom level
    this.map.events.register('zoomend', this, () => {
      enforceMinZoom(this.map, MAP_CONFIG.minZoom);
    });
  }

  /**
   * Load initial observation data
   */
  loadInitialData() {
    const ajaxConfig = MAP_CONFIG.ajax;
    const baseUrl = typeof window.urlPath !== 'undefined' ? window.urlPath : '';
    
    $.ajax({
      url: baseUrl + ajaxConfig.dataUrl,
      dataType: ajaxConfig.dataType,
      async: ajaxConfig.async,
      data: { last: true },
      success: (data) => {
        toggleLoading(true);
        if (data && data.obs && data.obs[0]) {
          processMessage(data.obs[0].file, true);
        }
      },
      error: handleAjaxError
    });
  }

  /**
   * Get the map instance
   * @returns {OpenLayers.Map} Map instance
   */
  getMap() {
    return this.map;
  }

  /**
   * Get a specific layer
   * @param {string} layerName - Name of the layer
   * @returns {OpenLayers.Layer} Layer instance
   */
  getLayer(layerName) {
    return this.layers[layerName];
  }
}
