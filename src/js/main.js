// Modernized main entry point for the project
// Assumes OpenLayers and jQuery are loaded globally

/**
 * Custom TMS URL builder for radar tiles
 * @param {Object} bounds - Tile bounds
 * @returns {string} - Tile URL
 */
function getRadarTileUrl(bounds) {
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
 * Custom TMS URL builder for state and street tiles
 * @param {Object} bounds - Tile bounds
 * @returns {string} - Tile URL
 */
function getTileURL(bounds) {
  // Placeholder for custom logic if needed
  // For now, use default OpenLayers behavior
  return OpenLayers.Layer.TMS.prototype.getURL.call(this, bounds);
}

// Layer options
const radarLayerOptions = {
  layername: 'nexrad-n0q-900913',
  service: '1.0.0',
  type: 'png',
  visibility: false,
  getURL: getRadarTileUrl,
  isBaseLayer: false,
};

const stateLayerOptions = {
  type: 'png',
  getURL: getTileURL,
  displayOutsideMaxExtent: true,
  isBaseLayer: false,
  numZoomLevels: 19,
};

const streetLayerOptions = {
  numZoomLevels: 20,
  type: 'png',
  getURL: getTileURL,
  displayOutsideMaxExtent: true,
  visibility: false,
  isBaseLayer: true,
};

/**
 * Initialize and load the map
 */
function initLoad() {
  // Create map instance
  const map = new OpenLayers.Map('map', {
    units: 'm',
    projection: new OpenLayers.Projection('EPSG:900913'),
    displayProjection: new OpenLayers.Projection('EPSG:4326'),
  });

  // Hazard layer
  const hazardLayer = new OpenLayers.Layer.Markers('MoPED - Hazard', {
    transparent: 'true',
    opacity: 0.9,
  });

  // Layers
  const street = new OpenLayers.Layer.TMS(
    'Roads',
    'http://korona.geog.uni-heidelberg.de/tiles/roads/',
    streetLayerOptions
  );
  const osm = new OpenLayers.Layer.OSM();
  const iaWms = new OpenLayers.Layer.TMS(
    'NEXRAD Radar',
    'http://mesonet.agron.iastate.edu/cache/tile.py/',
    radarLayerOptions
  );
  // Uncomment to add state boundaries
  // const states = new OpenLayers.Layer.TMS(
  //   'State Boundaries',
  //   'http://korona.geog.uni-heidelberg.de/tiles/adminb/',
  //   stateLayerOptions
  // );

  // Add layers to map
  map.addLayer(street);
  map.addLayer(osm);
  // map.addLayer(states);
  map.addLayer(iaWms);
  map.addLayer(hazardLayer);

  // Add controls
  map.addControl(new OpenLayers.Control.LayerSwitcher());

  // Center map
  map.setCenter(
    new OpenLayers.LonLat(-97, 38).transform(
      new OpenLayers.Projection('EPSG:4326'),
      new OpenLayers.Projection('EPSG:900913')
    ),
    4 // Zoom level
  );

  // Prevent zooming out too far
  map.events.register('zoomend', this, function () {
    const x = map.getZoom();
    if (x < 4) {
      map.zoomTo(4);
    }
  });

  // AJAX: Load latest observation
  $.ajax({
    url: typeof urlPath !== 'undefined' ? urlPath + 'obsGetter.php' : 'obsGetter.php',
    dataType: 'json',
    async: false,
    data: { last: true },
    success: function (data) {
      if (typeof loading === 'function') loading(true);
      if (typeof waitForMSG === 'function') waitForMSG(data.obs[0].file, true);
    },
    error: function (jqXHR, exception, errorThrown) {
      if (typeof errorAlert === 'function') errorAlert(jqXHR, exception, errorThrown);
    },
  });
}

// Export for usage in HTML
window.initLoad = initLoad;
