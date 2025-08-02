/**
 * Weather Radar Core Application
 * Consolidated, working implementation with global OpenLayers
 * @version 3.0.0
 */

/**
 * Core Weather Radar Class
 * Combines all working functionality into a single, reliable implementation
 */
export class WeatherRadarCore {
    constructor(config = {}) {
        // Core properties
        this.map = null;
        this.initialized = false;
        this.layers = {};
        this.controls = {};
        
        // Configuration with defaults
        this.config = {
            target: config.target || 'main-map',
            center: config.center || [-98.5795, 39.8283], // Center of US
            zoom: config.zoom || 5,
            minZoom: config.minZoom || 3,
            maxZoom: config.maxZoom || 15,
            radarOpacity: config.radarOpacity || 0.8,
            enableGeolocation: config.enableGeolocation !== false,
            enableControls: config.enableControls !== false,
            ...config
        };
        
        console.log('🌦️ WeatherRadarCore constructor initialized');
    }

    /**
     * Initialize the weather radar application
     */
    async init() {
        try {
            console.log('🚀 Starting weather radar core initialization...');
            this.showLoadingMessage('Initializing NEXRAD radar...');
            
            // Verify OpenLayers is available
            await this.verifyDependencies();
            
            this.showLoadingMessage('Creating map view...');
            this.createMap();
            
            this.showLoadingMessage('Loading base layers...');
            await this.loadBaseLayers();
            
            this.showLoadingMessage('Initializing weather services...');
            await this.initializeWeatherServices();
            
            if (this.config.enableControls) {
                this.showLoadingMessage('Setting up user interface...');
                await this.initializeControls();
            }
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.initialized = true;
            console.log('✅ Weather radar core initialized successfully!');
            
            // Dispatch initialization event
            this.dispatchEvent('radar:initialized', { instance: this });
            
            // Update status
            this.updateStatus('Weather radar online');
            
        } catch (error) {
            console.error('❌ Weather radar initialization failed:', error);
            this.showError('Failed to initialize weather radar: ' + error.message);
            throw error;
        }
    }
    
    /**
     * Verify all required dependencies are loaded
     */
    async verifyDependencies() {
        if (typeof ol === 'undefined') {
            throw new Error('OpenLayers not loaded');
        }
        
        console.log('✅ OpenLayers global object found');
        console.log(`📦 OpenLayers version: ${ol.VERSION || 'unknown'}`);
        
        // Check for required OpenLayers components
        const requiredComponents = ['Map', 'View', 'layer', 'source', 'proj'];
        for (const component of requiredComponents) {
            if (!ol[component]) {
                throw new Error(`OpenLayers component missing: ${component}`);
            }
        }
        
        console.log('✅ All required dependencies verified');
    }
    
    /**
     * Create the OpenLayers map
     */
    createMap() {
        console.log('🗺️ Creating OpenLayers map...');
        
        // Create map view
        const view = new ol.View({
            center: ol.proj.fromLonLat(this.config.center),
            zoom: this.config.zoom,
            minZoom: this.config.minZoom,
            maxZoom: this.config.maxZoom
        });
        
        // Create map instance
        this.map = new ol.Map({
            target: this.config.target,
            view: view,
            layers: [],
            controls: ol.control.defaultControls({
                attribution: true,
                zoom: true
            })
        });
        
        // Set up event handlers
        this.setupMapEvents();
        
        console.log('✅ Map created successfully');
    }
    
    /**
     * Set up map event handlers
     */
    setupMapEvents() {
        // Map click handler
        this.map.on('click', (event) => {
            const coordinate = ol.proj.toLonLat(event.coordinate);
            console.log('🗺️ Map clicked at:', coordinate);
            this.dispatchEvent('map:clicked', { coordinate, event });
        });
        
        // Map render complete handler
        this.map.once('rendercomplete', () => {
            console.log('✅ Map rendered successfully');
            this.dispatchEvent('map:rendered', { map: this.map });
        });
        
        // Map move end handler
        this.map.on('moveend', (event) => {
            const view = this.map.getView();
            const center = ol.proj.toLonLat(view.getCenter());
            const zoom = view.getZoom();
            console.log('🗺️ Map moved to:', center, 'zoom:', zoom);
            this.dispatchEvent('map:moved', { center, zoom, event });
        });
    }
    
    /**
     * Load base map layers
     */
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
            
            // Satellite imagery layer
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
    
    /**
     * Initialize weather services and radar layers
     */
    async initializeWeatherServices() {
        console.log('🌤️ Initializing weather services...');
        
        // Add NEXRAD radar layer
        await this.addRadarLayer();
        
        // Add weather alerts layer
        await this.addWeatherAlertsLayer();
        
        console.log('✅ Weather services initialized');
    }
    
    /**
     * Add NEXRAD radar layer
     */
    async addRadarLayer() {
        try {
            const radarLayer = new ol.layer.Image({
                title: 'NEXRAD Radar',
                opacity: this.config.radarOpacity,
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
            console.warn('⚠️ NEXRAD radar loading issue:', error.message);
        }
    }
    
    /**
     * Add weather alerts layer
     */
    async addWeatherAlertsLayer() {
        try {
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
    
    /**
     * Initialize UI controls and event handlers
     */
    async initializeControls() {
        console.log('🎮 Initializing controls...');
        
        this.setupLayerControls();
        this.setupNavigationControls();
        
        if (this.config.enableGeolocation) {
            this.setupGeolocationControl();
        }
        
        console.log('✅ Controls initialized');
    }
    
    /**
     * Set up layer toggle controls
     */
    setupLayerControls() {
        // Radar toggle
        this.setupToggleControl('radar-toggle', 'radar');
        
        // Streets toggle
        this.setupToggleControl('streets-toggle', 'osm');
        
        // Alerts toggle
        this.setupToggleControl('alerts-toggle', 'alerts');
        
        // Radar opacity slider
        this.setupOpacityControl('radar-opacity', 'radar');
    }
    
    /**
     * Set up individual toggle control
     */
    setupToggleControl(elementId, layerKey) {
        const element = document.getElementById(elementId);
        if (element && this.layers[layerKey]) {
            element.addEventListener('change', (e) => {
                const layer = this.layers[layerKey];
                layer.setVisible(e.target.checked);
                console.log(`🔄 ${layerKey} visibility:`, e.target.checked);
                this.dispatchEvent('layer:toggled', { layer: layerKey, visible: e.target.checked });
            });
        }
    }
    
    /**
     * Set up opacity control
     */
    setupOpacityControl(elementId, layerKey) {
        const element = document.getElementById(elementId);
        if (element && this.layers[layerKey]) {
            element.addEventListener('input', (e) => {
                const opacity = e.target.value / 100;
                const layer = this.layers[layerKey];
                layer.setOpacity(opacity);
                console.log(`🔄 ${layerKey} opacity:`, opacity);
                this.dispatchEvent('layer:opacity', { layer: layerKey, opacity });
                
                // Update display value
                const valueDisplay = document.querySelector('.slider-value');
                if (valueDisplay) {
                    valueDisplay.textContent = e.target.value + '%';
                }
            });
        }
    }
    
    /**
     * Set up navigation controls
     */
    setupNavigationControls() {
        // Zoom in
        this.setupButtonControl('zoom-in', () => {
            const view = this.map.getView();
            view.setZoom(view.getZoom() + 1);
        });
        
        // Zoom out
        this.setupButtonControl('zoom-out', () => {
            const view = this.map.getView();
            view.setZoom(view.getZoom() - 1);
        });
        
        // Reset view
        this.setupButtonControl('reset-view', () => {
            const view = this.map.getView();
            view.setCenter(ol.proj.fromLonLat(this.config.center));
            view.setZoom(this.config.zoom);
        });
    }
    
    /**
     * Set up geolocation control
     */
    setupGeolocationControl() {
        this.setupButtonControl('geolocation', () => {
            this.centerOnLocation();
        });
    }
    
    /**
     * Set up individual button control
     */
    setupButtonControl(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', handler);
        }
    }
    
    /**
     * Center map on user's location
     */
    centerOnLocation() {
        console.log('📍 Attempting to center on user location...');
        
        if (!navigator.geolocation) {
            console.warn('⚠️ Geolocation not supported');
            this.updateStatus('Geolocation not supported', 'error');
            return;
        }
        
        this.updateStatus('Locating...');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = [position.coords.longitude, position.coords.latitude];
                this.map.getView().setCenter(ol.proj.fromLonLat(coords));
                this.map.getView().setZoom(10);
                console.log('✅ Centered on user location:', coords);
                this.updateStatus('Centered on your location');
                this.dispatchEvent('location:found', { coords });
            },
            (error) => {
                console.error('❌ Geolocation error:', error);
                this.updateStatus('Location unavailable', 'error');
                this.dispatchEvent('location:error', { error });
            }
        );
    }
    
    /**
     * Switch base layer
     */
    switchBaseLayer(layerType) {
        console.log('🔄 Switching to base layer:', layerType);
        
        // Hide all base layers
        Object.values(this.layers).forEach(layer => {
            if (layer.get('type') === 'base') {
                layer.setVisible(false);
            }
        });
        
        // Show selected layer
        if (this.layers[layerType]) {
            this.layers[layerType].setVisible(true);
            this.updateStatus(`Switched to ${layerType} view`);
            this.dispatchEvent('baselayer:changed', { layer: layerType });
        }
    }
    
    /**
     * Update radar type
     */
    setRadarType(radarType) {
        if (!this.layers.radar) return;
        
        const radarLayers = {
            reflectivity: 'nexrad-n0r-wmst',
            velocity: 'nexrad-n0v-wmst',
            precipitation: 'nexrad-n0p-wmst'
        };
        
        if (radarLayers[radarType]) {
            const source = this.layers.radar.getSource();
            source.updateParams({ 'LAYERS': radarLayers[radarType] });
            console.log('🔄 Radar type changed to:', radarType);
            this.dispatchEvent('radar:typeChanged', { type: radarType });
        }
    }
    
    /**
     * Show loading message
     */
    showLoadingMessage(message) {
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
        console.log(`📢 ${message}`);
    }
    
    /**
     * Hide loading screen
     */
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
    
    /**
     * Show error message
     */
    showError(message) {
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = message;
            loadingText.style.color = '#ef4444';
        }
        console.error('🚨 ' + message);
        this.dispatchEvent('error', { message });
    }
    
    /**
     * Update status display
     */
    updateStatus(message, type = 'normal') {
        console.log(`📊 Status: ${message}`);
        
        // Update status text element
        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = type === 'error' ? 'status-error' : 'status-online';
        }
        
        // Update current conditions if element exists
        const conditions = document.getElementById('conditions');
        if (conditions && message.includes('online')) {
            conditions.textContent = 'Radar Online';
        }
        
        this.dispatchEvent('status:updated', { message, type });
    }
    
    /**
     * Dispatch custom events
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`weatherradar:${eventName}`, {
            detail: { ...detail, instance: this },
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Get current application state
     */
    getState() {
        return {
            initialized: this.initialized,
            mapCenter: this.map ? ol.proj.toLonLat(this.map.getView().getCenter()) : null,
            mapZoom: this.map ? this.map.getView().getZoom() : null,
            visibleLayers: Object.keys(this.layers).filter(key => 
                this.layers[key].getVisible()
            ),
            config: this.config
        };
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        if (this.map) {
            this.map.dispose();
            this.map = null;
        }
        
        this.layers = {};
        this.controls = {};
        this.initialized = false;
        
        console.log('🧹 Weather radar core cleaned up');
        this.dispatchEvent('cleanup:completed');
    }
}

export default WeatherRadarCore;
