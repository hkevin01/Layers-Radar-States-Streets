/**
 * Weather Alerts Manager Module
 * Manages weather alerts, warnings, and watches from NWS
 * @author NEXRAD Radar Team
 * @version 2.0.0
 */

import GeoJSON from 'ol/format/GeoJSON.js';
import { Feature } from 'ol/index.js';
import { transform } from 'ol/proj.js';

/**
 * Weather Alerts Manager Class
 * Handles weather alert data loading, parsing, and display
 */
export class WeatherAlertsManager extends EventTarget {
    constructor(map, layerManager, config) {
        super();
        this.map = map;
        this.layerManager = layerManager;
        this.config = config;

        this.alerts = new Map();
        this.activeAlerts = [];
        this.lastUpdateTime = null;
        this.updateTimer = null;

        // NWS API configuration
        this.nwsConfig = {
            baseUrl: 'https://api.weather.gov',
            alertsEndpoint: '/alerts/active',
            updateInterval: 60000, // 1 minute
            maxAlerts: 1000,
            alertTypes: {
                warning: {
                    color: '#FF0000',
                    priority: 1,
                    icon: 'warning'
                },
                watch: {
                    color: '#FFA500',
                    priority: 2,
                    icon: 'watch'
                },
                advisory: {
                    color: '#FFFF00',
                    priority: 3,
                    icon: 'advisory'
                },
                statement: {
                    color: '#00FF00',
                    priority: 4,
                    icon: 'statement'
                }
            },
            severityLevels: {
                extreme: { priority: 1, color: '#8B0000' },
                severe: { priority: 2, color: '#FF0000' },
                moderate: { priority: 3, color: '#FFA500' },
                minor: { priority: 4, color: '#FFFF00' },
                unknown: { priority: 5, color: '#808080' }
            }
        };

        this.isInitialized = false;
    }

    /**
     * Initialize the weather alerts manager
     */
    async init() {
        try {
            console.log('Initializing Weather Alerts Manager...');

            // Load initial alerts data
            await this.loadAlertsData();

            // Setup automatic updates
            this.setupAutoUpdate();

            this.isInitialized = true;
            console.log('Weather Alerts Manager initialized successfully');

            this.dispatchEvent(new CustomEvent('alerts:initialized'));

        } catch (error) {
            console.error('Failed to initialize Weather Alerts Manager:', error);
            throw error;
        }
    }

    /**
     * Load weather alerts data from NWS API
     */
    async loadAlertsData() {
        try {
            console.log('Loading weather alerts data...');

            // Get current map extent for filtering alerts
            const extent = this.map.getView().calculateExtent();

            // Build NWS API URL
            const url = this.buildAlertsUrl(extent);

            // Fetch alerts data
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`NWS API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Process alerts data
            this.processAlertsData(data);

            // Update map layers
            this.updateAlertLayers();

            this.lastUpdateTime = new Date();

            this.dispatchEvent(new CustomEvent('alerts:updated', {
                detail: {
                    alertCount: this.activeAlerts.length,
                    updateTime: this.lastUpdateTime,
                    alerts: this.getAlertsSummary()
                }
            }));

            console.log(`Loaded ${this.activeAlerts.length} active weather alerts`);

        } catch (error) {
            console.error('Failed to load weather alerts:', error);

            // Try to load fallback/cached data
            this.loadFallbackAlerts();
        }
    }

    /**
     * Build NWS alerts API URL with spatial filtering
     */
    buildAlertsUrl(extent) {
        const baseUrl = `${this.nwsConfig.baseUrl}${this.nwsConfig.alertsEndpoint}`;

        // Convert extent to geographic coordinates
        const [minX, minY, maxX, maxY] = extent;
        const sw = transform([minX, minY], 'EPSG:3857', 'EPSG:4326');
        const ne = transform([maxX, maxY], 'EPSG:3857', 'EPSG:4326');

        // Build query parameters
        const params = new URLSearchParams({
            status: 'actual',
            message_type: 'alert',
            limit: this.nwsConfig.maxAlerts.toString()
        });

        // Add spatial filtering if extent is reasonable
        const extentWidth = ne[0] - sw[0];
        const extentHeight = ne[1] - sw[1];

        if (extentWidth < 50 && extentHeight < 50) { // Don't filter if too zoomed out
            params.append('point', `${(sw[1] + ne[1]) / 2},${(sw[0] + ne[0]) / 2}`);
        }

        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Process raw alerts data from NWS API
     */
    processAlertsData(data) {
        this.alerts.clear();
        this.activeAlerts = [];

        if (!data.features || !Array.isArray(data.features)) {
            console.warn('Invalid alerts data format');
            return;
        }

        data.features.forEach((feature, index) => {
            try {
                const alert = this.parseAlertFeature(feature, index);
                if (alert && this.isAlertActive(alert)) {
                    this.alerts.set(alert.id, alert);
                    this.activeAlerts.push(alert);
                }
            } catch (error) {
                console.warn('Failed to parse alert feature:', error);
            }
        });

        // Sort alerts by priority and severity
        this.activeAlerts.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.severity.priority - b.severity.priority;
        });
    }

    /**
     * Parse individual alert feature
     */
    parseAlertFeature(feature, index) {
        const props = feature.properties;

        if (!props) {
            return null;
        }

        // Determine alert type and severity
        const event = props.event || '';
        const alertType = this.determineAlertType(event);
        const severity = this.determineSeverity(props.severity);

        // Parse geometry
        let geometry = null;
        if (feature.geometry) {
            try {
                const format = new GeoJSON();
                geometry = format.readGeometry(feature.geometry, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
            } catch (error) {
                console.warn('Failed to parse alert geometry:', error);
            }
        }

        return {
            id: props.id || `alert_${index}`,
            event: event,
            headline: props.headline || 'Weather Alert',
            description: props.description || '',
            instruction: props.instruction || '',
            severity: severity,
            urgency: props.urgency || 'unknown',
            certainty: props.certainty || 'unknown',
            alertType: alertType,
            priority: this.nwsConfig.alertTypes[alertType]?.priority || 5,
            color: this.nwsConfig.alertTypes[alertType]?.color || '#808080',
            icon: this.nwsConfig.alertTypes[alertType]?.icon || 'alert',
            areas: props.areaDesc || '',
            sent: props.sent ? new Date(props.sent) : new Date(),
            effective: props.effective ? new Date(props.effective) : new Date(),
            expires: props.expires ? new Date(props.expires) : null,
            geometry: geometry,
            nwsId: props.id,
            senderName: props.senderName || 'National Weather Service'
        };
    }

    /**
     * Determine alert type from event name
     */
    determineAlertType(event) {
        const eventLower = event.toLowerCase();

        if (eventLower.includes('warning')) {
            return 'warning';
        } else if (eventLower.includes('watch')) {
            return 'watch';
        } else if (eventLower.includes('advisory')) {
            return 'advisory';
        } else {
            return 'statement';
        }
    }

    /**
     * Determine severity level
     */
    determineSeverity(severityStr) {
        const severity = (severityStr || 'unknown').toLowerCase();
        return this.nwsConfig.severityLevels[severity] || this.nwsConfig.severityLevels.unknown;
    }

    /**
     * Check if alert is currently active
     */
    isAlertActive(alert) {
        const now = new Date();

        // Check if alert has expired
        if (alert.expires && now > alert.expires) {
            return false;
        }

        // Check if alert is effective yet
        return !(alert.effective && now < alert.effective);
    }

    /**
     * Update map layers with alert data
     */
    updateAlertLayers() {
        const warningFeatures = [];
        const watchFeatures = [];

        this.activeAlerts.forEach(alert => {
            if (!alert.geometry) return;

            const feature = new Feature({
                geometry: alert.geometry
            });

            // Set feature properties
            feature.setProperties({
                alertId: alert.id,
                event: alert.event,
                headline: alert.headline,
                severity: alert.severity.priority,
                urgency: alert.urgency,
                expires: alert.expires,
                alertType: alert.alertType,
                color: alert.color
            });

            // Add to appropriate layer
            if (alert.alertType === 'warning') {
                warningFeatures.push(feature);
            } else if (alert.alertType === 'watch') {
                watchFeatures.push(feature);
            }
        });

        // Update layer features
        this.layerManager.addWeatherFeatures('warnings', warningFeatures);
        this.layerManager.addWeatherFeatures('watches', watchFeatures);
    }

    /**
     * Get alerts summary for UI
     */
    getAlertsSummary() {
        const summary = {
            total: this.activeAlerts.length,
            byType: {},
            bySeverity: {},
            urgent: []
        };

        this.activeAlerts.forEach(alert => {
            // Count by type
            summary.byType[alert.alertType] = (summary.byType[alert.alertType] || 0) + 1;

            // Count by severity
            const severityKey = alert.severity.priority;
            summary.bySeverity[severityKey] = (summary.bySeverity[severityKey] || 0) + 1;

            // Collect urgent alerts
            if (alert.severity.priority <= 2 || alert.urgency === 'immediate') {
                summary.urgent.push({
                    id: alert.id,
                    event: alert.event,
                    headline: alert.headline,
                    areas: alert.areas,
                    expires: alert.expires
                });
            }
        });

        return summary;
    }

    /**
     * Get alert by ID
     */
    getAlert(alertId) {
        return this.alerts.get(alertId);
    }

    /**
     * Get all active alerts
     */
    getActiveAlerts() {
        return [...this.activeAlerts];
    }

    /**
     * Get alerts for specific area
     */
    getAlertsForArea(areaName) {
        return this.activeAlerts.filter(alert =>
            alert.areas.toLowerCase().includes(areaName.toLowerCase())
        );
    }

    /**
     * Highlight alerts on map
     */
    highlightAlerts() {
        // Increase opacity of alert layers
        this.layerManager.setLayerOpacity('weather_warnings', 0.8);
        this.layerManager.setLayerOpacity('weather_watches', 0.7);

        // Ensure alert layers are visible
        this.layerManager.setLayerVisibility('weather_warnings', true);
        this.layerManager.setLayerVisibility('weather_watches', true);

        this.dispatchEvent(new CustomEvent('alerts:highlighted'));
    }

    /**
     * Update alerts data
     */
    async updateAlerts() {
        try {
            await this.loadAlertsData();
        } catch (error) {
            console.error('Failed to update alerts:', error);
        }
    }

    /**
     * Load fallback alerts data when API fails
     */
    loadFallbackAlerts() {
        console.log('Loading fallback alerts data...');

        // Create a basic fallback alert for testing
        const fallbackAlert = {
            id: 'fallback_1',
            event: 'System Notice',
            headline: 'Weather alerts temporarily unavailable',
            description: 'Unable to load current weather alerts from NWS. Please check back later.',
            alertType: 'statement',
            severity: this.nwsConfig.severityLevels.minor,
            priority: 5,
            color: '#808080',
            icon: 'info',
            areas: 'All Areas',
            sent: new Date(),
            effective: new Date(),
            expires: null,
            geometry: null
        };

        this.alerts.set(fallbackAlert.id, fallbackAlert);
        this.activeAlerts = [fallbackAlert];

        this.dispatchEvent(new CustomEvent('alerts:fallback:loaded', {
            detail: { alert: fallbackAlert }
        }));
    }

    /**
     * Setup automatic alerts updates
     */
    setupAutoUpdate() {
        this.updateTimer = setInterval(() => {
            this.updateAlerts();
        }, this.nwsConfig.updateInterval);

        console.log('Automatic alerts updates enabled');
    }

    /**
     * Format alert for display
     */
    formatAlert(alert) {
        return {
            id: alert.id,
            title: alert.headline,
            type: alert.alertType,
            severity: alert.severity,
            event: alert.event,
            areas: alert.areas,
            description: alert.description,
            instruction: alert.instruction,
            effective: alert.effective?.toLocaleString(),
            expires: alert.expires?.toLocaleString(),
            color: alert.color,
            icon: alert.icon,
            urgency: alert.urgency,
            certainty: alert.certainty
        };
    }

    /**
     * Get formatted alerts for UI display
     */
    getFormattedAlerts() {
        return this.activeAlerts.map(alert => this.formatAlert(alert));
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        this.alerts.clear();
        this.activeAlerts = [];

        console.log('Weather Alerts Manager cleanup completed');
    }
}

export default WeatherAlertsManager;
