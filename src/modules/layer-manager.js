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
            source: new ol.source.OSM({ crossOrigin: 'anonymous' }),
            visible: true,
            zIndex: 0
        });
        this.layers.set('street', streetLayer);
        this.map.addLayer(streetLayer);

        // Add satellite layer (ESRI World Imagery)
        const satelliteLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attributions: 'Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
                crossOrigin: 'anonymous'
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

            // Add tile error logging
            primarySource.on('tileloaderror', (e) => {
                const tile = e.tile;
                console.warn('[tiles] Primary radar load error', tile && tile.getKey ? tile.getKey() : e);
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

            // Add tile error logging
            fallbackSource.on('tileloaderror', (e) => {
                const tile = e.tile;
                console.warn('[tiles] Fallback radar load error', tile && tile.getKey ? tile.getKey() : e);
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
