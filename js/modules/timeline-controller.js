/**
 * Timeline Controller Module
 * Manages radar animation timeline and playback controls
 * @author NEXRAD Radar Team
 * @version 2.0.0
 */

/**
 * Timeline Controller Class
 * Handles radar animation timeline, playback, and user controls
 */
export class TimelineController extends EventTarget {
    constructor(radarController, config) {
        super();
        this.radarController = radarController;
        this.config = config;
        
        this.isPlaying = false;
        this.isLooping = true;
        this.currentSpeed = config.animationSpeed || 500;
        this.availableSpeeds = [200, 350, 500, 750, 1000, 1500]; // milliseconds
        this.playbackTimer = null;
        
        // Timeline state
        this.currentFrame = 0;
        this.totalFrames = config.animationFrames || 10;
        this.frames = [];
        
        this.isInitialized = false;
    }

    /**
     * Initialize the timeline controller
     */
    async init() {
        try {
            console.log('Initializing Timeline Controller...');
            
            // Initialize timeline frames
            this.initializeFrames();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('Timeline Controller initialized successfully');
            
            this.dispatchEvent(new CustomEvent('timeline:initialized'));
            
        } catch (error) {
            console.error('Failed to initialize Timeline Controller:', error);
            throw error;
        }
    }

    /**
     * Initialize timeline frames
     */
    initializeFrames() {
        this.frames = [];
        const currentTime = new Date();
        const frameInterval = 6 * 60 * 1000; // 6 minutes between frames
        
        // Generate frame timestamps going back in time
        for (let i = this.totalFrames - 1; i >= 0; i--) {
            const frameTime = new Date(currentTime.getTime() - (i * frameInterval));
            
            this.frames.push({
                index: this.totalFrames - 1 - i,
                timestamp: frameTime,
                displayTime: this.formatFrameTime(frameTime),
                isLoaded: false,
                isCurrent: i === 0 // Latest frame is current
            });
        }
        
        // Set current frame to latest
        this.currentFrame = this.totalFrames - 1;
        
        console.log(`Timeline initialized with ${this.frames.length} frames`);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen to radar controller events
        this.radarController.addEventListener('radar:frame:changed', (event) => {
            this.onRadarFrameChanged(event.detail);
        });
        
        this.radarController.addEventListener('radar:animation:started', () => {
            this.isPlaying = true;
            this.dispatchTimelineEvent('timeline:play');
        });
        
        this.radarController.addEventListener('radar:animation:stopped', () => {
            this.isPlaying = false;
            this.dispatchTimelineEvent('timeline:pause');
        });
    }

    /**
     * Start timeline playback
     */
    start() {
        if (this.isPlaying) {
            return;
        }
        
        console.log('Starting timeline playback');
        this.radarController.startAnimation();
    }

    /**
     * Stop timeline playback
     */
    stop() {
        if (!this.isPlaying) {
            return;
        }
        
        console.log('Stopping timeline playback');
        this.radarController.stopAnimation();
    }

    /**
     * Toggle playback state
     */
    togglePlayback() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * Go to next frame
     */
    nextFrame() {
        this.radarController.nextFrame();
    }

    /**
     * Go to previous frame
     */
    previousFrame() {
        this.radarController.previousFrame();
    }

    /**
     * Go to specific frame
     */
    goToFrame(frameIndex) {
        if (frameIndex < 0 || frameIndex >= this.totalFrames) {
            console.warn(`Invalid frame index: ${frameIndex}`);
            return;
        }
        
        this.radarController.showFrame(frameIndex);
    }

    /**
     * Go to first frame
     */
    goToFirst() {
        this.goToFrame(0);
    }

    /**
     * Go to last frame (current)
     */
    goToLast() {
        this.goToFrame(this.totalFrames - 1);
    }

    /**
     * Set animation speed
     */
    setSpeed(speed) {
        if (!this.availableSpeeds.includes(speed)) {
            console.warn(`Invalid speed: ${speed}. Available speeds:`, this.availableSpeeds);
            return;
        }
        
        const wasPlaying = this.isPlaying;
        
        // Stop current animation
        if (this.isPlaying) {
            this.stop();
        }
        
        // Update speed
        this.currentSpeed = speed;
        this.radarController.setAnimationSpeed(speed);
        
        // Restart if was playing
        if (wasPlaying) {
            this.start();
        }
        
        this.dispatchTimelineEvent('timeline:speed:changed', { speed });
        console.log(`Animation speed set to ${speed}ms`);
    }

    /**
     * Increase animation speed
     */
    increaseSpeed() {
        const currentIndex = this.availableSpeeds.indexOf(this.currentSpeed);
        if (currentIndex > 0) {
            this.setSpeed(this.availableSpeeds[currentIndex - 1]);
        }
    }

    /**
     * Decrease animation speed
     */
    decreaseSpeed() {
        const currentIndex = this.availableSpeeds.indexOf(this.currentSpeed);
        if (currentIndex < this.availableSpeeds.length - 1) {
            this.setSpeed(this.availableSpeeds[currentIndex + 1]);
        }
    }

    /**
     * Toggle loop mode
     */
    toggleLoop() {
        this.isLooping = !this.isLooping;
        this.dispatchTimelineEvent('timeline:loop:changed', { isLooping: this.isLooping });
        console.log(`Loop mode ${this.isLooping ? 'enabled' : 'disabled'}`);
    }

    /**
     * Handle radar frame change events
     */
    onRadarFrameChanged(detail) {
        this.currentFrame = detail.frameIndex;
        
        // Update frame states
        this.frames.forEach((frame, index) => {
            frame.isCurrent = index === this.currentFrame;
        });
        
        this.dispatchTimelineEvent('timeline:frame:changed', {
            currentFrame: this.currentFrame,
            totalFrames: this.totalFrames,
            timestamp: detail.timestamp,
            isPlaying: this.isPlaying
        });
    }

    /**
     * Format frame timestamp for display
     */
    formatFrameTime(timestamp) {
        const now = new Date();
        const diff = now.getTime() - timestamp.getTime();
        const minutes = Math.floor(diff / (60 * 1000));
        
        if (minutes === 0) {
            return 'Now';
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m ago`;
        }
    }

    /**
     * Get timeline state for UI
     */
    getTimelineState() {
        return {
            isPlaying: this.isPlaying,
            isLooping: this.isLooping,
            currentFrame: this.currentFrame,
            totalFrames: this.totalFrames,
            currentSpeed: this.currentSpeed,
            availableSpeeds: this.availableSpeeds,
            frames: this.frames.map(frame => ({
                index: frame.index,
                timestamp: frame.timestamp,
                displayTime: frame.displayTime,
                isLoaded: frame.isLoaded,
                isCurrent: frame.isCurrent
            }))
        };
    }

    /**
     * Get current frame information
     */
    getCurrentFrameInfo() {
        if (this.currentFrame >= 0 && this.currentFrame < this.frames.length) {
            const frame = this.frames[this.currentFrame];
            return {
                index: frame.index,
                timestamp: frame.timestamp,
                displayTime: frame.displayTime,
                isLoaded: frame.isLoaded,
                progress: (this.currentFrame + 1) / this.totalFrames
            };
        }
        
        return null;
    }

    /**
     * Calculate playback progress percentage
     */
    getPlaybackProgress() {
        if (this.totalFrames === 0) {
            return 0;
        }
        
        return ((this.currentFrame + 1) / this.totalFrames) * 100;
    }

    /**
     * Get time remaining in current loop
     */
    getTimeRemaining() {
        if (!this.isPlaying) {
            return null;
        }
        
        const framesRemaining = this.totalFrames - this.currentFrame - 1;
        const timeRemaining = framesRemaining * this.currentSpeed;
        
        return {
            frames: framesRemaining,
            milliseconds: timeRemaining,
            seconds: Math.ceil(timeRemaining / 1000)
        };
    }

    /**
     * Seek to percentage of timeline
     */
    seekToPercent(percent) {
        const frameIndex = Math.floor((percent / 100) * this.totalFrames);
        const clampedIndex = Math.max(0, Math.min(frameIndex, this.totalFrames - 1));
        this.goToFrame(clampedIndex);
    }

    /**
     * Get available speed options for UI
     */
    getSpeedOptions() {
        return this.availableSpeeds.map(speed => ({
            value: speed,
            label: this.formatSpeedLabel(speed),
            active: speed === this.currentSpeed
        }));
    }

    /**
     * Format speed value for display
     */
    formatSpeedLabel(speed) {
        const fps = 1000 / speed;
        return `${fps.toFixed(1)} fps`;
    }

    /**
     * Update frame loading status
     */
    updateFrameLoadingStatus(frameIndex, isLoaded) {
        if (frameIndex >= 0 && frameIndex < this.frames.length) {
            this.frames[frameIndex].isLoaded = isLoaded;
            
            this.dispatchTimelineEvent('timeline:frame:loaded', {
                frameIndex,
                isLoaded
            });
        }
    }

    /**
     * Check if all frames are loaded
     */
    areAllFramesLoaded() {
        return this.frames.every(frame => frame.isLoaded);
    }

    /**
     * Get loading progress
     */
    getLoadingProgress() {
        const loadedFrames = this.frames.filter(frame => frame.isLoaded).length;
        return {
            loaded: loadedFrames,
            total: this.totalFrames,
            percentage: (loadedFrames / this.totalFrames) * 100
        };
    }

    /**
     * Dispatch timeline events
     */
    dispatchTimelineEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                ...detail,
                timeline: this.getTimelineState()
            }
        });
        
        this.dispatchEvent(event);
    }

    /**
     * Reset timeline to initial state
     */
    reset() {
        this.stop();
        this.currentFrame = this.totalFrames - 1;
        this.goToLast();
        
        this.dispatchTimelineEvent('timeline:reset');
        console.log('Timeline reset to initial state');
    }

    /**
     * Update timeline with new radar data
     */
    updateTimeline() {
        this.initializeFrames();
        this.dispatchTimelineEvent('timeline:updated');
        console.log('Timeline updated with new data');
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stop();
        
        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
        }
        
        this.frames = [];
        
        console.log('Timeline Controller cleanup completed');
    }
}

export default TimelineController;
