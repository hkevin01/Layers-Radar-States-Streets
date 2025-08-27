/**
 * Map component - modern OpenLayers v8 implementation
 */

export class MapComponent {
  constructor(containerId = 'map', options = {}) {
    this.containerId = containerId;
    this.map = null;
    this.layers = {};
    this.options = Object.assign({
      center: [-98.5795, 39.8283],
      zoom: 4,
      minZoom: 2,
      maxZoom: 18
    }, options);
  }

  initialize() {
    // Create base layers
    const osm = new ol.layer.Tile({
      title: 'OpenStreetMap',
      type: 'base',
      visible: true,
      source: new ol.source.OSM({ crossOrigin: 'anonymous' })
    });

    // Placeholder for additional layers; radar/alerts managed by WeatherRadarCore
    this.layers.osm = osm;

    // Create map
    this.map = new ol.Map({
      target: this.containerId,
      view: new ol.View({
        center: ol.proj.fromLonLat(this.options.center),
        zoom: this.options.zoom,
        minZoom: this.options.minZoom,
        maxZoom: this.options.maxZoom
      }),
      layers: [osm],
      controls: ol.control.defaults().extend([
        new ol.control.ScaleLine({ units: 'imperial' })
      ])
    });

    // Enforce min zoom on change
    const view = this.map.getView();
    view.on('change:resolution', () => {
      const z = view.getZoom();
      if (z < this.options.minZoom) view.setZoom(this.options.minZoom);
    });

    // Replace OpenLayers default layers container with overlay container
    setTimeout(() => {
      const mapElement = document.getElementById(this.containerId);
      if (mapElement) {
        const layersDiv = mapElement.querySelector('.ol-unselectable.ol-layers');
        if (layersDiv) {
          // Create new overlay container div
          const overlayContainer = document.createElement('div');
          overlayContainer.className = 'ol-overlaycontainer';
          overlayContainer.style.position = 'absolute';
          overlayContainer.style.zIndex = '0';
          overlayContainer.style.width = '100%';
          overlayContainer.style.height = '100%';
          overlayContainer.style.pointerEvents = 'none';

          // Replace the layers container
          layersDiv.parentNode.replaceChild(overlayContainer, layersDiv);
          console.log('OpenLayers layers container replaced with overlay container');
        }
      }
    }, 100); // Small delay to ensure DOM is ready

    return this.map;
  }

  getMap() { return this.map; }
  getLayer(name) { return this.layers[name]; }
}
