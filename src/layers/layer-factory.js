/**
 * Layer factory for creating different types of map layers
 */

import { MAP_CONFIG } from '../config/map-config.js';
import { generateGenericTileUrl, generateRadarTileUrl } from '../utils/map-utils.js';

/**
 * Create NEXRAD radar layer
 * @returns {OpenLayers.Layer.TMS} Radar layer
 */
export function createRadarLayer() {
  const config = MAP_CONFIG.layers.radar;
  
  return new OpenLayers.Layer.TMS(
    config.name,
    config.url,
    {
      layername: config.layername,
      service: config.service,
      type: config.type,
      visibility: config.visibility,
      getURL: generateRadarTileUrl,
      isBaseLayer: config.isBaseLayer
    }
  );
}

/**
 * Create state boundaries layer
 * @returns {OpenLayers.Layer.TMS} State boundaries layer
 */
export function createStatesLayer() {
  const config = MAP_CONFIG.layers.states;
  
  return new OpenLayers.Layer.TMS(
    config.name,
    config.url,
    {
      type: config.type,
      getURL: generateGenericTileUrl,
      displayOutsideMaxExtent: config.displayOutsideMaxExtent,
      isBaseLayer: config.isBaseLayer,
      numZoomLevels: config.numZoomLevels
    }
  );
}

/**
 * Create streets/roads layer
 * @returns {OpenLayers.Layer.TMS} Streets layer
 */
export function createStreetsLayer() {
  const config = MAP_CONFIG.layers.streets;
  
  return new OpenLayers.Layer.TMS(
    config.name,
    config.url,
    {
      numZoomLevels: config.numZoomLevels,
      type: config.type,
      getURL: generateGenericTileUrl,
      displayOutsideMaxExtent: config.displayOutsideMaxExtent,
      visibility: config.visibility,
      isBaseLayer: config.isBaseLayer
    }
  );
}

/**
 * Create OpenStreetMap base layer
 * @returns {OpenLayers.Layer.OSM} OSM layer
 */
export function createOSMLayer() {
  return new OpenLayers.Layer.OSM();
}

/**
 * Create hazard markers layer
 * @returns {OpenLayers.Layer.Markers} Hazard layer
 */
export function createHazardLayer() {
  const config = MAP_CONFIG.layers.hazard;
  
  return new OpenLayers.Layer.Markers(config.name, {
    transparent: config.transparent,
    opacity: config.opacity
  });
}
