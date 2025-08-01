/**
 * Utility functions for tile URL generation and map operations
 */

/**
 * Custom TMS URL builder for radar tiles
 * @param {Object} bounds - Tile bounds
 * @returns {string} - Tile URL
 */
export function generateRadarTileUrl(bounds) {
  const res = this.map.getResolution();
  const x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
  const y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
  const z = this.map.getZoom();
  const path = `${z}/${x}/${y}.${this.type}?${Math.floor(Math.random() * 9999)}`;
  
  let url = this.url;
  if (Array.isArray(url)) {
    url = this.selectUrl(path, url);
  }
  
  return `${url}${this.service}/${this.layername}/${path}`;
}

/**
 * Generic tile URL builder for state and street tiles
 * @param {Object} bounds - Tile bounds
 * @returns {string} - Tile URL
 */
export function generateGenericTileUrl(bounds) {
  // Use default OpenLayers behavior for now
  return OpenLayers.Layer.TMS.prototype.getURL.call(this, bounds);
}

/**
 * Transform coordinates between projections
 * @param {number} lon - Longitude
 * @param {number} lat - Latitude
 * @param {string} fromProj - Source projection
 * @param {string} toProj - Target projection
 * @returns {OpenLayers.LonLat} - Transformed coordinates
 */
export function transformCoordinates(lon, lat, fromProj, toProj) {
  return new OpenLayers.LonLat(lon, lat).transform(
    new OpenLayers.Projection(fromProj),
    new OpenLayers.Projection(toProj)
  );
}

/**
 * Validate zoom level and enforce minimum
 * @param {OpenLayers.Map} map - Map instance
 * @param {number} minZoom - Minimum allowed zoom level
 */
export function enforceMinZoom(map, minZoom) {
  const currentZoom = map.getZoom();
  if (currentZoom < minZoom) {
    map.zoomTo(minZoom);
  }
}

/**
 * Handle AJAX errors consistently
 * @param {Object} jqXHR - jQuery XHR object
 * @param {string} exception - Exception string
 * @param {string} errorThrown - Error thrown
 */
export function handleAjaxError(jqXHR, exception, errorThrown) {
  console.error('AJAX Error:', {
    status: jqXHR.status,
    statusText: jqXHR.statusText,
    exception: exception,
    errorThrown: errorThrown
  });
  
  // Call global error handler if it exists
  if (typeof window.errorAlert === 'function') {
    window.errorAlert(jqXHR, exception, errorThrown);
  }
}

/**
 * Show loading indicator
 * @param {boolean} show - Whether to show or hide loading
 */
export function toggleLoading(show) {
  if (typeof window.loading === 'function') {
    window.loading(show);
  } else {
    console.log(show ? 'Loading...' : 'Loading complete');
  }
}

/**
 * Wait for message processing
 * @param {string} file - File to process
 * @param {boolean} flag - Processing flag
 */
export function processMessage(file, flag) {
  if (typeof window.waitForMSG === 'function') {
    window.waitForMSG(file, flag);
  } else {
    console.log('Processing message:', file, flag);
  }
}
