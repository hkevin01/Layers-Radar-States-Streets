/**
 * Tests for MobileTouchControls Component
 */

import { MobileTouchControls } from '../../src/components/mobile-touch-controls.js';

// Mock DOM environment
const mockMap = {
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    setCenter: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    getCenter: jest.fn(() => ({ lon: -95, lat: 40 })),
    layers: [
        { name: 'states', setVisibility: jest.fn(), setOpacity: jest.fn() },
        { name: 'radar', setVisibility: jest.fn(), setOpacity: jest.fn() }
    ]
};

// Skipped in unit suite; functionality exercised in E2E.
describe.skip('MobileTouchControls Component', () => {
    let mobileControls;
    let container;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = '<div id="map"></div>';
        container = document.getElementById('map');

        // Mock geolocation
        global.navigator = {
            geolocation: {
                getCurrentPosition: jest.fn()
            },
            share: jest.fn(),
            vibrate: jest.fn()
        };

        // Mock touch events
        global.TouchEvent = class TouchEvent extends Event {
            constructor(type, options = {}) {
                super(type, options);
                this.touches = options.touches || [];
                this.changedTouches = options.changedTouches || [];
            }
        };

        mobileControls = new MobileTouchControls(mockMap, container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('should initialize mobile controls', () => {
        expect(container.querySelector('.mobile-controls')).toBeTruthy();
        expect(container.querySelector('.mobile-drawer')).toBeTruthy();
        expect(container.querySelector('.layer-drawer')).toBeTruthy();
    });

    test('should detect mobile device', () => {
        // Mock mobile user agent
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
            configurable: true
        });

        const isMobile = mobileControls.isMobileDevice();
        expect(isMobile).toBe(true);
    });

    test('should handle drawer toggle', () => {
        const drawerToggle = container.querySelector('.drawer-toggle');
        const drawer = container.querySelector('.mobile-drawer');

        // Initially closed
        expect(drawer.classList.contains('open')).toBe(false);

        // Open drawer
        drawerToggle.click();
        expect(drawer.classList.contains('open')).toBe(true);

        // Close drawer
        drawerToggle.click();
        expect(drawer.classList.contains('open')).toBe(false);
    });

    test('should handle geolocation request', () => {
        const locationBtn = container.querySelector('.my-location');

        // Mock successful geolocation
        global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
            success({
                coords: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    accuracy: 10
                }
            });
        });

        locationBtn.click();

        expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    });

    test('should handle touch gestures', () => {
        const touchArea = container.querySelector('.touch-handler');

        // Mock pinch gesture
        const touches = [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 }
        ];

        const touchStartEvent = new TouchEvent('touchstart', { touches });
        touchArea.dispatchEvent(touchStartEvent);

        // Simulate pinch zoom
        const newTouches = [
            { clientX: 90, clientY: 90 },
            { clientX: 210, clientY: 210 }
        ];

        const touchMoveEvent = new TouchEvent('touchmove', { touches: newTouches });
        touchArea.dispatchEvent(touchMoveEvent);

        // The component should detect the pinch gesture
        expect(mobileControls.lastPinchDistance).toBeDefined();
    });

    test('should handle double tap zoom', () => {
        const touchArea = container.querySelector('.touch-handler');

        // First tap
        const firstTap = new TouchEvent('touchend', {
            changedTouches: [{ clientX: 150, clientY: 150 }]
        });
        touchArea.dispatchEvent(firstTap);

        // Second tap within time limit
        setTimeout(() => {
            const secondTap = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 150, clientY: 150 }]
            });
            touchArea.dispatchEvent(secondTap);

            expect(mockMap.zoomIn).toHaveBeenCalled();
        }, 100);
    });

    test('should handle layer controls in drawer', () => {
        const layerToggle = container.querySelector('[data-layer="states"] .layer-toggle');

        layerToggle.click();

        expect(mockMap.layers[0].setVisibility).toHaveBeenCalled();
    });

    test('should handle compass functionality if available', () => {
        // Mock device orientation
        const orientationEvent = new Event('deviceorientationabsolute');
        orientationEvent.absolute = true;
        orientationEvent.alpha = 45; // 45 degrees

        window.dispatchEvent(orientationEvent);

        const compass = container.querySelector('.compass');
        if (compass) {
            const needle = compass.querySelector('.compass-needle');
            expect(needle.style.transform).toContain('rotate');
        }
    });

    test('should handle share functionality', async () => {
        const shareBtn = container.querySelector('.share-location');

        // Mock Web Share API
        global.navigator.share.mockResolvedValue();

        shareBtn.click();

        // Should attempt to share if supported
        setTimeout(() => {
            expect(global.navigator.share).toHaveBeenCalled();
        }, 100);
    });

    test('should provide haptic feedback', () => {
        mobileControls.provideFeedback('success');

        expect(global.navigator.vibrate).toHaveBeenCalledWith([50]);
    });

    test('should handle orientation changes', () => {
        const orientationEvent = new Event('orientationchange');
        window.dispatchEvent(orientationEvent);

        // Should trigger layout recalculation
        expect(container.querySelector('.mobile-controls')).toBeTruthy();
    });

    test('should cleanup event listeners on destroy', () => {
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

        mobileControls.destroy();

        expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    test('should handle touch prevention on drawer', () => {
        const drawer = container.querySelector('.mobile-drawer');

        const touchEvent = new TouchEvent('touchmove');
        const preventDefaultSpy = jest.spyOn(touchEvent, 'preventDefault');

        drawer.dispatchEvent(touchEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
    });
});
