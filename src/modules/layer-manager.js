/**
 * Layer Manager Module
 * Manages all map layers including base maps, radar, and overlays
 * @author NEXRAD Radar Team
 * @version 2.0.0
 */

/**
 * Layer Manager Class
 * Handles all layer operations and management
 */
/**
 * Layer Manager Class
 * Handles all layer operations and management
 */
export class LayerManager extends EventTarget {
    constructor(map, config = {}) {
        super();
        this.map = map;
        this.config = config;
        this.debug = config.debug || false;
        this.layers = new Map();

        // Initialize base layers
        this.initializeBaseLayers();

        // Initialize radar layer
        this.initializeRadarLayer();
    }

    initializeBaseLayers() {
        // Add street map layer (OSM)
        const streetLayer = new ol.layer.Tile({
            source: new ol.source.OSM(),
            visible: true,
            zIndex: 0
        });
        this.layers.set('street', streetLayer);
        this.map.addLayer(streetLayer);

        // Add satellite layer (ESRI World Imagery)
        const satelliteLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attributions: 'Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics'
            }),
            visible: false,
            zIndex: 0
        });
        this.layers.set('satellite', satelliteLayer);
        this.map.addLayer(satelliteLayer);
    }

    async initializeRadarLayer() {
        try {
            if (this.debug) {
                console.log('Initializing NEXRAD radar layer...');
            }

            // Primary source - Iowa Environmental Mesonet
            const primarySource = new ol.source.XYZ({
                url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
                attributions: '© Iowa Environmental Mesonet',
                crossOrigin: 'anonymous',
                tileLoadFunction: (tile, src) => this.handleTileLoad(tile, src)
            });

            // Fallback source - NOAA nowCOAST
            const fallbackSource = new ol.source.TileWMS({
                url: 'https://nowcoast.noaa.gov/arcgis/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/WMSServer',
                params: {
                    'LAYERS': '1',
                    'FORMAT': 'image/png',
                    'TRANSPARENT': true
                },
                crossOrigin: 'anonymous',
                tileLoadFunction: (tile, src) => this.handleTileLoad(tile, src)
            });

            // Create radar layer with primary source
            const radarLayer = new ol.layer.Tile({
                source: primarySource,
                visible: true,
                opacity: 0.7,
                zIndex: 1,
                className: 'nexrad-radar-layer'
            });

            // Add to layer management
            this.layers.set('radar', radarLayer);
            this.layers.set('radar-primary-source', primarySource);
            this.layers.set('radar-fallback-source', fallbackSource);

            // Add to map
            this.map.addLayer(radarLayer);

            // Set up error handling and source switching
            primarySource.on('tileloaderror', (event) => {
                this.handleTileError(event, radarLayer, fallbackSource);
            });

            if (this.debug) {
                console.log('✅ Successfully initialized NEXRAD radar layer');
            }

            return radarLayer;

        } catch (error) {
            console.error('❌ Failed to initialize radar layer:', error);
            if (this.debug) {
                console.error('Error details:', error.stack);
            }
            throw error;
        }
    }

    handleTileLoad(tile, src) {
        const image = tile.getImage();

        if (this.debug) {
            console.log(`Loading tile: ${src}`);
        }

        // Set up tile image
        if (typeof image.addEventListener === 'function') {
            image.addEventListener('error', () => {
                if (this.debug) {
                    console.warn(`Tile load failed: ${src}`);
                }
                tile.setState(ol.TileState.ERROR);
            });
        }

        image.crossOrigin = 'anonymous';
        image.src = src;
    }

    handleTileError(event, radarLayer, fallbackSource) {
        if (this.debug) {
            console.warn('Primary radar source failed, switching to fallback...');
        }

        // Switch to fallback source
        radarLayer.setSource(fallbackSource);

        // Monitor fallback source
        fallbackSource.on('tileloaderror', () => {
            if (this.debug) {
                console.error('Both radar sources failed');
            }
            this.dispatchEvent(new CustomEvent('radar-load-error'));
        });
    }

    setBaseLayer(type) {
        // Hide all base layers first
        this.layers.get('street').setVisible(false);
        this.layers.get('satellite').setVisible(false);

        // Show the requested layer
        const layer = this.layers.get(type);
        if (layer) {
            layer.setVisible(true);
            if (this.debug) {
                console.log(`Switched to ${type} base layer`);
            }
        }
    }
}
            baseLayers: {
                street: {
                    name: 'Street Map',
                    type: 'tile',
                    source: new OSM(),
                    visible: true,
                    opacity: 1.0
                },
                satellite: {
                    name: 'Satellite',
                    type: 'tile',
                    source: new XYZ({
                        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                        attributions: 'Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
                    }),
                    visible: false,
                    opacity: 1.0
                },
                dark: {
                    name: 'Dark Mode',
                    type: 'tile',
                    source: new XYZ({
                        url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                        attributions: '© CARTO'
                    }),
                    visible: false,
                    opacity: 1.0
                }
            },
            overlayLayers: {
                nexrad: {
                    name: 'NEXRAD Radar',
                    type: 'tile',
                    source: new XYZ({
                        url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q/{z}/{x}/{y}.png',
                        attributions: '© Iowa Environmental Mesonet'
                    }),
                    visible: true,
                    opacity: 0.7
                }
            }
                        url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
                        attributions: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                    }),
                    visible: false,
                    opacity: 1.0
                }
            },
            radarLayers: {
                base_reflectivity: {
                    name: 'Base Reflectivity',
                    type: 'xyz',
                    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q/{z}/{x}/{y}.png',
                    visible: true,
                    opacity: 0.7,
                    attribution: '© Iowa Environmental Mesonet',
                    crossOrigin: 'anonymous'
                },
                base_reflectivity_wms: {
                    name: 'Base Reflectivity (WMS)',
                    type: 'wms',
                    url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi',
                    layers: 'nexrad-n0q',
                    visible: false,
                    opacity: 0.7,
                    format: 'image/png',
                    transparent: true,
                    attribution: '© Iowa Environmental Mesonet',
                    crossOrigin: 'anonymous'
                },
                noaa_nexrad: {
                    name: 'NOAA NEXRAD',
                    type: 'wms',
                    url: 'https://nowcoast.noaa.gov/arcgis/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/WMSServer',
                    layers: '1',
                    visible: false,
                    opacity: 0.7,
                    format: 'image/png',
                    transparent: true,
                    attribution: '© NOAA/NWS',
                    crossOrigin: 'anonymous'
                }
            },
            overlayLayers: {
                counties: {
                    name: 'County Boundaries',
                    type: 'vector',
                    url: 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/us_counties.geojson',
                    visible: false,
                    opacity: 0.8,
                    style: this.getCountyStyle()
                },
                states: {
                    name: 'State Boundaries',
                    type: 'vector',
                    url: 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/us_states.geojson',
                    visible: true,
                    opacity: 0.9,
                    style: this.getStateStyle()
                },
                cities: {
                    name: 'Major Cities',
                    type: 'vector',
                    url: '/data/us_cities.geojson',
                    visible: false,
                    opacity: 1.0,
                    style: this.getCityStyle(),
                    minZoom: 6
                },
                highways: {
                    name: 'Highways',
                    type: 'vector',
                    url: '/data/us_highways.geojson',
                    visible: false,
                    opacity: 0.8,
                    style: this.getHighwayStyle(),
                    minZoom: 8
                }
            },
            weatherLayers: {
                warnings: {
                    name: 'Weather Warnings',
                    type: 'vector',
                    url: null, // Dynamically loaded
                    visible: true,
                    opacity: 0.6,
                    style: this.getWarningStyle()
                },
                watches: {
                    name: 'Weather Watches',
                    type: 'vector',
                    url: null, // Dynamically loaded
                    visible: true,
                    opacity: 0.5,
                    style: this.getWatchStyle()
                }
            }
        };
    }

    /**
     * Initialize the layer manager
     */
    async init() {
        try {
            console.log('Initializing Layer Manager...');

            // Create layer groups
            this.createLayerGroups();

            // Initialize base layers
            await this.initializeBaseLayers();

            // Initialize radar layers
            await this.initializeRadarLayers();

            // Initialize overlay layers
            await this.initializeOverlayLayers();

            // Initialize weather layers
            await this.initializeWeatherLayers();

            // Set initial layer visibility based on zoom
            this.updateLayersForZoom(this.map.getView().getZoom());

            this.isInitialized = true;
            console.log('Layer Manager initialized successfully');

            this.dispatchEvent(new CustomEvent('layers:initialized'));

        } catch (error) {
            console.error('Failed to initialize Layer Manager:', error);
            throw error;
        }
    }

    /**
     * Create layer groups for organization
     */
    createLayerGroups() {
        this.layerGroups.set('base', []);
        this.layerGroups.set('radar', []);
        this.layerGroups.set('overlay', []);
        this.layerGroups.set('weather', []);
    }

    /**
     * Initialize base map layers
     */
    async initializeBaseLayers() {
        for (const [key, config] of Object.entries(this.layerConfig.baseLayers)) {
            const layer = new TileLayer({
                source: config.source,
                visible: config.visible,
                opacity: config.opacity,
                zIndex: 0
            });

            layer.set('name', config.name);
            layer.set('type', 'base');
            layer.set('key', key);

            this.layers.set(`base_${key}`, layer);
            this.layerGroups.get('base').push(layer);
            this.map.addLayer(layer);
        }

        console.log('Base layers initialized');
    }

    /**
     * Initialize radar data layers
     */
    async initializeRadarLayers() {
        for (const [key, config] of Object.entries(this.layerConfig.radarLayers)) {
            let layer;

            if (config.type === 'wms') {
                // WMS Image Layer
                layer = new ImageLayer({
                    source: new ImageWMS({
                        url: config.url,
                        params: {
                            'LAYERS': config.layers,
                            'FORMAT': config.format,
                            'TRANSPARENT': config.transparent,
                            'TIME': new Date().toISOString()
                        },
                        crossOrigin: config.crossOrigin || 'anonymous',
                        attributions: config.attribution
                    }),
                    visible: config.visible,
                    opacity: config.opacity,
                    zIndex: 10
                });
            } else if (config.type === 'xyz') {
                // XYZ Tile Layer
                layer = new TileLayer({
                    source: new XYZ({
                        url: config.url,
                        crossOrigin: config.crossOrigin || 'anonymous',
                        attributions: config.attribution,
                        transition: 250,
                        maxZoom: 16
                    }),
                    visible: config.visible,
                    opacity: config.opacity,
                    zIndex: 10
                });
            } else {
                console.error(`Unknown radar layer type: ${config.type}`);
                continue;
            }

            layer.set('name', config.name);
            layer.set('type', 'radar');
            layer.set('key', key);
            layer.set('config', config);

            this.layers.set(`radar_${key}`, layer);
            this.layerGroups.get('radar').push(layer);
            this.map.addLayer(layer);

            console.log(`✅ Added radar layer: ${config.name} (${config.type})`);
        }

        console.log('Radar layers initialized');
    }

    /**
     * Initialize overlay layers
     */
    async initializeOverlayLayers() {
        for (const [key, config] of Object.entries(this.layerConfig.overlayLayers)) {
            try {
                const vectorSource = new VectorSource({
                    url: config.url,
                    format: new GeoJSON()
                });

                const layer = new VectorLayer({
                    source: vectorSource,
                    visible: config.visible,
                    opacity: config.opacity,
                    style: config.style,
                    zIndex: 5,
                    minZoom: config.minZoom || 0
                });

                layer.set('name', config.name);
                layer.set('type', 'overlay');
                layer.set('key', key);

                this.layers.set(`overlay_${key}`, layer);
                this.layerGroups.get('overlay').push(layer);
                this.map.addLayer(layer);

            } catch (error) {
                console.warn(`Failed to load overlay layer ${key}:`, error);
            }
        }

        console.log('Overlay layers initialized');
    }

    /**
     * Initialize weather alert layers
     */
    async initializeWeatherLayers() {
        for (const [key, config] of Object.entries(this.layerConfig.weatherLayers)) {
            const vectorSource = new VectorSource({
                format: new GeoJSON()
            });

            const layer = new VectorLayer({
                source: vectorSource,
                visible: config.visible,
                opacity: config.opacity,
                style: config.style,
                zIndex: 15
            });

            layer.set('name', config.name);
            layer.set('type', 'weather');
            layer.set('key', key);

            this.layers.set(`weather_${key}`, layer);
            this.layerGroups.get('weather').push(layer);
            this.map.addLayer(layer);
        }

        console.log('Weather layers initialized');
    }

    /**
     * Get a layer by its key
     */
    getLayer(key) {
        return this.layers.get(key);
    }

    /**
     * Get all layers in a group
     */
    getLayerGroup(groupName) {
        return this.layerGroups.get(groupName) || [];
    }

    /**
     * Set layer visibility
     */
    setLayerVisibility(key, visible) {
        const layer = this.getLayer(key);
        if (layer) {
            layer.setVisible(visible);
            this.dispatchEvent(new CustomEvent('layer:visibility:changed', {
                detail: { key, visible }
            }));
        }
    }

    /**
     * Set layer opacity
     */
    setLayerOpacity(key, opacity) {
        const layer = this.getLayer(key);
        if (layer) {
            layer.setOpacity(opacity);
            this.dispatchEvent(new CustomEvent('layer:opacity:changed', {
                detail: { key, opacity }
            }));
        }
    }

    /**
     * Switch base layer
     */
    switchBaseLayer(key) {
        // Hide all base layers
        this.getLayerGroup('base').forEach(layer => {
            layer.setVisible(false);
        });

        // Show selected base layer
        this.setLayerVisibility(`base_${key}`, true);

        this.dispatchEvent(new CustomEvent('base:layer:changed', {
            detail: { key }
        }));
    }

    /**
     * Update radar layer time parameter
     */
    updateRadarTime(time) {
        this.getLayerGroup('radar').forEach(layer => {
            if (layer.getVisible()) {
                const source = layer.getSource();
                const params = source.getParams();
                params.TIME = time.toISOString();
                source.updateParams(params);
            }
        });

        this.dispatchEvent(new CustomEvent('radar:time:updated', {
            detail: { time }
        }));
    }

    /**
     * Update layers based on zoom level
     */
    updateLayersForZoom(zoom) {
        this.layers.forEach((layer, key) => {
            const minZoom = layer.get('minZoom');
            const maxZoom = layer.get('maxZoom');

            if (minZoom && zoom < minZoom) {
                layer.setVisible(false);
            } else if (maxZoom && zoom > maxZoom) {
                layer.setVisible(false);
            } else {
                // Restore visibility based on layer config
                const layerKey = layer.get('key');
                const layerType = layer.get('type');

                if (layerType && layerKey) {
                    const config = this.layerConfig[`${layerType}Layers`]?.[layerKey];
                    if (config) {
                        layer.setVisible(config.visible);
                    }
                }
            }
        });

        this.dispatchEvent(new CustomEvent('layers:zoom:updated', {
            detail: { zoom }
        }));
    }

    /**
     * Add weather alert features to appropriate layers
     */
    addWeatherFeatures(type, features) {
        const layer = this.getLayer(`weather_${type}`);
        if (layer) {
            const source = layer.getSource();
            source.clear();
            source.addFeatures(features);
        }
    }

    /**
     * Style functions for different layer types
     */
    getStateStyle() {
        return new Style({
            stroke: new Stroke({
                color: 'rgba(255, 255, 255, 0.8)',
                width: 2
            }),
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.1)'
            })
        });
    }

    getCountyStyle() {
        return new Style({
            stroke: new Stroke({
                color: 'rgba(255, 255, 255, 0.5)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.05)'
            })
        });
    }

    getCityStyle() {
        return new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.9)'
                }),
                stroke: new Stroke({
                    color: 'rgba(0, 0, 0, 0.7)',
                    width: 1
                })
            }),
            text: new Text({
                font: '12px Calibri,sans-serif',
                fill: new Fill({
                    color: '#ffffff'
                }),
                stroke: new Stroke({
                    color: '#000000',
                    width: 2
                }),
                offsetY: -15
            })
        });
    }

    getHighwayStyle() {
        return new Style({
            stroke: new Stroke({
                color: 'rgba(255, 165, 0, 0.8)',
                width: 3
            })
        });
    }

    getWarningStyle() {
        return new Style({
            stroke: new Stroke({
                color: 'rgba(255, 0, 0, 0.8)',
                width: 2
            }),
            fill: new Fill({
                color: 'rgba(255, 0, 0, 0.3)'
            })
        });
    }

    getWatchStyle() {
        return new Style({
            stroke: new Stroke({
                color: 'rgba(255, 165, 0, 0.8)',
                width: 2
            }),
            fill: new Fill({
                color: 'rgba(255, 165, 0, 0.2)'
            })
        });
    }

    /**
     * Get layer configuration for UI
     */
    getLayerConfiguration() {
        return {
            base: Object.entries(this.layerConfig.baseLayers).map(([key, config]) => ({
                key,
                name: config.name,
                visible: config.visible,
                opacity: config.opacity
            })),
            radar: Object.entries(this.layerConfig.radarLayers).map(([key, config]) => ({
                key,
                name: config.name,
                visible: config.visible,
                opacity: config.opacity
            })),
            overlay: Object.entries(this.layerConfig.overlayLayers).map(([key, config]) => ({
                key,
                name: config.name,
                visible: config.visible,
                opacity: config.opacity
            })),
            weather: Object.entries(this.layerConfig.weatherLayers).map(([key, config]) => ({
                key,
                name: config.name,
                visible: config.visible,
                opacity: config.opacity
            }))
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.layers.clear();
        this.layerGroups.clear();
        console.log('Layer Manager cleanup completed');
    }
}

export default LayerManager;
