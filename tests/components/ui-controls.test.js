/**
 * Tests for UIControls Component
 */

import { UIControls } from '../../src/components/ui-controls.js';

// Mock DOM environment
const mockMap = {
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    refresh: jest.fn(),
    takeScreenshot: jest.fn(),
    getZoom: jest.fn(() => 8),
    getCenter: jest.fn(() => ({ lon: -95, lat: 40 })),
    layers: [
        { name: 'states', setVisibility: jest.fn(), setOpacity: jest.fn() },
        { name: 'radar', setVisibility: jest.fn(), setOpacity: jest.fn() }
    ]
};

describe('UIControls Component', () => {
    let uiControls;
    let container;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = '<div id="map"></div>';
        container = document.getElementById('map');
        
        // Mock geolocation
        global.navigator = {
            geolocation: {
                getCurrentPosition: jest.fn()
            }
        };

        uiControls = new UIControls(mockMap, container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('should initialize UI controls', () => {
        expect(container.querySelector('.ui-controls')).toBeTruthy();
        expect(container.querySelector('.layer-panel')).toBeTruthy();
        expect(container.querySelector('.map-tools')).toBeTruthy();
        expect(container.querySelector('.info-panel')).toBeTruthy();
    });

    test('should create layer toggles for all map layers', () => {
        const layerToggles = container.querySelectorAll('.layer-item');
        expect(layerToggles).toHaveLength(2);
        
        const statesToggle = container.querySelector('[data-layer="states"]');
        const radarToggle = container.querySelector('[data-layer="radar"]');
        
        expect(statesToggle).toBeTruthy();
        expect(radarToggle).toBeTruthy();
    });

    test('should handle layer toggle interactions', () => {
        const statesToggle = container.querySelector('[data-layer="states"] .layer-toggle');
        
        // Simulate click
        statesToggle.click();
        
        expect(mockMap.layers[0].setVisibility).toHaveBeenCalled();
    });

    test('should handle opacity slider changes', () => {
        const opacitySlider = container.querySelector('[data-layer="states"] .opacity-slider');
        
        // Simulate opacity change
        opacitySlider.value = '0.7';
        opacitySlider.dispatchEvent(new Event('input'));
        
        expect(mockMap.layers[0].setOpacity).toHaveBeenCalledWith(0.7);
    });

    test('should handle map tool interactions', () => {
        const zoomInBtn = container.querySelector('.zoom-in');
        const zoomOutBtn = container.querySelector('.zoom-out');
        const refreshBtn = container.querySelector('.refresh-map');

        zoomInBtn.click();
        expect(mockMap.zoomIn).toHaveBeenCalled();

        zoomOutBtn.click();
        expect(mockMap.zoomOut).toHaveBeenCalled();

        refreshBtn.click();
        expect(mockMap.refresh).toHaveBeenCalled();
    });

    test('should update coordinate display', () => {
        uiControls.updateCoordinates(-95.5, 40.5);
        
        const coordDisplay = container.querySelector('.coordinates .value');
        expect(coordDisplay.textContent).toContain('-95.5');
        expect(coordDisplay.textContent).toContain('40.5');
    });

    test('should update zoom display', () => {
        uiControls.updateZoom(10);
        
        const zoomDisplay = container.querySelector('.zoom-level .value');
        expect(zoomDisplay.textContent).toBe('10');
    });

    test('should show and hide loading state', () => {
        uiControls.showLoading('Loading radar data...');
        
        const loadingEl = container.querySelector('.loading-overlay');
        expect(loadingEl).toBeTruthy();
        expect(loadingEl.style.display).toBe('flex');
        
        uiControls.hideLoading();
        expect(loadingEl.style.display).toBe('none');
    });

    test('should show error messages', () => {
        uiControls.showError('Failed to load data', 'TEST_ERROR');
        
        const errorToast = container.querySelector('.error-toast');
        expect(errorToast).toBeTruthy();
        expect(errorToast.textContent).toContain('Failed to load data');
    });

    test('should handle screenshot functionality', () => {
        const screenshotBtn = container.querySelector('.screenshot');
        screenshotBtn.click();
        
        expect(mockMap.takeScreenshot).toHaveBeenCalled();
    });

    test('should handle keyboard navigation', () => {
        const layerToggle = container.querySelector('.layer-toggle');
        
        // Simulate Enter key
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        layerToggle.dispatchEvent(enterEvent);
        
        expect(mockMap.layers[0].setVisibility).toHaveBeenCalled();
    });

    test('should cleanup event listeners on destroy', () => {
        const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
        
        uiControls.destroy();
        
        expect(removeEventListenerSpy).toHaveBeenCalled();
    });
});
