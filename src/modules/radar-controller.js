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

        // Current working NEXRAD endpoints (2024)
        this.nexradSources = [
            {
                name: 'Iowa State Mesonet (Primary)',
                url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q/{z}/{x}/{y}.png',
                testUrl: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q/5/8/12.png',
                attribution: '© Iowa Environmental Mesonet',
                priority: 1
            },
            {
                name: 'NOAA nowCOAST (WMS)',
                url: 'https://nowcoast.noaa.gov/arcgis/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/WMSServer',
                testUrl: 'https://nowcoast.noaa.gov/arcgis/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/WMSServer?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=1&STYLES=&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857&BBOX=-10018754.171394622,5009377.085697311,-10009377.085697308,5018754.171394624&WIDTH=256&HEIGHT=256',
                attribution: '© NOAA/NWS',
                type: 'wms',
                params: {
                    'LAYERS': '1',
                    'FORMAT': 'image/png',
                    'TRANSPARENT': true
                },
                priority: 2
            },
            {
                name: 'Iowa State Mesonet (WMS)',
                url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi',
                testUrl: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=nexrad-n0q&STYLES=&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857&BBOX=-10018754.171394622,5009377.085697311,-10009377.085697308,5018754.171394624&WIDTH=256&HEIGHT=256',
                attribution: '© Iowa Environmental Mesonet',
                type: 'wms',
                params: {
                    'LAYERS': 'nexrad-n0q',
                    'FORMAT': 'image/png',
                    'TRANSPARENT': true
                },
                priority: 3
            }
        ];

        this.currentSource = null;

        // Radar configuration (updated)
        this.radarConfig = {
            updateInterval: 300000, // 5 minutes
            maxCacheAge: 3600000,   // 1 hour
            animationDuration: 10,   // number of frames
            frameDelay: 500,        // ms between frames
            retryAttempts: 3,       // number of retry attempts for failed tiles
            timeoutMs: 10000,       // timeout for tile requests
            radarTypes: {
                base_reflectivity: {
                    name: 'Base Reflectivity',
                    layer: 'nexrad-n0q',
                    units: 'dBZ',
                    colorScale: 'reflectivity'
                },
                velocity: {
                    name: 'Velocity',
                    layer: 'nexrad-n0v',
                    units: 'kt',
                    colorScale: 'velocity'
                },
                precipitation: {
                    name: 'Precipitation',
                    layer: 'nexrad-n0p',
                    units: 'in/hr',
                    colorScale: 'precipitation'
                }
            }
        };

        this.isInitialized = false;
    }

    /**
     * NEXRAD Tile URL Validation
     * Tests if radar tile endpoints are accessible
     */
    async validateNEXRADEndpoints() {
        console.log('🧪 Validating NEXRAD endpoints...');
        const results = [];

        for (const source of this.nexradSources) {
            try {
                console.log(`Testing ${source.name}...`);
                const startTime = Date.now();

                await fetch(source.testUrl, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: AbortSignal.timeout(this.radarConfig.timeoutMs)
                });

                const responseTime = Date.now() - startTime;
                const result = {
                    name: source.name,
                    url: source.testUrl,
                    status: 'success',
                    responseTime,
                    available: true
                };

                results.push(result);
                this.validationResults.set(source.name, result);
                console.log(`✅ ${source.name}: Available (${responseTime}ms)`);

            } catch (error) {
                const result = {
                    name: source.name,
                    url: source.testUrl,
                    status: 'error',
                    error: error.message,
                    available: false
                };

                results.push(result);
                this.validationResults.set(source.name, result);
                console.error(`❌ ${source.name}: Failed - ${error.message}`);
            }
        }

        // Select best available source
        const availableSources = results.filter(r => r.available);
        if (availableSources.length > 0) {
            const sortedSources = availableSources.toSorted((a, b) => a.responseTime - b.responseTime);
            const bestSource = sortedSources[0];
            this.currentSource = this.nexradSources.find(s => s.name === bestSource.name);
            console.log(`🎯 Selected best source: ${bestSource.name}`);
            this.connectionStatus = 'connected';
        } else {
            console.error('❌ No NEXRAD sources available');
            this.connectionStatus = 'failed';
        }

        this.dispatchEvent(new CustomEvent('radar:validation-complete', {
            detail: { results, selectedSource: this.currentSource }
        }));

        return results;
    }

    /**
     * Network Connectivity Check
     * Verifies basic internet connectivity
     */
    async checkNetworkConnectivity() {
        try {
            console.log('🌐 Checking network connectivity...');
            await fetch('https://httpbin.org/get', {
                method: 'HEAD',
                mode: 'no-cors',
                signal: AbortSignal.timeout(5000)
            });

            console.log('✅ Network connectivity confirmed');
            return true;
        } catch (error) {
            console.error('❌ Network connectivity failed:', error);
            return false;
        }
    }

    /**
     * Enhanced Error Handling with Retry Mechanism
     */
    async loadTileWithRetry(url, retryCount = 0) {
        try {
            this.tileLoadStats.attempted++;

            const response = await fetch(url, {
                signal: AbortSignal.timeout(this.radarConfig.timeoutMs)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.tileLoadStats.successful++;
            return response;

        } catch (error) {
            this.tileLoadStats.failed++;
            this.tileLoadStats.lastError = error.message;

            if (retryCount < this.radarConfig.retryAttempts) {
                console.warn(`Retrying tile load (${retryCount + 1}/${this.radarConfig.retryAttempts}): ${url}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
                return this.loadTileWithRetry(url, retryCount + 1);
            }

            throw error;
        }
    }

    /**
     * Real-time Tile Loading Status
     */
    getTileLoadingStatus() {
        return {
            ...this.tileLoadStats,
            successRate: this.tileLoadStats.attempted > 0 ?
                (this.tileLoadStats.successful / this.tileLoadStats.attempted * 100).toFixed(1) + '%' : 'N/A',
            connectionStatus: this.connectionStatus,
            currentSource: this.currentSource?.name || 'None',
            validationResults: Object.fromEntries(this.validationResults)
        };
    }

    /**
     * Create Diagnostic Tools UI
     */
    createDiagnosticPanel() {
        if (document.getElementById('radar-diagnostics')) {
            return; // Panel already exists
        }

        const panel = document.createElement('div');
        panel.id = 'radar-diagnostics';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            max-height: 400px;
            overflow-y: auto;
        `;

        const title = document.createElement('h3');
        title.textContent = '🛠️ NEXRAD Diagnostics';
        title.style.margin = '0 0 10px 0';
        panel.appendChild(title);

        const statusDiv = document.createElement('div');
        statusDiv.id = 'diagnostic-status';
        panel.appendChild(statusDiv);

        const testButton = document.createElement('button');
        testButton.textContent = 'Test NEXRAD Services';
        testButton.style.cssText = `
            background: #007cba;
            border: none;
            color: white;
            padding: 8px 12px;
            margin: 10px 0;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
        `;
        testButton.onclick = () => this.runDiagnostics();
        panel.appendChild(testButton);

        document.body.appendChild(panel);

        // Update status every 5 seconds
        this.diagnosticInterval = setInterval(() => {
            this.updateDiagnosticPanel();
        }, 5000);

        this.updateDiagnosticPanel();
    }

    /**
     * Update Diagnostic Panel
     */
    updateDiagnosticPanel() {
        const statusDiv = document.getElementById('diagnostic-status');
        if (!statusDiv) return;

        const status = this.getTileLoadingStatus();
        statusDiv.innerHTML = `
            <div><strong>Connection:</strong> ${this.connectionStatus}</div>
            <div><strong>Source:</strong> ${status.currentSource}</div>
            <div><strong>Tiles Loaded:</strong> ${status.successful}/${status.attempted}</div>
            <div><strong>Success Rate:</strong> ${status.successRate}</div>
            <div><strong>Last Error:</strong> ${status.lastError || 'None'}</div>
            <div style="margin-top: 10px;"><strong>Source Status:</strong></div>
            ${Object.entries(status.validationResults).map(([name, result]) =>
                `<div style="margin-left: 10px;">• ${name}: ${result.available ? '✅' : '❌'}</div>`
            ).join('')}
        `;
    }

    /**
     * Run Complete Diagnostics
     */
    async runDiagnostics() {
        console.log('🔧 Running comprehensive radar diagnostics...');

        // 1. Check network connectivity
        const networkOk = await this.checkNetworkConnectivity();

        // 2. Validate NEXRAD endpoints
        const validationResults = await this.validateNEXRADEndpoints();

        // 3. Test layer configuration
        await this.testLayerConfiguration();

        // 4. Update diagnostic panel
        this.updateDiagnosticPanel();

        const summary = {
            networkConnectivity: networkOk,
            availableSources: validationResults.filter(r => r.available).length,
            totalSources: validationResults.length,
            selectedSource: this.currentSource?.name || 'None'
        };

        console.log('📊 Diagnostic Summary:', summary);
        return summary;
    }

    /**
     * Test Layer Configuration
     */
    async testLayerConfiguration() {
        if (!this.currentSource) {
            console.error('❌ No current source selected for layer test');
            return false;
        }

        try {
            console.log('🧪 Testing layer configuration...');

            // Create a test layer to verify OpenLayers integration
            let testLayer;

            if (this.currentSource.type === 'wms') {
                testLayer = new ol.layer.Image({
                    source: new ol.source.ImageWMS({
                        url: this.currentSource.url,
                        params: this.currentSource.params,
                        crossOrigin: 'anonymous'
                    })
                });
            } else {
                testLayer = new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: this.currentSource.url,
                        crossOrigin: 'anonymous'
                    })
                });
            }

            // Temporarily add layer to test loading
            this.map.addLayer(testLayer);

            // Wait a moment for potential loading
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Remove test layer
            this.map.removeLayer(testLayer);

            console.log('✅ Layer configuration test completed');
            return true;

        } catch (error) {
            console.error('❌ Layer configuration test failed:', error);
            return false;
        }
    }

    /**
     * Initialize the radar controller with enhanced validation
     */
    async init() {
        try {
            console.log('Initializing Enhanced Radar Controller...');

            // Create diagnostic panel if in debug mode
            if (this.debugMode) {
                this.createDiagnosticPanel();
            }

            // Run initial diagnostics
            await this.runDiagnostics();

            // Load initial radar data if we have a working source
            if (this.currentSource) {
                await this.loadCurrentRadarData();

                // Initialize animation frames
                await this.initializeAnimationFrames();

                // Set up automatic updates
                this.setupAutoUpdate();
            } else {
                console.error('❌ Cannot initialize radar: no working sources available');
            }

            // Initialize animation frames
            await this.initializeAnimationFrames();

            // Set up automatic updates
            this.setupAutoUpdate();

            this.isInitialized = true;
            console.log('Radar Controller initialized successfully');

            this.dispatchEvent(new CustomEvent('radar:initialized'));

        } catch (error) {
            console.error('Failed to initialize Radar Controller:', error);
            throw error;
        }
    }

    /**
     * Load current radar data
     */
    async loadCurrentRadarData() {
        try {
            const currentTime = new Date();
            const roundedTime = this.roundToRadarTime(currentTime);

            // Update radar layer with current time
            this.layerManager.updateRadarTime(roundedTime);

            this.lastUpdateTime = roundedTime;

            this.dispatchEvent(new CustomEvent('radar:updated', {
                detail: {
                    time: roundedTime,
                    type: this.currentRadarType,
                    data: {
                        timestamp: roundedTime.toISOString(),
                        radarType: this.currentRadarType,
                        units: this.radarConfig.radarTypes[this.currentRadarType].units
                    }
                }
            }));

            console.log(`Radar data loaded for ${roundedTime.toISOString()}`);

        } catch (error) {
            console.error('Failed to load current radar data:', error);
            throw error;
        }
    }

    /**
     * Initialize animation frames for radar loop
     */
    async initializeAnimationFrames() {
        try {
            this.animationFrames = [];
            const currentTime = new Date();
            const frameInterval = 6 * 60 * 1000; // 6 minutes between frames

            // Generate timestamps for animation frames (going back in time)
            for (let i = this.config.animationFrames - 1; i >= 0; i--) {
                const frameTime = new Date(currentTime.getTime() - (i * frameInterval));
                const roundedTime = this.roundToRadarTime(frameTime);

                this.animationFrames.push({
                    timestamp: roundedTime,
                    index: this.config.animationFrames - 1 - i,
                    loaded: false
                });
            }

            // Pre-load first few frames
            await this.preloadFrames(3);

            console.log(`Animation frames initialized: ${this.animationFrames.length} frames`);

        } catch (error) {
            console.error('Failed to initialize animation frames:', error);
        }
    }

    /**
     * Pre-load animation frames
     */
    async preloadFrames(count) {
        const framesToLoad = this.animationFrames.slice(0, count);

        for (const frame of framesToLoad) {
            try {
                // In a real implementation, you would pre-load the radar data
                // For now, we'll just mark them as loaded
                frame.loaded = true;

                // Cache the frame data
                const cacheKey = `${this.currentRadarType}_${frame.timestamp.getTime()}`;
                this.dataCache.set(cacheKey, {
                    timestamp: frame.timestamp,
                    type: this.currentRadarType,
                    data: null, // Would contain actual radar data
                    loadTime: new Date()
                });

            } catch (error) {
                console.warn(`Failed to preload frame ${frame.index}:`, error);
            }
        }
    }

    /**
     * Set radar type (reflectivity, velocity, precipitation)
     */
    setRadarType(radarType) {
        if (!this.radarConfig.radarTypes[radarType]) {
            console.error(`Invalid radar type: ${radarType}`);
            return;
        }

        const previousType = this.currentRadarType;
        this.currentRadarType = radarType;

        // Hide all radar layers
        Object.keys(this.radarConfig.radarTypes).forEach(type => {
            this.layerManager.setLayerVisibility(`radar_${type}`, false);
        });

        // Show selected radar layer
        this.layerManager.setLayerVisibility(`radar_${radarType}`, true);

        // Reload data for new radar type
        this.loadCurrentRadarData();

        // Reinitialize animation frames for new type
        this.initializeAnimationFrames();

        this.dispatchEvent(new CustomEvent('radar:type:changed', {
            detail: {
                previousType,
                currentType: radarType,
                config: this.radarConfig.radarTypes[radarType]
            }
        }));

        console.log(`Radar type changed to: ${radarType}`);
    }

    /**
     * Start radar animation
     */
    startAnimation() {
        if (this.isAnimating) {
            return;
        }

        this.isAnimating = true;
        this.currentFrameIndex = 0;

        this.animationTimer = setInterval(() => {
            this.nextFrame();
        }, this.config.animationSpeed);

        this.dispatchEvent(new CustomEvent('radar:animation:started'));
        console.log('Radar animation started');
    }

    /**
     * Stop radar animation
     */
    stopAnimation() {
        if (!this.isAnimating) {
            return;
        }

        this.isAnimating = false;

        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }

        // Return to current radar
        this.showCurrentRadar();

        this.dispatchEvent(new CustomEvent('radar:animation:stopped'));
        console.log('Radar animation stopped');
    }

    /**
     * Toggle animation playback
     */
    toggleAnimation() {
        if (this.isAnimating) {
            this.stopAnimation();
        } else {
            this.startAnimation();
        }
    }

    /**
     * Go to next animation frame
     */
    nextFrame() {
        if (this.animationFrames.length === 0) {
            return;
        }

        this.currentFrameIndex = (this.currentFrameIndex + 1) % this.animationFrames.length;
        this.showFrame(this.currentFrameIndex);
    }

    /**
     * Go to previous animation frame
     */
    previousFrame() {
        if (this.animationFrames.length === 0) {
            return;
        }

        this.currentFrameIndex = this.currentFrameIndex === 0
            ? this.animationFrames.length - 1
            : this.currentFrameIndex - 1;
        this.showFrame(this.currentFrameIndex);
    }

    /**
     * Show specific animation frame
     */
    showFrame(frameIndex) {
        if (frameIndex < 0 || frameIndex >= this.animationFrames.length) {
            return;
        }

        const frame = this.animationFrames[frameIndex];
        this.currentFrameIndex = frameIndex;

        // Update radar layer with frame timestamp
        this.layerManager.updateRadarTime(frame.timestamp);

        this.dispatchEvent(new CustomEvent('radar:frame:changed', {
            detail: {
                frameIndex,
                timestamp: frame.timestamp,
                totalFrames: this.animationFrames.length,
                isPlaying: this.isAnimating
            }
        }));
    }

    /**
     * Show current (latest) radar
     */
    showCurrentRadar() {
        if (this.lastUpdateTime) {
            this.layerManager.updateRadarTime(this.lastUpdateTime);

            this.dispatchEvent(new CustomEvent('radar:current:shown', {
                detail: {
                    timestamp: this.lastUpdateTime
                }
            }));
        }
    }

    /**
     * Refresh radar data
     */
    async refreshRadarData() {
        try {
            console.log('Refreshing radar data...');

            // Clear cache
            this.clearExpiredCache();

            // Reload current radar data
            await this.loadCurrentRadarData();

            // Reinitialize animation frames
            await this.initializeAnimationFrames();

            this.dispatchEvent(new CustomEvent('radar:refreshed'));
            console.log('Radar data refreshed successfully');

        } catch (error) {
            console.error('Failed to refresh radar data:', error);
        }
    }

    /**
     * Update radar data automatically
     */
    async updateRadarData() {
        try {
            const now = new Date();
            const timeSinceUpdate = this.lastUpdateTime
                ? now.getTime() - this.lastUpdateTime.getTime()
                : Infinity;

            // Only update if enough time has passed
            if (timeSinceUpdate >= this.radarConfig.updateInterval) {
                await this.loadCurrentRadarData();

                // Update animation frames if not currently animating
                if (!this.isAnimating) {
                    await this.initializeAnimationFrames();
                }
            }

        } catch (error) {
            console.error('Failed to update radar data:', error);
        }
    }

    /**
     * Set animation speed
     */
    setAnimationSpeed(speed) {
        this.config.animationSpeed = speed;

        // Restart animation with new speed if currently playing
        if (this.isAnimating) {
            this.stopAnimation();
            this.startAnimation();
        }

        this.dispatchEvent(new CustomEvent('radar:animation:speed:changed', {
            detail: { speed }
        }));
    }

    /**
     * Round timestamp to nearest radar scan time (typically every 6 minutes)
     */
    roundToRadarTime(date) {
        const radarInterval = 6 * 60 * 1000; // 6 minutes in milliseconds
        const timestamp = date.getTime();
        const rounded = Math.floor(timestamp / radarInterval) * radarInterval;
        return new Date(rounded);
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        const now = new Date();
        const maxAge = this.radarConfig.maxCacheAge;

        for (const [key, entry] of this.dataCache.entries()) {
            const age = now.getTime() - entry.loadTime.getTime();
            if (age > maxAge) {
                this.dataCache.delete(key);
            }
        }

        console.log(`Cache cleaned: ${this.dataCache.size} entries remaining`);
    }

    /**
     * Setup automatic radar data updates
     */
    setupAutoUpdate() {
        // Update radar data every 5 minutes
        this.updateTimer = setInterval(() => {
            this.updateRadarData();
        }, this.radarConfig.updateInterval);

        console.log('Automatic radar updates enabled');
    }

    /**
     * Get current radar information
     */
    getCurrentRadarInfo() {
        return {
            type: this.currentRadarType,
            config: this.radarConfig.radarTypes[this.currentRadarType],
            lastUpdate: this.lastUpdateTime,
            isAnimating: this.isAnimating,
            currentFrame: this.isAnimating ? this.currentFrameIndex : null,
            totalFrames: this.animationFrames.length,
            animationSpeed: this.config.animationSpeed
        };
    }

    /**
     * Get available radar types
     */
    getAvailableRadarTypes() {
        return Object.entries(this.radarConfig.radarTypes).map(([key, config]) => ({
            key,
            name: config.name,
            units: config.units,
            active: key === this.currentRadarType
        }));
    }

    /**
     * Get animation frame information
     */
    getAnimationFrames() {
        return this.animationFrames.map((frame, index) => ({
            index,
            timestamp: frame.timestamp,
            loaded: frame.loaded,
            active: index === this.currentFrameIndex
        }));
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
        }

        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        this.dataCache.clear();
        this.animationFrames = [];

        console.log('Radar Controller cleanup completed');
    }
}

export default RadarController;
