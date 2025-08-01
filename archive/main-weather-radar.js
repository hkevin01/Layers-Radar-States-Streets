/**
 * Main Weather Radar Application - Compatible Version
 * Works with the complex HTML structure of weather-radar.html
 */

let mainWeatherRadarApp = null;

class MainWeatherRadar {
    constructor() {
        this.map = null;
        this.initialized = false;
        this.layers = {};
        
        console.log('🌦️ MainWeatherRadar constructor called');
    }

    async init() {
        try {
            console.log('🚀 Starting main weather radar initialization...');
            this.showLoadingMessage('Initializing NEXRAD radar...');
            
            // Check if OpenLayers is available
            if (typeof ol === 'undefined') {
                throw new Error('OpenLayers not loaded');
            }
            
            console.log('✅ OpenLayers global object found');
            console.log(`📦 OpenLayers version: ${ol.VERSION || 'unknown'}`);
            this.showLoadingMessage('Creating map view...');
            
            // Create the map
            this.createMap();
            
            this.showLoadingMessage('Loading base layers...');
            await this.loadBaseLayers();
            
            this.showLoadingMessage('Initializing weather services...');
            await this.initializeWeatherServices();
            
            this.showLoadingMessage('Setting up user interface...');
            await this.initializeUI();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.initialized = true;
            console.log('✅ Main weather radar application initialized successfully!');
            
            // Update any status displays
            this.updateStatus('Weather radar online');
            
        } catch (error) {
            console.error('❌ Main weather radar initialization failed:', error);
            this.showError('Failed to initialize weather radar: ' + error.message);
        }
    }
    
    createMap() {
        console.log('🗺️ Creating OpenLayers map for main application...');
        
        // Create map targeting the main-map element
        this.map = new ol.Map({
            target: 'main-map',
            layers: [],
            view: new ol.View({
                center: ol.proj.fromLonLat([-98.5795, 39.8283]), // Center of US
                zoom: 5,
                minZoom: 3,
                maxZoom: 15
            })
        });
        
        console.log('✅ Main map created successfully');
        
        // Set up map event handlers
        this.setupMapEvents();
    }
    
    setupMapEvents() {
        // Map click handler for debugging
        this.map.on('click', (event) => {
            const coordinate = ol.proj.toLonLat(event.coordinate);
            console.log('🗺️ Map clicked at:', coordinate);
        });
        
        // Map load complete handler
        this.map.once('rendercomplete', () => {
            console.log('✅ Main map rendered successfully');
        });
    }
    
    async loadBaseLayers() {
        console.log('🌍 Loading base layers for main application...');
        
        try {
            // Add OpenStreetMap base layer
            const osmLayer = new ol.layer.Tile({
                title: 'OpenStreetMap',
                type: 'base',
                visible: true,
                source: new ol.source.OSM()
            });
            
            this.map.addLayer(osmLayer);
            this.layers.osm = osmLayer;
            console.log('✅ OSM base layer added');
            
            // Add satellite layer (hidden by default)
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
        console.log('🌤️ Initializing weather services for main application...');
        
        try {
            // Add NEXRAD radar layer
            const radarLayer = new ol.layer.Image({
                title: 'NEXRAD Radar',
                opacity: 0.8,
                visible: true,
                source: new ol.source.ImageWMS({
                    url: 'https://opengeo.ncep.noaa.gov/geoserver/wms',
                    params: {
                        'LAYERS': 'nexrad-n0r-wmst',
                        'FORMAT': 'image/png',
                        'TRANSPARENT': true
                    },
                    serverType: 'geoserver',
                    crossOrigin: 'anonymous'
                })
            });
            
            this.map.addLayer(radarLayer);
            this.layers.radar = radarLayer;
            console.log('✅ NEXRAD radar layer added to main application');
            
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
    
    async initializeUI() {
        console.log('🎮 Initializing UI for main application...');
        
        try {
            // Set up existing control handlers
            this.setupExistingControls();
            console.log('✅ UI controls initialized');
        } catch (error) {
            console.warn('⚠️ UI initialization issue:', error.message);
        }
    }
    
    setupExistingControls() {
        // Set up handlers for existing HTML controls
        
        // Radar toggle
        const radarToggle = document.getElementById('radar-toggle');
        if (radarToggle) {
            radarToggle.addEventListener('change', (e) => {
                if (this.layers.radar) {
                    this.layers.radar.setVisible(e.target.checked);
                    console.log('🔄 Radar visibility:', e.target.checked);
                }
            });
        }
        
        // Streets toggle
        const streetsToggle = document.getElementById('streets-toggle');
        if (streetsToggle) {
            streetsToggle.addEventListener('change', (e) => {
                if (this.layers.osm) {
                    this.layers.osm.setVisible(e.target.checked);
                    console.log('🔄 Streets visibility:', e.target.checked);
                }
            });
        }
        
        // Alerts toggle
        const alertsToggle = document.getElementById('alerts-toggle');
        if (alertsToggle) {
            alertsToggle.addEventListener('change', (e) => {
                if (this.layers.alerts) {
                    this.layers.alerts.setVisible(e.target.checked);
                    console.log('🔄 Alerts visibility:', e.target.checked);
                }
            });
        }
        
        // Radar opacity slider
        const radarOpacity = document.getElementById('radar-opacity');
        if (radarOpacity) {
            radarOpacity.addEventListener('input', (e) => {
                const opacity = e.target.value / 100;
                if (this.layers.radar) {
                    this.layers.radar.setOpacity(opacity);
                    console.log('🔄 Radar opacity:', opacity);
                }
                
                // Update the display value
                const valueDisplay = document.querySelector('.slider-value');
                if (valueDisplay) {
                    valueDisplay.textContent = e.target.value + '%';
                }
            });
        }
        
        // Geolocation button
        const geolocationBtn = document.getElementById('geolocation');
        if (geolocationBtn) {
            geolocationBtn.addEventListener('click', () => {
                this.centerOnLocation();
            });
        }
        
        console.log('🎮 Control handlers set up successfully');
    }
    
    centerOnLocation() {
        console.log('📍 Attempting to center on user location...');
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = [position.coords.longitude, position.coords.latitude];
                    this.map.getView().setCenter(ol.proj.fromLonLat(coords));
                    this.map.getView().setZoom(10);
                    console.log('✅ Centered on user location:', coords);
                },
                (error) => {
                    console.error('❌ Geolocation error:', error);
                }
            );
        } else {
            console.warn('⚠️ Geolocation not supported');
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
    
    updateStatus(message) {
        // Update any status displays that might exist
        console.log(`📊 Status: ${message}`);
        
        // Update current conditions if element exists
        const conditions = document.getElementById('conditions');
        if (conditions && message.includes('online')) {
            conditions.textContent = 'Radar Online';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM loaded, initializing main weather radar application...');
    
    mainWeatherRadarApp = new MainWeatherRadar();
    
    // Wait a moment for OpenLayers to fully load
    setTimeout(async () => {
        await mainWeatherRadarApp.init();
    }, 100);
});

// Make app available globally for debugging
window.mainWeatherRadarApp = mainWeatherRadarApp;
window.weatherRadarApp = mainWeatherRadarApp; // For compatibility
