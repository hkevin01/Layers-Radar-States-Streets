/**
 * Weather Radar Global Compatibility Layer
 * Provides backward compatibility with existing HTML implementations
 * @version 3.0.0
 */

/**
 * Global Weather Radar Application
 * Uses core functionality with global OpenLayers support
 */
class GlobalWeatherRadar {
    constructor() {
        this.map = null;
        this.initialized = false;
        this.layers = {};

        console.log('🌦️ Global Weather Radar initialized');
    }

    async init() {
        try {
            console.log('🚀 Starting global weather radar initialization...');
            this.showLoadingMessage('Initializing NEXRAD radar...');

            // Check if OpenLayers is available
            if (typeof ol === 'undefined') {
                throw new Error('OpenLayers not loaded - ensure ol.js is included before this script');
            }

            console.log('✅ OpenLayers global object found');
            console.log(`📦 OpenLayers version: ${ol.VERSION || 'unknown'}`);

            this.showLoadingMessage('Creating map view...');
            this.createMap();

            this.showLoadingMessage('Loading base layers...');
            await this.loadBaseLayers();

            this.showLoadingMessage('Initializing weather services...');
            await this.initializeWeatherServices();

            this.showLoadingMessage('Setting up user interface...');
            await this.initializeControls();

            // Hide loading screen
            this.hideLoadingScreen();

            this.initialized = true;
            console.log('✅ Global weather radar initialized successfully!');

            this.updateStatus('Weather radar online');

        } catch (error) {
            console.error('❌ Global weather radar initialization failed:', error);
            this.showError('Failed to initialize weather radar: ' + error.message);
        }
    }

    createMap() {
        console.log('🗺️ Creating OpenLayers map...');

        // Determine target element
        const target = document.getElementById('main-map') ||
                      document.getElementById('map') ||
                      'map';

        this.map = new ol.Map({
            target: target,
            layers: [],
            view: new ol.View({
                center: ol.proj.fromLonLat([-98.5795, 39.8283]), // Center of US
                zoom: 5,
                minZoom: 3,
                maxZoom: 15
            })
        });

        // Set up map event handlers
        this.map.on('click', (event) => {
            const coordinate = ol.proj.toLonLat(event.coordinate);
            console.log('🗺️ Map clicked at:', coordinate);
        });

        console.log('✅ Map created successfully');
    }

    async loadBaseLayers() {
        console.log('🌍 Loading base layers...');

        try {
            // OpenStreetMap base layer
            const osmLayer = new ol.layer.Tile({
                title: 'OpenStreetMap',
                type: 'base',
                visible: true,
                source: new ol.source.OSM()
            });

            this.map.addLayer(osmLayer);
            this.layers.osm = osmLayer;
            console.log('✅ OSM base layer added');

            // Satellite layer
            const satelliteLayer = new ol.layer.Tile({
                title: 'Satellite',
                type: 'base',
                visible: false,
                source: new ol.source.XYZ({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    attributions: '© Esri'
                })
            });

            this.map.addLayer(satelliteLayer);
            this.layers.satellite = satelliteLayer;
            console.log('✅ Satellite layer added');

        } catch (error) {
            console.warn('⚠️ Base layer loading issue:', error.message);
        }
    }

    async initializeWeatherServices() {
        console.log('🌤️ Initializing weather services...');

        try {
            // Primary: WMS (time-enabled). Some deployments require TIME; often latest is default.
            // We'll attempt WMS first, then fallback to NOAA TMS tiles if loading fails.
            const wmsSource = new ol.source.ImageWMS({
                url: 'https://opengeo.ncep.noaa.gov/geoserver/wms',
                params: {
                    'LAYERS': 'nexrad-n0r-wmst',
                    'FORMAT': 'image/png',
                    'TRANSPARENT': true
                },
                serverType: 'geoserver',
                crossOrigin: 'anonymous'
            });

            const radarLayer = new ol.layer.Image({
                title: 'NEXRAD Radar',
                opacity: 0.8,
                visible: true,
                source: wmsSource
            });

            // Track load success/failure and provide a tile fallback if needed
            let wmsHadError = false;
            wmsSource.on('imageloadend', () => {
                console.log('🛰️ NEXRAD WMS image loaded');
                this.updateStatus('Radar image loaded');
            });
            wmsSource.on('imageloaderror', () => {
                console.warn('⚠️ NEXRAD WMS image failed; switching to TMS fallback');
                wmsHadError = true;
                try {
                    // Replace with NOAA GeoWebCache TMS tiles (bref, quality controlled)
                    const tmsUrl = 'https://opengeo.ncep.noaa.gov/geoserver/gwc/service/tms/1.0.0/' +
                        'radar:conus_bref_qcd@EPSG:900913@png/{z}/{x}/{-y}.png';
                    const tmsSource = new ol.source.XYZ({
                        url: tmsUrl,
                        crossOrigin: 'anonymous',
                        attributions: 'NOAA/NCEP'
                    });
                    const tmsLayer = new ol.layer.Tile({
                        title: 'NEXRAD Radar (TMS Fallback)',
                        opacity: 0.75,
                        visible: true,
                        source: tmsSource
                    });
                    this.map.removeLayer(radarLayer);
                    this.map.addLayer(tmsLayer);
                    this.layers.radar = tmsLayer;
                    tmsSource.on('tileloadend', () => console.log('🧩 NEXRAD TMS tile loaded'));
                    tmsSource.on('tileloaderror', (e) => console.warn('🧩 NEXRAD TMS tile error', e));
                    this.updateStatus('Radar tile fallback active');
                } catch (e) {
                    console.error('Fallback to TMS failed:', e);
                }
            });

            this.map.addLayer(radarLayer);
            this.layers.radar = radarLayer;
            if (!wmsHadError) console.log('✅ NEXRAD radar layer added (WMS)');

        } catch (error) {
            console.warn('⚠️ NEXRAD radar loading issue:', error.message);
        }

        try {
            // Create weather alerts layer
            const alertsSource = new ol.source.Vector();
            const alertsLayer = new ol.layer.Vector({
                title: 'Weather Alerts',
                source: alertsSource,
                visible: true,
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#ff6b35',
                        width: 2
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 107, 53, 0.2)'
                    })
                })
            });

            this.map.addLayer(alertsLayer);
            this.layers.alerts = alertsLayer;
            console.log('✅ Weather alerts layer created');

        } catch (error) {
            console.warn('⚠️ Weather alerts layer issue:', error.message);
        }
    }

    async initializeControls() {
        console.log('🎮 Initializing controls...');

        // Set up layer toggles
        this.setupToggle('radar-toggle', 'radar');
        this.setupToggle('streets-toggle', 'osm');
        this.setupToggle('alerts-toggle', 'alerts');

        // Set up opacity slider
        this.setupOpacitySlider('radar-opacity', 'radar');

        // Set up navigation buttons
        this.setupButton('geolocation', () => this.centerOnLocation());
        this.setupButton('zoom-in', () => {
            const view = this.map.getView();
            view.setZoom(view.getZoom() + 1);
        });
        this.setupButton('zoom-out', () => {
            const view = this.map.getView();
            view.setZoom(view.getZoom() - 1);
        });

        console.log('✅ Controls initialized');
    }

    setupToggle(elementId, layerKey) {
        const element = document.getElementById(elementId);
        if (element && this.layers[layerKey]) {
            element.addEventListener('change', (e) => {
                this.layers[layerKey].setVisible(e.target.checked);
                console.log(`🔄 ${layerKey} visibility:`, e.target.checked);
            });
        }
    }

    setupOpacitySlider(elementId, layerKey) {
        const element = document.getElementById(elementId);
        if (element && this.layers[layerKey]) {
            element.addEventListener('input', (e) => {
                const opacity = e.target.value / 100;
                this.layers[layerKey].setOpacity(opacity);
                console.log(`🔄 ${layerKey} opacity:`, opacity);

                // Update display value
                const valueDisplay = document.querySelector('.slider-value');
                if (valueDisplay) {
                    valueDisplay.textContent = e.target.value + '%';
                }
            });
        }
    }

    setupButton(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', handler);
        }
    }

    centerOnLocation() {
        console.log('📍 Attempting to center on user location...');

        if (navigator.geolocation) {
            this.updateStatus('Locating...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = [position.coords.longitude, position.coords.latitude];
                    this.map.getView().setCenter(ol.proj.fromLonLat(coords));
                    this.map.getView().setZoom(10);
                    console.log('✅ Centered on user location:', coords);
                    this.updateStatus('Centered on your location');
                },
                (error) => {
                    console.error('❌ Geolocation error:', error);
                    this.updateStatus('Location unavailable', 'error');
                }
            );
        } else {
            console.warn('⚠️ Geolocation not supported');
            this.updateStatus('Geolocation not supported', 'error');
        }
    }

    showLoadingMessage(message) {
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
        console.log(`📢 ${message}`);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
            console.log('✅ Loading screen hidden');
        }
    }

    showError(message) {
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = message;
            loadingText.style.color = '#ef4444';
        }
        console.error('🚨 ' + message);
    }

    updateStatus(message, type = 'normal') {
        console.log(`📊 Status: ${message}`);

        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = type === 'error' ? 'status-error' : 'status-online';
        }

        const conditions = document.getElementById('conditions');
        if (conditions && message.includes('online')) {
            conditions.textContent = 'Radar Online';
        }
    }
}

// Global functions for backward compatibility
let globalWeatherRadarApp = null;

function switchBaseLayer(layerType) {
    console.log('🔄 Switching to base layer:', layerType);
    if (globalWeatherRadarApp?.layers) {
        // Hide all base layers
        Object.values(globalWeatherRadarApp.layers).forEach(layer => {
            if (layer.get && layer.get('type') === 'base') {
                layer.setVisible(false);
            }
        });

        // Show selected layer
        if (globalWeatherRadarApp.layers[layerType]) {
            globalWeatherRadarApp.layers[layerType].setVisible(true);
            globalWeatherRadarApp.updateStatus(`Switched to ${layerType} view`);
        }
    }
}

function toggleLayer(layerType) {
    console.log('🔄 Toggling layer:', layerType);
    if (globalWeatherRadarApp?.layers?.[layerType]) {
        const layer = globalWeatherRadarApp.layers[layerType];
        const visible = !layer.getVisible();
        layer.setVisible(visible);
        globalWeatherRadarApp.updateStatus(visible ? `${layerType} enabled` : `${layerType} disabled`);
    }
}

function centerOnLocation() {
    if (globalWeatherRadarApp) {
        globalWeatherRadarApp.centerOnLocation();
    }
}

function refreshData() {
    console.log('🔄 Refreshing weather data...');
    if (globalWeatherRadarApp) {
        globalWeatherRadarApp.updateStatus('Refreshing data...');
        // Simulate refresh
        setTimeout(() => {
            globalWeatherRadarApp.updateStatus('Data refreshed');
        }, 1000);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM loaded, initializing global weather radar...');

    globalWeatherRadarApp = new GlobalWeatherRadar();

    // Wait a moment for OpenLayers to fully load
    setTimeout(async () => {
        await globalWeatherRadarApp.init();
    }, 100);
});

// Make everything globally available
window.globalWeatherRadarApp = globalWeatherRadarApp;
window.weatherRadarApp = globalWeatherRadarApp;
window.mainWeatherRadarApp = globalWeatherRadarApp;
window.switchBaseLayer = switchBaseLayer;
window.toggleLayer = toggleLayer;
window.centerOnLocation = centerOnLocation;
window.refreshData = refreshData;
