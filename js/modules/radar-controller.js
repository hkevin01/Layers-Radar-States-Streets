/**
 * Radar Controller Module
 * Manages NEXRAD radar data loading, caching, and animation
 * @author NEXRAD Radar Team
 * @version 2.0.0
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
        
        // Radar configuration
        this.radarConfig = {
            updateInterval: 300000, // 5 minutes
            maxCacheAge: 3600000,   // 1 hour
            animationDuration: 10,   // number of frames
            frameDelay: 500,        // ms between frames
            radarTypes: {
                base_reflectivity: {
                    name: 'Base Reflectivity',
                    layer: 'nexrad-n0r-wmst',
                    units: 'dBZ',
                    colorScale: 'reflectivity'
                },
                velocity: {
                    name: 'Velocity',
                    layer: 'nexrad-n0v-wmst',
                    units: 'kt',
                    colorScale: 'velocity'
                },
                precipitation: {
                    name: 'Precipitation',
                    layer: 'nexrad-n0p-wmst',
                    units: 'in/hr',
                    colorScale: 'precipitation'
                }
            }
        };
        
        this.isInitialized = false;
    }

    /**
     * Initialize the radar controller
     */
    async init() {
        try {
            console.log('Initializing Radar Controller...');
            
            // Load initial radar data
            await this.loadCurrentRadarData();
            
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
