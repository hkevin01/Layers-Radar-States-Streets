/**
 * Radar Controller Module
 * Manages NEXRAD radar data loading, caching, and animation
 * Enhanced with comprehensive debugging and validation
 * @author NEXRAD Radar Team
 * @version 2.1.0
 */

/**
 * Radar Controller Class
 * Handles all radar-related operations and data management
 */
export class RadarController extends EventTarget {
    constructor(map, layerManager, config) {
        super();
        this.map = map;
        this.layerManager = layerManager;
        this.config = config;

        // Radar state management
        this.currentRadarType = 'base_reflectivity';
        this.isAnimating = false;
        this.animationFrames = [];
        this.currentFrameIndex = 0;
        this.animationTimer = null;
        this.dataCache = new Map();
        this.lastUpdateTime = null;

        // Enhanced debugging and validation
        this.debugMode = config.debug || false;
        this.tileLoadStats = {
            attempted: 0,
            successful: 0,
            failed: 0,
            lastError: null
        };
        this.connectionStatus = 'unknown';
        this.validationResults = new Map();

        // Current working NEXRAD endpoints (2025)
        // NEXRAD data sources configuration
        this.nexradSources = [
            {
                id: 'iem',
                name: 'Iowa State Mesonet (Primary)',
                url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
                testUrl: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/8/88/128.png',
                attribution: '© Iowa Environmental Mesonet',
                priority: 1,
                type: 'xyz',
                tileGrid: {
                    extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
                    resolutions: Array(20).fill().map((_, i) => 156543.03392804097 / Math.pow(2, i)),
                    tileSize: [256, 256]
                }
            },
            {
                id: 'noaa',
                name: 'NOAA nowCOAST (WMS)',
                url: 'https://nowcoast.noaa.gov/arcgis/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/WMSServer',
                type: 'wms',
                params: {
                    'LAYERS': '1',
                    'FORMAT': 'image/png',
                    'TRANSPARENT': true,
                    'VERSION': '1.3.0',
                    'CRS': 'EPSG:3857'
                },
                attribution: '© NOAA NowCOAST',
                priority: 2
            }
        ];

        // Initialize the radar layer
        this.initializeWithDiagnostics();
    }

    async initializeWithDiagnostics() {
        if (this.debugMode) {
            console.log('Initializing NEXRAD radar with diagnostics...');
        }

        try {
            // Start with primary source
            const source = this.nexradSources[0];
            const tileSource = new ol.source.XYZ({
                url: source.url,
                attributions: source.attribution,
                crossOrigin: 'anonymous',
                tileGrid: new ol.tilegrid.TileGrid({
                    extent: source.tileGrid.extent,
                    resolutions: source.tileGrid.resolutions,
                    tileSize: source.tileGrid.tileSize
                })
            });

            // Set up tile load monitoring
            tileSource.on('tileloadstart', () => {
                this.tileLoadStats.attempted++;
                this.updateSourceStats();
            });

            tileSource.on('tileloadend', () => {
                this.tileLoadStats.successful++;
                this.updateSourceStats();
            });

            tileSource.on('tileloaderror', (event) => {
                this.tileLoadStats.failed++;
                this.tileLoadStats.lastError = 'Tile load failed at z:' + event.tile.tileCoord[0] + ', x:' + event.tile.tileCoord[1] + ', y:' + event.tile.tileCoord[2];
                this.updateSourceStats();
                this.handleTileError(event);
            });

            const radarLayer = this.layerManager.layers.get('radar');
            if (radarLayer) {
                radarLayer.setSource(tileSource);
                if (this.debugMode) {
                    console.log('Updated existing radar layer with new source');
                }
            } else {
                if (this.debugMode) {
                    console.log('Creating new radar layer');
                }
                await this.layerManager.initializeRadarLayer();
            }

            this.connectionStatus = 'connected';
            if (this.debugMode) {
                console.log('✅ NEXRAD radar initialization successful');
            }

        } catch (error) {
            this.connectionStatus = 'error';
            this.tileLoadStats.lastError = error.message;
            console.error('❌ NEXRAD radar initialization failed:', error);
            throw error;
        }
    }

    updateSourceStats() {
        const stats = this.tileLoadStats;
        const total = stats.attempted;
        const success = stats.successful;
        const failed = stats.failed;
        const loading = total - (success + failed);

        // Update source statistics
        this.sourceStats = {
            [this.nexradSources[0].id]: {
                name: this.nexradSources[0].name,
                stats: {
                    loaded: success,
                    errors: failed,
                    loading: loading,
                    retryCount: this.tileLoadStats.retryCount || 0,
                    lastError: this.tileLoadStats.lastError
                }
            }
        };

        // If we have too many errors, try switching sources
        if (failed > success && failed > 10) {
            this.handleSourceFailure();
        }
    }

    async handleSourceFailure() {
        if (this.debugMode) {
            console.warn('Current radar source failing, attempting to switch sources...');
        }

        // Find next available source
        const nextSource = this.nexradSources.find(source =>
            source.id !== this.currentSourceId && source.available !== false
        );

        if (nextSource) {
            if (this.debugMode) {
                console.log('Switching to alternate radar source: ' + nextSource.name);
            }

            try {
                // Test the new source first
                await this.testRadarSource(nextSource);

                // Switch to the new source
                const newSource = nextSource.type === 'wms'
                    ? new ol.source.TileWMS({
                        url: nextSource.url,
                        params: nextSource.params,
                        crossOrigin: 'anonymous'
                    })
                    : new ol.source.XYZ({
                        url: nextSource.url,
                        crossOrigin: 'anonymous'
                    });

                const radarLayer = this.layerManager.layers.get('radar');
                if (radarLayer) {
                    radarLayer.setSource(newSource);
                    this.currentSourceId = nextSource.id;
                    this.resetLoadStats();
                }

            } catch (error) {
                console.error('Failed to switch radar source:', error);
                nextSource.available = false;
            }
        } else {
            console.error('No alternate radar sources available');
        }
    }

    resetLoadStats() {
        this.tileLoadStats = {
            attempted: 0,
            successful: 0,
            failed: 0,
            lastError: null,
            retryCount: 0
        };
    }

    async testRadarSource(source) {
        if (source.type === 'wms') {
            const url = new URL(source.url);
            url.searchParams.append('SERVICE', 'WMS');
            url.searchParams.append('VERSION', '1.3.0');
            url.searchParams.append('REQUEST', 'GetCapabilities');

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error('WMS source test failed: ' + response.statusText);
            }
        } else {
            // Test XYZ source with a sample tile
            const sampleUrl = source.url
                .replace('{z}', '8')
                .replace('{x}', '128')
                .replace('{y}', '128');

            const response = await fetch(sampleUrl, {
                method: 'HEAD',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error('XYZ source test failed: ' + response.statusText);
            }
        }
    }

    // Layer visibility control
    toggleVisibility() {
        const radarLayer = this.layerManager.layers.get('radar');
        if (radarLayer) {
            const visible = !radarLayer.getVisible();
            radarLayer.setVisible(visible);
            return visible;
        }
        return false;
    }

    // Opacity control
    setOpacity(opacity) {
        const radarLayer = this.layerManager.layers.get('radar');
        if (radarLayer) {
            radarLayer.setOpacity(opacity);
        }
    }
}
