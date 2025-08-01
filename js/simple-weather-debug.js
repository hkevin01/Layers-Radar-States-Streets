/**
 * Simple Weather Radar Debug Application
 * Simplified version for debugging initialization issues
 */

import { Map, View } from 'https://cdn.skypack.dev/ol';
import { defaults as defaultControls } from 'https://cdn.skypack.dev/ol/control';
import { TileLayer } from 'https://cdn.skypack.dev/ol/layer';
import { fromLonLat } from 'https://cdn.skypack.dev/ol/proj';
import { OSM } from 'https://cdn.skypack.dev/ol/source';

class SimpleWeatherRadarApp {
    constructor() {
        this.map = null;
        this.initialized = false;
        
        console.log('🌦️ SimpleWeatherRadarApp constructor called');
    }

    async init() {
        try {
            console.log('🚀 Starting simple weather radar initialization...');
            
            // Step 1: Create basic map
            console.log('📍 Step 1: Creating basic map...');
            await this.createBasicMap();
            
            // Step 2: Test module loading
            console.log('📦 Step 2: Testing module loading...');
            await this.testModuleLoading();
            
            // Step 3: Hide loading screen
            console.log('✨ Step 3: Hiding loading screen...');
            this.hideLoadingScreen();
            
            this.initialized = true;
            console.log('✅ Simple weather radar app initialized successfully!');
            
        } catch (error) {
            console.error('❌ Simple app initialization failed:', error);
            this.showError(error);
        }
    }

    async createBasicMap() {
        try {
            // Create map container if it doesn't exist
            let mapContainer = document.getElementById('map');
            if (!mapContainer) {
                console.log('📍 Creating map container...');
                mapContainer = document.createElement('div');
                mapContainer.id = 'map';
                mapContainer.style.width = '100%';
                mapContainer.style.height = '400px';
                mapContainer.style.border = '2px solid #3b82f6';
                document.body.appendChild(mapContainer);
            }

            // Create basic OpenLayers map
            this.map = new Map({
                target: 'map',
                layers: [
                    new TileLayer({
                        source: new OSM()
                    })
                ],
                view: new View({
                    center: fromLonLat([-98.5795, 39.8283]), // Center of US
                    zoom: 4
                }),
                controls: defaultControls()
            });

            console.log('✅ Basic map created successfully');
            
            // Test map interaction
            this.map.on('singleclick', (event) => {
                const coords = event.coordinate;
                console.log('🖱️ Map clicked at:', coords);
            });

        } catch (error) {
            console.error('❌ Failed to create basic map:', error);
            throw error;
        }
    }

    async testModuleLoading() {
        const modules = [
            'layer-manager',
            'radar-controller', 
            'weather-alerts',
            'timeline-controller',
            'ui-controller',
            'geolocation-service',
            'settings-manager'
        ];

        console.log('🧪 Testing individual module imports...');
        
        for (const moduleName of modules) {
            try {
                console.log(`  Testing ${moduleName}...`);
                const module = await import(`./modules/${moduleName}.js`);
                
                // Check if the module exports what we expect
                const exportNames = Object.keys(module);
                console.log(`  ✅ ${moduleName} loaded. Exports:`, exportNames);
                
                // Try to instantiate the main class if it exists
                const mainClass = this.getMainClassFromModule(module, moduleName);
                if (mainClass) {
                    console.log(`  ✅ ${moduleName} main class found:`, mainClass.name);
                }
                
            } catch (error) {
                console.error(`  ❌ ${moduleName} failed:`, error.message);
                console.error(`  Full error:`, error);
            }
        }
    }

    getMainClassFromModule(module, moduleName) {
        // Try to find the main class based on naming conventions
        const className = moduleName.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');
        
        return module[className] || module.default || null;
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            console.log('✅ Loading screen hidden');
        } else {
            console.log('ℹ️ No loading screen found to hide');
        }
    }

    showError(error) {
        // Create error display if loading screen exists
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #ef4444;">
                    <h2>❌ Initialization Failed</h2>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; text-align: left; overflow: auto; max-height: 200px;">${error.stack}</pre>
                    <button onclick="window.location.reload()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                        Reload Page
                    </button>
                </div>
            `;
        } else {
            // Create error overlay
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.9); color: white; padding: 20px;
                display: flex; align-items: center; justify-content: center;
                z-index: 10000; font-family: monospace;
            `;
            errorDiv.innerHTML = `
                <div style="max-width: 600px; text-align: center;">
                    <h2>❌ Weather Radar Initialization Failed</h2>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; text-align: left; overflow: auto; max-height: 200px;">${error.stack}</pre>
                    <button onclick="window.location.reload()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                        Reload Page
                    </button>
                </div>
            `;
            document.body.appendChild(errorDiv);
        }
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌍 DOM loaded, starting simple weather radar app...');
    
    try {
        window.simpleWeatherRadarApp = new SimpleWeatherRadarApp();
        await window.simpleWeatherRadarApp.init();
    } catch (error) {
        console.error('💥 Critical failure:', error);
    }
});

// Global error handlers
window.addEventListener('error', (event) => {
    console.error('🌍 Global Error:', event.error);
    console.error('📍 Location:', `${event.filename}:${event.lineno}:${event.colno}`);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🔄 Unhandled Promise Rejection:', event.reason);
});

export default SimpleWeatherRadarApp;
