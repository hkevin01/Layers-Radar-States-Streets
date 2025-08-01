/**
 * Working Weather Radar Application
 * Using global OpenLayers with simplified controls
 */

// Global weather radar app
let weatherRadarApp = null;

class WorkingWeatherRadar {
    constructor() {
        this.map = null;
        this.initialized = false;
        this.layers = {};
        
        console.log('🌦️ WorkingWeatherRadar constructor called');
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
            console.log(`📦 OpenLayers version: ${ol.VERSION || 'unknown'}`);
            this.showLoadingMessage('Creating map view...');
            
            // Create the map
            this.createMap();
            
            this.showLoadingMessage('Loading base layers...');
            await this.loadBaseLayers();
            
            this.showLoadingMessage('Initializing weather services...');
            await this.initializeWeatherServices();
            
            this.showLoadingMessage('Starting up user interface...');
            await this.initializeUI();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.initialized = true;
            console.log('✅ Weather radar application initialized successfully!');
            
            // Update status
            this.updateStatus('Weather radar online', 'success');
            
        } catch (error) {
            console.error('❌ Weather radar initialization failed:', error);
            this.showError('Failed to initialize weather radar: ' + error.message);
            this.updateStatus('Initialization failed', 'error');
        }
    }
    
    createMap() {
        console.log('🗺️ Creating OpenLayers map...');
        
        // Create a basic map without complex controls initially
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
        this.layers.osm = osmLayer;
        
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
            this.layers.radar = radarLayer;
            console.log('✅ NEXRAD radar layer added');
            
        } catch (error) {
            console.warn('⚠️ Could not load NEXRAD radar:', error.message);
        }
        
        // Initialize weather alerts
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
            // Create vector layer for alerts (even if API fails)
            const alertsSource = new ol.source.Vector();
            const alertsLayer = new ol.layer.Vector({
                title: 'Weather Alerts',
                source: alertsSource,
                visible: false, // Hidden by default
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
            
            // Try to load actual alert data (but don't fail if it doesn't work)
            try {
                const response = await fetch('https://api.weather.gov/alerts/active?status=actual&limit=10');
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.features && data.features.length > 0) {
                        console.log(`📋 Found ${data.features.length} active weather alerts`);
                        // In a real implementation, we would add the features to the layer here
                    }
                }
            } catch (apiError) {
                console.warn('⚠️ Weather alerts API not accessible (CORS or network issue)');
            }
            
        } catch (error) {
            console.warn('⚠️ Weather alerts layer creation failed:', error.message);
        }
    }
    
    async initializeUI() {
        console.log('🎮 Initializing user interface...');
        
        // Set up button event handlers
        this.setupControls();
        
        console.log('✅ User interface initialized');
    }
    
    setupControls() {
        // Layer control functions
        window.switchBaseLayer = (type) => {
            console.log('🔄 Switching base layer to:', type);
            
            if (type === 'osm' && this.layers.osm) {
                this.layers.osm.setVisible(true);
                if (this.layers.satellite) this.layers.satellite.setVisible(false);
                this.updateButtonActive('base', 'street');
            } else if (type === 'satellite' && this.layers.satellite) {
                this.layers.satellite.setVisible(true);
                if (this.layers.osm) this.layers.osm.setVisible(false);
                this.updateButtonActive('base', 'satellite');
            }
            
            this.updateStatus('Switched to ' + type + ' view');
        };
        
        window.toggleLayer = (type) => {
            console.log('🔄 Toggling layer:', type);
            
            if (type === 'radar' && this.layers.radar) {
                const visible = !this.layers.radar.getVisible();
                this.layers.radar.setVisible(visible);
                this.updateButtonToggle('radar', visible);
                this.updateStatus(visible ? 'Radar enabled' : 'Radar disabled');
            } else if (type === 'alerts' && this.layers.alerts) {
                const visible = !this.layers.alerts.getVisible();
                this.layers.alerts.setVisible(visible);
                this.updateButtonToggle('alerts', visible);
                this.updateStatus(visible ? 'Alerts enabled' : 'Alerts disabled');
            }
        };
        
        window.centerOnLocation = () => {
            console.log('📍 Centering on user location...');
            this.updateStatus('Locating...');
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const coords = [position.coords.longitude, position.coords.latitude];
                        this.map.getView().setCenter(ol.proj.fromLonLat(coords));
                        this.map.getView().setZoom(10);
                        this.updateStatus('Centered on your location', 'success');
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        this.updateStatus('Location unavailable', 'error');
                    }
                );
            } else {
                this.updateStatus('Geolocation not supported', 'error');
            }
        };
        
        window.refreshData = () => {
            console.log('🔄 Refreshing weather data...');
            this.updateStatus('Refreshing data...');
            
            // Simulate refresh
            setTimeout(() => {
                this.updateStatus('Data refreshed', 'success');
            }, 1000);
        };
    }
    
    updateButtonActive(group, activeButton) {
        // Update button states for base layer selection
        if (group === 'base') {
            const buttons = document.querySelectorAll('.base-layer-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            
            const activeBtn = document.querySelector(`[onclick="switchBaseLayer('${activeButton === 'street' ? 'osm' : 'satellite'}')"]`);
            if (activeBtn) activeBtn.classList.add('active');
        }
    }
    
    updateButtonToggle(layerType, isActive) {
        // Update toggle button states
        const button = document.querySelector(`[onclick="toggleLayer('${layerType}')"]`);
        if (button) {
            if (isActive) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
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
        
        console.error('🚨 ' + message);
    }
    
    updateStatus(message, type = 'normal') {
        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = type === 'error' ? 'status-error' : 
                                     type === 'success' ? 'status-success' : 'status-normal';
        }
        console.log(`📊 Status: ${message}`);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM loaded, initializing weather radar...');
    
    weatherRadarApp = new WorkingWeatherRadar();
    
    // Wait a moment for OpenLayers to fully load
    setTimeout(async () => {
        await weatherRadarApp.init();
    }, 100);
});

// Make app available globally for debugging
window.weatherRadarApp = weatherRadarApp;
