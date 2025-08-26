/**
 * Geolocation Service Module
 * Handles user location detection and map positioning
 * @author NEXRAD Radar Team
 * @version 2.0.0
 */

import { Point } from 'ol/geom.js';
import { Feature } from 'ol/index.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { fromLonLat } from 'ol/proj.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Circle, Fill, Stroke, Style } from 'ol/style.js';

/**
 * Geolocation Service Class
 * Manages user location detection and display
 */
export class GeolocationService extends EventTarget {
    constructor(map) {
        super();
        this.map = map;

        this.currentPosition = null;
        this.isTracking = false;
        this.watchId = null;
        this.locationLayer = null;
        this.accuracy = null;

        // Geolocation options
        this.options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };

        this.isInitialized = false;
    }

    /**
     * Initialize geolocation service
     */
    async init() {
        try {
            console.log('Initializing Geolocation Service...');

            // Check if geolocation is available
            if (!this.isGeolocationAvailable()) {
                throw new Error('Geolocation is not available in this browser');
            }

            // Create location layer
            this.createLocationLayer();

            this.isInitialized = true;
            console.log('Geolocation Service initialized successfully');

            this.dispatchEvent(new CustomEvent('geolocation:initialized'));

        } catch (error) {
            console.error('Failed to initialize Geolocation Service:', error);
            throw error;
        }
    }

    /**
     * Check if geolocation is available
     */
    isGeolocationAvailable() {
        return 'geolocation' in navigator;
    }

    /**
     * Create location display layer
     */
    createLocationLayer() {
        const vectorSource = new VectorSource();

        this.locationLayer = new VectorLayer({
            source: vectorSource,
            style: this.getLocationStyle(),
            zIndex: 100
        });

        this.locationLayer.set('name', 'User Location');
        this.locationLayer.set('type', 'location');

        this.map.addLayer(this.locationLayer);
        console.log('Location layer created');
    }

    /**
     * Get current user location
     */
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!this.isGeolocationAvailable()) {
                reject(new Error('Geolocation not available'));
                return;
            }

            console.log('Getting current location...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.handlePositionSuccess(position);
                    resolve(position);
                },
                (error) => {
                    this.handlePositionError(error);
                    reject(error);
                },
                this.options
            );
        });
    }

    /**
     * Start tracking user location
     */
    startTracking() {
        if (!this.isGeolocationAvailable() || this.isTracking) {
            return;
        }

        console.log('Starting location tracking...');

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.handlePositionSuccess(position);
            },
            (error) => {
                this.handlePositionError(error);
            },
            this.options
        );

        this.isTracking = true;

        this.dispatchEvent(new CustomEvent('geolocation:tracking:started'));
    }

    /**
     * Stop tracking user location
     */
    stopTracking() {
        if (!this.isTracking || this.watchId === null) {
            return;
        }

        console.log('Stopping location tracking...');

        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
        this.isTracking = false;

        this.dispatchEvent(new CustomEvent('geolocation:tracking:stopped'));
    }

    /**
     * Handle successful position detection
     */
    handlePositionSuccess(position) {
        const coords = position.coords;

        this.currentPosition = {
            longitude: coords.longitude,
            latitude: coords.latitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            heading: coords.heading,
            speed: coords.speed,
            timestamp: new Date(position.timestamp)
        };

        this.accuracy = coords.accuracy;

        // Update location display
        this.updateLocationDisplay();

        this.dispatchEvent(new CustomEvent('geolocation:position:updated', {
            detail: {
                position: this.currentPosition,
                accuracy: this.accuracy
            }
        }));

        console.log(`Location updated: ${coords.latitude}, ${coords.longitude} (±${coords.accuracy}m)`);
    }

    /**
     * Handle position detection errors
     */
    handlePositionError(error) {
        let errorMessage = 'Unknown geolocation error';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied by user';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable';
                break;
            case error.TIMEOUT:
                errorMessage = 'Location request timed out';
                break;
        }

        console.error('Geolocation error:', errorMessage);

        this.dispatchEvent(new CustomEvent('geolocation:error', {
            detail: {
                error: error,
                message: errorMessage
            }
        }));
    }

    /**
     * Update location display on map
     */
    updateLocationDisplay() {
        if (!this.currentPosition || !this.locationLayer) {
            return;
        }

        const source = this.locationLayer.getSource();
        source.clear();

        // Create location point feature
        const locationCoord = fromLonLat([
            this.currentPosition.longitude,
            this.currentPosition.latitude
        ]);

        const locationFeature = new Feature({
            geometry: new Point(locationCoord),
            type: 'user-location',
            accuracy: this.accuracy,
            timestamp: this.currentPosition.timestamp
        });

        source.addFeature(locationFeature);

        // Create accuracy circle if accuracy is available and reasonable
        if (this.accuracy && this.accuracy < 10000) { // Max 10km accuracy
            const accuracyFeature = new Feature({
                geometry: new Point(locationCoord),
                type: 'location-accuracy',
                radius: this.accuracy
            });

            source.addFeature(accuracyFeature);
        }
    }

    /**
     * Center map on user location
     */
    centerOnLocation() {
        if (!this.currentPosition) {
            console.warn('No current location available');
            return;
        }

        const view = this.map.getView();
        const center = fromLonLat([
            this.currentPosition.longitude,
            this.currentPosition.latitude
        ]);

        // Determine appropriate zoom level based on accuracy
        let zoom = 12; // Default zoom
        if (this.accuracy) {
            if (this.accuracy < 100) {
                zoom = 15; // Very accurate
            } else if (this.accuracy < 1000) {
                zoom = 13; // Good accuracy
            } else if (this.accuracy < 5000) {
                zoom = 11; // Moderate accuracy
            } else {
                zoom = 9; // Poor accuracy
            }
        }

        view.animate({
            center: center,
            zoom: zoom,
            duration: 1000
        });

        this.dispatchEvent(new CustomEvent('geolocation:centered'));
        console.log('Map centered on user location');
    }

    /**
     * Get location style
     */
    getLocationStyle() {
        return (feature) => {
            const type = feature.get('type');

            if (type === 'user-location') {
                return new Style({
                    image: new Circle({
                        radius: 8,
                        fill: new Fill({
                            color: 'rgba(0, 122, 255, 1)'
                        }),
                        stroke: new Stroke({
                            color: 'rgba(255, 255, 255, 1)',
                            width: 2
                        })
                    })
                });
            } else if (type === 'location-accuracy') {
                const radius = feature.get('radius');
                const mapView = this.map.getView();
                const resolution = mapView.getResolution();
                const pixelRadius = radius / resolution;

                return new Style({
                    image: new Circle({
                        radius: pixelRadius,
                        fill: new Fill({
                            color: 'rgba(0, 122, 255, 0.1)'
                        }),
                        stroke: new Stroke({
                            color: 'rgba(0, 122, 255, 0.3)',
                            width: 1
                        })
                    })
                });
            }

            return null;
        };
    }

    /**
     * Request location permission
     */
    async requestPermission() {
        if (!this.isGeolocationAvailable()) {
            throw new Error('Geolocation not available');
        }

        try {
            // Try to get current position to trigger permission request
            await this.getCurrentLocation();
            return 'granted';
        } catch (error) {
            if (error.code === error.PERMISSION_DENIED) {
                return 'denied';
            }
            throw error;
        }
    }

    /**
     * Check if location services are enabled
     */
    async checkLocationServices() {
        try {
            await this.getCurrentLocation();
            return true;
        } catch (error) {
            console.warn('Location services check failed:', error.message);
            return false;
        }
    }

    /**
     * Get distance to location
     */
    getDistanceToLocation(targetLon, targetLat) {
        if (!this.currentPosition) {
            return null;
        }

        return this.calculateDistance(
            this.currentPosition.latitude,
            this.currentPosition.longitude,
            targetLat,
            targetLon
        );
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return {
            kilometers: distance,
            miles: distance * 0.621371,
            meters: distance * 1000
        };
    }

    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Get current position information
     */
    getCurrentPositionInfo() {
        if (!this.currentPosition) {
            return null;
        }

        return {
            coordinates: {
                latitude: this.currentPosition.latitude,
                longitude: this.currentPosition.longitude
            },
            accuracy: this.accuracy,
            timestamp: this.currentPosition.timestamp,
            isTracking: this.isTracking,
            formattedCoordinates: this.formatCoordinates(
                this.currentPosition.latitude,
                this.currentPosition.longitude
            )
        };
    }

    /**
     * Format coordinates for display
     */
    formatCoordinates(lat, lon) {
        const latDir = lat >= 0 ? 'N' : 'S';
        const lonDir = lon >= 0 ? 'E' : 'W';

        return {
            decimal: `${lat.toFixed(6)}°, ${lon.toFixed(6)}°`,
            dms: `${this.toDMS(Math.abs(lat))}${latDir}, ${this.toDMS(Math.abs(lon))}${lonDir}`
        };
    }

    /**
     * Convert decimal degrees to degrees, minutes, seconds
     */
    toDMS(decimal) {
        const degrees = Math.floor(decimal);
        const minutesFloat = (decimal - degrees) * 60;
        const minutes = Math.floor(minutesFloat);
        const seconds = (minutesFloat - minutes) * 60;

        return `${degrees}° ${minutes}' ${seconds.toFixed(2)}"`;
    }

    /**
     * Show/hide location on map
     */
    setLocationVisible(visible) {
        if (this.locationLayer) {
            this.locationLayer.setVisible(visible);
        }
    }

    /**
     * Clear location display
     */
    clearLocation() {
        if (this.locationLayer) {
            this.locationLayer.getSource().clear();
        }

        this.currentPosition = null;
        this.accuracy = null;

        this.dispatchEvent(new CustomEvent('geolocation:cleared'));
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopTracking();
        this.clearLocation();

        if (this.locationLayer) {
            this.map.removeLayer(this.locationLayer);
        }

        console.log('Geolocation Service cleanup completed');
    }
}

export default GeolocationService;
