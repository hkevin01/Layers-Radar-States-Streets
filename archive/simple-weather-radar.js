/**
 * Simplified Weather Radar Application
 * Working version using global OpenLayers
 */

// Global weather radar app
let weatherRadarApp = null;

class SimpleWeatherRadar {
    constructor() {
        this.map = null;
        this.initialized = false;
        this.loadingScreen = null;
        
        console.log('🌦️ SimpleWeatherRadar constructor called');
    }

    async init() {
        try {
            console.log('🚀 Starting weather radar initialization...');
            this.showLoadingMessage('Initializing NEXRAD radar...');
            
            // Check if OpenLayers is available
            if (typeof ol === 'undefined') {
                throw new Error('OpenLayers not loaded');
            }
            
            console.log('✅ OpenLayers global object found');
            this.showLoadingMessage('Creating map view...');
            
            // Create the map
            this.createMap();
            
            this.showLoadingMessage('Loading layers...');
            await this.loadBaseLayers();
            
            this.showLoadingMessage('Initializing weather services...');
            await this.initializeWeatherServices();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.initialized = true;
            console.log('✅ Weather radar application initialized successfully!');
            
        } catch (error) {
            console.error('❌ Weather radar initialization failed:', error);
            this.showError('Failed to initialize weather radar: ' + error.message);
        }
    }
    
    createMap() {
        console.log('🗺️ Creating OpenLayers map...');
        
        this.map = new ol.Map({
            target: 'map',
            layers: [],
            view: new ol.View({
                center: ol.proj.fromLonLat([-98.5795, 39.8283]), // Center of US
                zoom: 5,
                minZoom: 3,
                maxZoom: 15
            })
        });
        
        console.log('✅ Map created successfully');
    }
    
    async loadBaseLayers() {
        console.log('🌍 Loading base layers...');
        
        // Add OSM base layer
        const osmLayer = new ol.layer.Tile({
            title: 'OpenStreetMap',
            type: 'base',
            visible: true,
            source: new ol.source.OSM()
        });
        
        this.map.addLayer(osmLayer);
        
        // Add satellite layer
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
        
        console.log('✅ Base layers loaded');
    }
    
    async initializeWeatherServices() {
        console.log('🌤️ Initializing weather services...');
        
        // Add NEXRAD radar layer
        try {
            const radarLayer = new ol.layer.Image({
                title: 'NEXRAD Radar',
                opacity: 0.7,
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
            console.log('✅ NEXRAD radar layer added');
            
        } catch (error) {
            console.warn('⚠️ Could not load NEXRAD radar:', error.message);
        }
        
        // Add weather alerts layer
        try {
            await this.loadWeatherAlerts();
        } catch (error) {
            console.warn('⚠️ Could not load weather alerts:', error.message);
        }
        
        console.log('✅ Weather services initialized');
    }
    
    async loadWeatherAlerts() {
        console.log('⚠️ Loading weather alerts...');
        
        try {
            const response = await fetch('https://api.weather.gov/alerts/active?status=actual&limit=50');
            
            if (!response.ok) {
                throw new Error(`Weather alerts API returned ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                console.log(`📋 Found ${data.features.length} active weather alerts`);
                
                // Create vector layer for alerts
                const alertsSource = new ol.source.Vector();
                const alertsLayer = new ol.layer.Vector({
                    title: 'Weather Alerts',
                    source: alertsSource,
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
                console.log('✅ Weather alerts layer added');
            }
            
        } catch (error) {
            console.warn('⚠️ Weather alerts loading failed:', error.message);
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
        }
    }
    
    showError(message) {
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = message;
            loadingText.style.color = '#ef4444';
        }
        
        // Also show in console
        console.error('🚨 ' + message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM loaded, initializing weather radar...');
    
    weatherRadarApp = new SimpleWeatherRadar();
    
    // Wait a moment for OpenLayers to fully load
    setTimeout(async () => {
        await weatherRadarApp.init();
    }, 100);
});

// Make app available globally for debugging
window.weatherRadarApp = weatherRadarApp;
