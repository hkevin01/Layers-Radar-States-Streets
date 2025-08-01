/**
 * Map layer configuration and URLs
 */
export const MAP_CONFIG = {
  // Base map settings
  projection: {
    map: 'EPSG:900913',
    display: 'EPSG:4326'
  },
  
  // Default map center and zoom
  center: {
    longitude: -97,
    latitude: 38,
    zoom: 4
  },
  
  // Minimum zoom level
  minZoom: 4,
  
  // Layer URLs and configurations
  layers: {
    radar: {
      name: 'NEXRAD Radar',
      url: 'http://mesonet.agron.iastate.edu/cache/tile.py/',
      layername: 'nexrad-n0q-900913',
      service: '1.0.0',
      type: 'png',
      visibility: false,
      isBaseLayer: false
    },
    
    states: {
      name: 'State Boundaries',
      url: 'http://korona.geog.uni-heidelberg.de/tiles/adminb/',
      type: 'png',
      displayOutsideMaxExtent: true,
      isBaseLayer: false,
      numZoomLevels: 19
    },
    
    streets: {
      name: 'Roads',
      url: 'http://korona.geog.uni-heidelberg.de/tiles/roads/',
      numZoomLevels: 20,
      type: 'png',
      displayOutsideMaxExtent: true,
      visibility: false,
      isBaseLayer: true
    },
    
    hazard: {
      name: 'MoPED - Hazard',
      transparent: 'true',
      opacity: 0.9
    }
  },
  
  // AJAX configuration
  ajax: {
    dataUrl: 'obsGetter.php',
    dataType: 'json',
    async: false
  }
};
