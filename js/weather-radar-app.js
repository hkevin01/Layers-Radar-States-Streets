/**
 * NEXRAD Weather Radar Application
 * Main application controller for weather radar visualization
 * @author NEXRAD Radar Team
 * @version 2.0.0
 */

import { Map, View } from 'ol';
import { defaults as defaultControls, ScaleLine, ZoomSlider } from 'ol/control';
import { defaults as defaultInteractions, DragRotateAndZoom } from 'ol/interaction';
import { fromLonLat, transformExtent } from 'ol/proj';

import { GeolocationService } from './modules/geolocation-service.js';
import { LayerManager } from './modules/layer-manager.js';
import { RadarController } from './modules/radar-controller.js';
import { SettingsManager } from './modules/settings-manager.js';
import { TimelineController } from './modules/timeline-controller.js';
import { UIController } from './modules/ui-controller.js';
import { WeatherAlertsManager } from './modules/weather-alerts.js';

/**
 * Main Weather Radar Application Class
 * Coordinates all modules and manages application state
 */
export class WeatherRadarApp {
    constructor() {
        this.map = null;
        this.layerManager = null;
        this.radarController = null;
        this.alertsManager = null;
        this.timelineController = null;
        this.uiController = null;
        this.geolocationService = null;
        this.settingsManager = null;
        
        this.isInitialized = false;
        this.currentView = 'current'; // current, animation, alerts
        
        // Application configuration
        this.config = {
            defaultCenter: [-98.5795, 39.8283], // Geographic center of US
            defaultZoom: 5,
            minZoom: 3,
            maxZoom: 15,
            extent: transformExtent([-180, -85, 180, 85], 'EPSG:4326', 'EPSG:3857'),
            radarUpdateInterval: 300000, // 5 minutes
            alertsUpdateInterval: 60000,  // 1 minute
            animationFrames: 10,
            animationSpeed: 500 // ms between frames
        };
    }

    /**
     * Initialize the weather radar application
     */
    async init() {
        try {
            console.log('Initializing NEXRAD Weather Radar Application...');
            
            // Initialize settings first
            this.settingsManager = new SettingsManager();
            await this.settingsManager.init();
            
            // Apply user settings to config
            this.applyUserSettings();
            
            // Initialize the map
            this.initializeMap();
            
            // Initialize all modules
            await this.initializeModules();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize geolocation if permitted
            this.initializeGeolocation();
            
            // Handle initial route
            this.handleRouting();
            
            // Start data updates
            this.startDataUpdates();
            
            this.isInitialized = true;
            console.log('Weather Radar Application initialized successfully');
            
            // Dispatch ready event
            this.dispatchEvent('app:ready', { app: this });
            
        } catch (error) {
            console.error('Failed to initialize Weather Radar Application:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Initialize the OpenLayers map
     */
    initializeMap() {
        const view = new View({
            center: fromLonLat(this.config.defaultCenter),
            zoom: this.config.defaultZoom,
            minZoom: this.config.minZoom,
            maxZoom: this.config.maxZoom,
            extent: this.config.extent,
            enableRotation: true,
            constrainResolution: true
        });

        this.map = new Map({
            target: 'map',
            view: view,
            controls: defaultControls({
                attribution: true,
                zoom: true,
                rotate: true
            }).extend([
                new ZoomSlider(),
                new ScaleLine({
                    units: 'us',
                    bar: true,
                    steps: 4,
                    text: true,
                    minWidth: 140
                })
            ]),
            interactions: defaultInteractions({
                doubleClickZoom: true,
                dragPan: true,
                dragRotate: false,
                dragZoom: true,
                keyboard: true,
                mouseWheelZoom: true,
                pointer: true,
                select: true
            }).extend([
                new DragRotateAndZoom()
            ])
        });

        // Add map event listeners
        this.map.on('moveend', (event) => {
            this.onMapMoveEnd(event);
        });

        this.map.on('singleclick', (event) => {
            this.onMapClick(event);
        });

        console.log('OpenLayers map initialized');
    }

    /**
     * Initialize all application modules
     */
    async initializeModules() {
        // Initialize layer manager
        this.layerManager = new LayerManager(this.map, this.config);
        await this.layerManager.init();

        // Initialize radar controller
        this.radarController = new RadarController(this.map, this.layerManager, this.config);
        await this.radarController.init();

        // Initialize weather alerts manager
        this.alertsManager = new WeatherAlertsManager(this.map, this.layerManager, this.config);
        await this.alertsManager.init();

        // Initialize timeline controller
        this.timelineController = new TimelineController(this.radarController, this.config);
        await this.timelineController.init();

        // Initialize UI controller
        this.uiController = new UIController(this);
        await this.uiController.init();

        // Initialize geolocation service
        this.geolocationService = new GeolocationService(this.map);

        console.log('All modules initialized successfully');
    }

    /**
     * Apply user settings to application configuration
     */
    applyUserSettings() {
        const settings = this.settingsManager.getSettings();
        
        // Apply display settings
        if (settings.display.units === 'metric') {
            this.config.units = 'metric';
        }
        
        // Apply animation settings
        this.config.animationSpeed = settings.animation.speed;
        this.config.animationFrames = settings.animation.frames;
        
        // Apply update intervals
        this.config.radarUpdateInterval = settings.updates.radarInterval * 1000;
        this.config.alertsUpdateInterval = settings.updates.alertsInterval * 1000;
        
        console.log('User settings applied to configuration');
    }

    /**
     * Set up application event listeners
     */
    setupEventListeners() {
        // Window events
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });

        // Module events
        this.radarController.on('radar:updated', (event) => {
            this.onRadarUpdated(event);
        });

        this.alertsManager.on('alerts:updated', (event) => {
            this.onAlertsUpdated(event);
        });

        this.timelineController.on('timeline:changed', (event) => {
            this.onTimelineChanged(event);
        });

        console.log('Event listeners set up');
    }

    /**
     * Initialize geolocation service
     */
    async initializeGeolocation() {
        try {
            const settings = this.settingsManager.getSettings();
            if (settings.location.autoLocate) {
                await this.geolocationService.getCurrentLocation();
                console.log('Geolocation initialized');
            }
        } catch (error) {
            console.warn('Geolocation initialization failed:', error);
        }
    }

    /**
     * Handle application routing based on URL hash
     */
    handleRouting() {
        const hash = window.location.hash.substring(1);
        
        switch (hash) {
            case 'current':
                this.setView('current');
                break;
            case 'animation':
                this.setView('animation');
                break;
            case 'alerts':
                this.setView('alerts');
                break;
            default:
                this.setView('current');
        }

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleRouting();
        });
    }

    /**
     * Start automated data updates
     */
    startDataUpdates() {
        // Radar data updates
        this.radarUpdateTimer = setInterval(() => {
            this.radarController.updateRadarData();
        }, this.config.radarUpdateInterval);

        // Weather alerts updates
        this.alertsUpdateTimer = setInterval(() => {
            this.alertsManager.updateAlerts();
        }, this.config.alertsUpdateInterval);

        console.log('Automated data updates started');
    }

    /**
     * Set the current application view
     * @param {string} view - The view to set (current, animation, alerts)
     */
    setView(view) {
        if (this.currentView === view) return;
        
        this.currentView = view;
        this.uiController.setActiveView(view);
        
        switch (view) {
            case 'current':
                this.radarController.showCurrentRadar();
                this.timelineController.stop();
                break;
            case 'animation':
                this.timelineController.start();
                break;
            case 'alerts':
                this.alertsManager.highlightAlerts();
                break;
        }

        // Update URL hash
        window.location.hash = view;
        
        this.dispatchEvent('view:changed', { view });
        console.log(`View changed to: ${view}`);
    }

    /**
     * Handle map move end events
     */
    onMapMoveEnd(event) {
        const view = event.map.getView();
        const center = view.getCenter();
        const zoom = view.getZoom();
        
        // Update layers based on zoom level
        this.layerManager.updateLayersForZoom(zoom);
        
        // Dispatch event for other modules
        this.dispatchEvent('map:moved', { center, zoom });
    }

    /**
     * Handle map click events
     */
    onMapClick(event) {
        const coordinate = event.coordinate;
        const pixel = event.pixel;
        
        // Get features at click location
        const features = this.map.getFeaturesAtPixel(pixel);
        
        if (features.length > 0) {
            this.uiController.showFeatureInfo(features, coordinate);
        }
        
        this.dispatchEvent('map:clicked', { coordinate, pixel, features });
    }

    /**
     * Handle radar data updates
     */
    onRadarUpdated(event) {
        this.uiController.updateRadarInfo(event.data);
        this.dispatchEvent('radar:updated', event);
    }

    /**
     * Handle weather alerts updates
     */
    onAlertsUpdated(event) {
        this.uiController.updateAlertsInfo(event.data);
        this.dispatchEvent('alerts:updated', event);
    }

    /**
     * Handle timeline changes
     */
    onTimelineChanged(event) {
        this.uiController.updateTimelineInfo(event.data);
        this.dispatchEvent('timeline:changed', event);
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Check if user is typing in an input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.key) {
            case '1':
                this.setView('current');
                break;
            case '2':
                this.setView('animation');
                break;
            case '3':
                this.setView('alerts');
                break;
            case ' ':
                event.preventDefault();
                this.timelineController.togglePlayback();
                break;
            case 'l':
                this.geolocationService.centerOnLocation();
                break;
            case 'r':
                this.radarController.refreshRadarData();
                break;
            case 'f':
                this.uiController.toggleFullscreen();
                break;
            case 'Escape':
                this.uiController.closeAllModals();
                break;
        }
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        if (this.map) {
            this.map.updateSize();
        }
        this.uiController.handleResize();
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('Application initialization failed:', error);
        
        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.className = 'init-error';
        errorMessage.innerHTML = `
            <h3>Failed to Initialize Weather Radar</h3>
            <p>The application failed to start properly. Please refresh the page and try again.</p>
            <p class="error-details">${error.message}</p>
            <button onclick="window.location.reload()">Reload Application</button>
        `;
        
        document.body.appendChild(errorMessage);
    }

    /**
     * Dispatch custom events
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Clean up resources when application is closing
     */
    cleanup() {
        if (this.radarUpdateTimer) {
            clearInterval(this.radarUpdateTimer);
        }
        
        if (this.alertsUpdateTimer) {
            clearInterval(this.alertsUpdateTimer);
        }
        
        if (this.radarController) {
            this.radarController.cleanup();
        }
        
        if (this.timelineController) {
            this.timelineController.cleanup();
        }
        
        console.log('Application cleanup completed');
    }

    /**
     * Get current application state
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            currentView: this.currentView,
            mapCenter: this.map ? this.map.getView().getCenter() : null,
            mapZoom: this.map ? this.map.getView().getZoom() : null,
            settings: this.settingsManager ? this.settingsManager.getSettings() : null
        };
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.weatherRadarApp = new WeatherRadarApp();
        await window.weatherRadarApp.init();
    } catch (error) {
        console.error('Failed to start Weather Radar Application:', error);
    }
});

// Export for module usage
export default WeatherRadarApp;
