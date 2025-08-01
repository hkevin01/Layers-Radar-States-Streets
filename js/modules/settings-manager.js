/**
 * Settings Manager Module
 * Manages user preferences and application settings
 * @author NEXRAD Radar Team
 * @version 2.0.0
 */

/**
 * Settings Manager Class
 * Handles user settings persistence and management
 */
export class SettingsManager extends EventTarget {
    constructor() {
        super();
        
        this.storageKey = 'nexrad-weather-radar-settings';
        this.settings = {};
        
        // Default settings
        this.defaultSettings = {
            display: {
                theme: 'dark',
                units: 'imperial', // imperial or metric
                language: 'en',
                showCoordinates: true,
                showScale: true,
                showAttribution: true
            },
            map: {
                defaultBaseLayer: 'dark',
                defaultZoom: 5,
                defaultCenter: [-98.5795, 39.8283], // Geographic center of US
                enableRotation: true,
                smoothAnimation: true
            },
            radar: {
                defaultType: 'base_reflectivity',
                defaultOpacity: 0.7,
                autoUpdate: true,
                updateInterval: 300, // seconds
                showTimestamp: true
            },
            animation: {
                speed: 500, // milliseconds between frames
                frames: 10,
                autoLoop: true,
                preloadFrames: true
            },
            alerts: {
                showAlerts: true,
                autoUpdate: true,
                updateInterval: 60, // seconds
                showPopups: true,
                alertTypes: {
                    warnings: true,
                    watches: true,
                    advisories: true,
                    statements: false
                }
            },
            location: {
                autoLocate: false,
                trackLocation: false,
                showAccuracy: true,
                highAccuracy: true
            },
            ui: {
                sidebarCollapsed: false,
                compactMode: false,
                showTooltips: true,
                keyboardShortcuts: true,
                accessibilityMode: false
            },
            data: {
                cacheEnabled: true,
                cacheTimeout: 3600, // seconds
                offlineMode: false,
                dataSource: 'nws' // nws, backup
            },
            notifications: {
                enabled: true,
                soundEnabled: false,
                newAlerts: true,
                radarUpdates: false,
                systemStatus: true
            }
        };
        
        this.isInitialized = false;
    }

    /**
     * Initialize settings manager
     */
    async init() {
        try {
            console.log('Initializing Settings Manager...');
            
            // Load settings from storage
            this.loadSettings();
            
            // Validate and migrate settings if needed
            this.validateSettings();
            
            // Setup auto-save
            this.setupAutoSave();
            
            this.isInitialized = true;
            console.log('Settings Manager initialized successfully');
            
            this.dispatchEvent(new CustomEvent('settings:initialized'));
            
        } catch (error) {
            console.error('Failed to initialize Settings Manager:', error);
            
            // Fall back to default settings
            this.resetToDefaults();
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const storedSettings = localStorage.getItem(this.storageKey);
            
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                this.settings = this.mergeSettings(this.defaultSettings, parsed);
                console.log('Settings loaded from localStorage');
            } else {
                this.settings = { ...this.defaultSettings };
                console.log('Using default settings');
            }
            
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = { ...this.defaultSettings };
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const settingsString = JSON.stringify(this.settings, null, 2);
            localStorage.setItem(this.storageKey, settingsString);
            
            this.dispatchEvent(new CustomEvent('settings:saved', {
                detail: { settings: this.settings }
            }));
            
            console.log('Settings saved to localStorage');
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            
            // Try to clear some space and retry
            this.clearOldData();
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            } catch (retryError) {
                console.error('Failed to save settings after cleanup:', retryError);
            }
        }
    }

    /**
     * Merge default settings with user settings
     */
    mergeSettings(defaults, userSettings) {
        const merged = { ...defaults };
        
        for (const [category, categorySettings] of Object.entries(userSettings)) {
            if (merged[category] && typeof categorySettings === 'object') {
                merged[category] = {
                    ...merged[category],
                    ...categorySettings
                };
            }
        }
        
        return merged;
    }

    /**
     * Validate and migrate settings
     */
    validateSettings() {
        let needsSave = false;
        
        // Check for missing categories or settings
        for (const [category, categoryDefaults] of Object.entries(this.defaultSettings)) {
            if (!this.settings[category]) {
                this.settings[category] = { ...categoryDefaults };
                needsSave = true;
            } else {
                for (const [setting, defaultValue] of Object.entries(categoryDefaults)) {
                    if (this.settings[category][setting] === undefined) {
                        this.settings[category][setting] = defaultValue;
                        needsSave = true;
                    }
                }
            }
        }
        
        // Validate setting values
        needsSave = this.validateSettingValues() || needsSave;
        
        if (needsSave) {
            this.saveSettings();
            console.log('Settings validated and updated');
        }
    }

    /**
     * Validate individual setting values
     */
    validateSettingValues() {
        let changed = false;
        
        // Validate display units
        if (!['imperial', 'metric'].includes(this.settings.display.units)) {
            this.settings.display.units = 'imperial';
            changed = true;
        }
        
        // Validate theme
        if (!['light', 'dark', 'auto'].includes(this.settings.display.theme)) {
            this.settings.display.theme = 'dark';
            changed = true;
        }
        
        // Validate radar type
        const validRadarTypes = ['base_reflectivity', 'velocity', 'precipitation'];
        if (!validRadarTypes.includes(this.settings.radar.defaultType)) {
            this.settings.radar.defaultType = 'base_reflectivity';
            changed = true;
        }
        
        // Validate opacity
        if (this.settings.radar.defaultOpacity < 0 || this.settings.radar.defaultOpacity > 1) {
            this.settings.radar.defaultOpacity = 0.7;
            changed = true;
        }
        
        // Validate animation speed
        if (this.settings.animation.speed < 100 || this.settings.animation.speed > 2000) {
            this.settings.animation.speed = 500;
            changed = true;
        }
        
        // Validate animation frames
        if (this.settings.animation.frames < 5 || this.settings.animation.frames > 20) {
            this.settings.animation.frames = 10;
            changed = true;
        }
        
        // Validate update intervals
        if (this.settings.radar.updateInterval < 60 || this.settings.radar.updateInterval > 1800) {
            this.settings.radar.updateInterval = 300;
            changed = true;
        }
        
        if (this.settings.alerts.updateInterval < 30 || this.settings.alerts.updateInterval > 600) {
            this.settings.alerts.updateInterval = 60;
            changed = true;
        }
        
        return changed;
    }

    /**
     * Get all settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Get settings for a specific category
     */
    getCategorySettings(category) {
        return this.settings[category] ? { ...this.settings[category] } : {};
    }

    /**
     * Get a specific setting value
     */
    getSetting(category, setting) {
        return this.settings[category]?.[setting];
    }

    /**
     * Set a specific setting value
     */
    setSetting(category, setting, value) {
        if (!this.settings[category]) {
            this.settings[category] = {};
        }
        
        const oldValue = this.settings[category][setting];
        this.settings[category][setting] = value;
        
        this.dispatchEvent(new CustomEvent('setting:changed', {
            detail: {
                category,
                setting,
                oldValue,
                newValue: value
            }
        }));
        
        console.log(`Setting changed: ${category}.${setting} = ${value}`);
    }

    /**
     * Set multiple settings for a category
     */
    setCategorySettings(category, newSettings) {
        const oldSettings = { ...this.settings[category] };
        
        this.settings[category] = {
            ...this.settings[category],
            ...newSettings
        };
        
        this.dispatchEvent(new CustomEvent('category:changed', {
            detail: {
                category,
                oldSettings,
                newSettings: this.settings[category]
            }
        }));
        
        console.log(`Category settings updated: ${category}`);
    }

    /**
     * Reset all settings to defaults
     */
    resetToDefaults() {
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
        
        this.dispatchEvent(new CustomEvent('settings:reset'));
        console.log('Settings reset to defaults');
    }

    /**
     * Reset a specific category to defaults
     */
    resetCategoryToDefaults(category) {
        if (this.defaultSettings[category]) {
            this.settings[category] = { ...this.defaultSettings[category] };
            
            this.dispatchEvent(new CustomEvent('category:reset', {
                detail: { category }
            }));
            
            console.log(`Category reset to defaults: ${category}`);
        }
    }

    /**
     * Export settings as JSON
     */
    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }

    /**
     * Import settings from JSON
     */
    importSettings(settingsJson) {
        try {
            const importedSettings = JSON.parse(settingsJson);
            this.settings = this.mergeSettings(this.defaultSettings, importedSettings);
            this.validateSettings();
            this.saveSettings();
            
            this.dispatchEvent(new CustomEvent('settings:imported'));
            console.log('Settings imported successfully');
            
            return true;
            
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        // Auto-save when settings change
        this.addEventListener('setting:changed', () => {
            this.saveSettings();
        });
        
        this.addEventListener('category:changed', () => {
            this.saveSettings();
        });
        
        // Auto-save periodically
        setInterval(() => {
            this.saveSettings();
        }, 60000); // Every minute
    }

    /**
     * Clear old cached data to free up storage space
     */
    clearOldData() {
        const keysToRemove = [];
        
        // Look for old cache keys to remove
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.includes('radar-cache-') ||
                key.includes('weather-cache-') ||
                key.includes('old-settings')
            )) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log(`Cleared ${keysToRemove.length} old cache entries`);
    }

    /**
     * Get storage usage information
     */
    getStorageInfo() {
        let totalSize = 0;
        let settingsSize = 0;
        
        try {
            // Calculate total localStorage usage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                const size = (key.length + value.length) * 2; // Rough estimate in bytes
                
                totalSize += size;
                
                if (key === this.storageKey) {
                    settingsSize = size;
                }
            }
            
            return {
                totalSize,
                settingsSize,
                quota: this.getStorageQuota(),
                usage: (totalSize / this.getStorageQuota()) * 100
            };
            
        } catch (error) {
            console.error('Failed to calculate storage info:', error);
            return null;
        }
    }

    /**
     * Get estimated storage quota
     */
    getStorageQuota() {
        // Typical localStorage quota is 5-10MB
        // This is a rough estimate
        return 5 * 1024 * 1024; // 5MB
    }

    /**
     * Check if storage is available
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('localStorage is not available:', error.message);
            return false;
        }
    }

    /**
     * Get settings schema for UI generation
     */
    getSettingsSchema() {
        return {
            display: {
                title: 'Display Settings',
                settings: {
                    theme: {
                        type: 'select',
                        label: 'Theme',
                        options: [
                            { value: 'light', label: 'Light' },
                            { value: 'dark', label: 'Dark' },
                            { value: 'auto', label: 'Auto' }
                        ]
                    },
                    units: {
                        type: 'select',
                        label: 'Units',
                        options: [
                            { value: 'imperial', label: 'Imperial (°F, mph, in)' },
                            { value: 'metric', label: 'Metric (°C, km/h, mm)' }
                        ]
                    },
                    showCoordinates: {
                        type: 'checkbox',
                        label: 'Show coordinates'
                    }
                }
            },
            radar: {
                title: 'Radar Settings',
                settings: {
                    defaultType: {
                        type: 'select',
                        label: 'Default radar type',
                        options: [
                            { value: 'base_reflectivity', label: 'Base Reflectivity' },
                            { value: 'velocity', label: 'Velocity' },
                            { value: 'precipitation', label: 'Precipitation' }
                        ]
                    },
                    defaultOpacity: {
                        type: 'range',
                        label: 'Default opacity',
                        min: 0,
                        max: 1,
                        step: 0.1
                    },
                    autoUpdate: {
                        type: 'checkbox',
                        label: 'Auto-update radar data'
                    }
                }
            },
            animation: {
                title: 'Animation Settings',
                settings: {
                    speed: {
                        type: 'range',
                        label: 'Animation speed (ms)',
                        min: 200,
                        max: 1500,
                        step: 50
                    },
                    frames: {
                        type: 'range',
                        label: 'Number of frames',
                        min: 5,
                        max: 15,
                        step: 1
                    },
                    autoLoop: {
                        type: 'checkbox',
                        label: 'Auto-loop animation'
                    }
                }
            }
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Save final state
        this.saveSettings();
        
        console.log('Settings Manager cleanup completed');
    }
}

export default SettingsManager;
