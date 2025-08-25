/**
 * Weather Radar Main Application
 * Production-ready weather radar application using the core module
 * @version 3.0.0
 */

import { WeatherRadarCore } from '../core/weather-radar-core.js';

/**
 * Main Weather Radar Application
 * Handles application lifecycle and provides public API
 */
class WeatherRadarApp {
    constructor(config = {}) {
        this.core = null;
        this.config = {
            target: 'main-map',
            autoInit: true,
            enableGeolocation: true,
            enableControls: true,
            ...config
        };

        this.isReady = false;
        this.eventListeners = new Map();

        console.log('🌦️ Weather Radar App initialized with config:', this.config);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Starting Weather Radar Application...');

            // Create core instance
            this.core = new WeatherRadarCore(this.config);

            // Set up event forwarding
            this.setupEventForwarding();

            // Initialize core
            await this.core.initialize();

            this.isReady = true;
            console.log('✅ Weather Radar Application ready!');

            // Emit ready event
            this.emit('ready', { app: this });

            return this;

        } catch (error) {
            console.error('❌ Weather Radar App initialization failed:', error);
            this.emit('error', { error, app: this });
            throw error;
        }
    }

    /**
     * Set up event forwarding from core to app
     */
    setupEventForwarding() {
        // Forward all core events to app level
        document.addEventListener('weatherradar:initialized', (e) => {
            this.emit('initialized', e.detail);
        });

        document.addEventListener('weatherradar:map:clicked', (e) => {
            this.emit('mapClicked', e.detail);
        });

        document.addEventListener('weatherradar:map:moved', (e) => {
            this.emit('mapMoved', e.detail);
        });

        document.addEventListener('weatherradar:layer:toggled', (e) => {
            this.emit('layerToggled', e.detail);
        });

        document.addEventListener('weatherradar:location:found', (e) => {
            this.emit('locationFound', e.detail);
        });

        document.addEventListener('weatherradar:error', (e) => {
            this.emit('error', e.detail);
        });
    }

    /**
     * Get the map instance
     */
    getMap() {
        return this.core ? this.core.map : null;
    }

    /**
     * Get application state
     */
    getState() {
        return this.core ? this.core.getState() : null;
    }

    /**
     * Center map on location
     */
    centerOnLocation() {
        if (this.core) {
            this.core.centerOnLocation();
        }
    }

    /**
     * Switch base layer
     */
    switchBaseLayer(layerType) {
        if (this.core) {
            this.core.switchBaseLayer(layerType);
        }
    }

    /**
     * Set radar type
     */
    setRadarType(radarType) {
        if (this.core) {
            this.core.setRadarType(radarType);
        }
    }

    /**
     * Toggle layer visibility
     */
    toggleLayer(layerKey) {
        if (this.core?.layers?.[layerKey]) {
            const layer = this.core.layers[layerKey];
            const visible = !layer.getVisible();
            layer.setVisible(visible);
            this.emit('layerToggled', { layer: layerKey, visible });
        }
    }

    /**
     * Set layer opacity
     */
    setLayerOpacity(layerKey, opacity) {
        if (this.core?.layers?.[layerKey]) {
            this.core.layers[layerKey].setOpacity(opacity);
            this.emit('layerOpacity', { layer: layerKey, opacity });
        }
    }

    /**
     * Add event listener
     */
    on(eventName, handler) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(handler);
    }

    /**
     * Remove event listener
     */
    off(eventName, handler) {
        if (this.eventListeners.has(eventName)) {
            const handlers = this.eventListeners.get(eventName);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Emit event
     */
    emit(eventName, data = {}) {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * Clean up and dispose of resources
     */
    destroy() {
        if (this.core) {
            this.core.cleanup();
            this.core = null;
        }

        this.eventListeners.clear();
        this.isReady = false;

        console.log('🧹 Weather Radar App destroyed');
        this.emit('destroyed', { app: this });
    }
}

// Global instance for backward compatibility
let globalWeatherRadarApp = null;

/**
 * Initialize weather radar application
 */
async function initWeatherRadar(config = {}) {
    try {
        globalWeatherRadarApp = new WeatherRadarApp(config);
        await globalWeatherRadarApp.init();
        return globalWeatherRadarApp;
    } catch (error) {
        console.error('Failed to initialize weather radar:', error);
        throw error;
    }
}

// Auto-initialize when DOM is ready (if not disabled)
document.addEventListener('DOMContentLoaded', async () => {
    // Check if auto-init is disabled
    if (window.WEATHER_RADAR_NO_AUTO_INIT) {
        console.log('🔧 Auto-initialization disabled');
        return;
    }

    console.log('📄 DOM loaded, initializing weather radar application...');

    try {
        await initWeatherRadar();

        // Make globally available for debugging and backward compatibility
        window.weatherRadarApp = globalWeatherRadarApp;
        window.mainWeatherRadarApp = globalWeatherRadarApp;

    } catch (error) {
        console.error('❌ Failed to auto-initialize weather radar:', error);
    }
});

// Export for module usage
export { initWeatherRadar, WeatherRadarApp };
export default WeatherRadarApp;
