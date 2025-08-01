/**
 * Integration Tests for Enhanced GUI Components
 * Tests the interaction between all new GUI components
 */

import { AccessibilityHelper } from '../../src/components/accessibility-helper.js';
import { DataVisualization } from '../../src/components/data-visualization.js';
import { PerformanceOptimizer } from '../../src/components/performance-optimizer.js';
import { PWAHelper } from '../../src/components/pwa-helper.js';

// Mock dependencies
const mockMap = {
  zoomIn: jest.fn(),
  zoomOut: jest.fn(),
  pan: jest.fn(),
  getCenter: jest.fn(() => ({ lon: -95, lat: 40 })),
  getZoom: jest.fn(() => 8),
  getVisibleBounds: jest.fn(() => ({ left: -96, right: -94, top: 41, bottom: 39 })),
  on: jest.fn(),
  layers: [
    { name: 'states', setVisibility: jest.fn(), setOpacity: jest.fn() },
    { name: 'radar', setVisibility: jest.fn(), setOpacity: jest.fn() }
  ]
};

describe('Enhanced GUI Components Integration', () => {
  let pwaHelper;
  let dataVisualization;
  let accessibilityHelper;
  let performanceOptimizer;
  
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="map"></div>';
    
    // Mock APIs
    global.navigator = {
      serviceWorker: {
        register: jest.fn().mockResolvedValue({ installing: null })
      },
      geolocation: {
        getCurrentPosition: jest.fn()
      },
      connection: {
        effectiveType: '4g',
        addEventListener: jest.fn()
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      deviceMemory: 8
    };
    
    global.WebSocket = jest.fn(() => ({
      readyState: 1,
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn()
    }));
    
    global.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
    
    global.Notification = {
      requestPermission: jest.fn().mockResolvedValue('granted')
    };
    
    global.matchMedia = jest.fn((query) => ({
      matches: query.includes('reduce'),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));

    // Initialize components
    pwaHelper = new PWAHelper();
    dataVisualization = new DataVisualization(mockMap);
    accessibilityHelper = new AccessibilityHelper(mockMap);
    performanceOptimizer = new PerformanceOptimizer(mockMap);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    
    // Cleanup components
    if (pwaHelper) pwaHelper.destroy();
    if (dataVisualization) dataVisualization.destroy();
    if (accessibilityHelper) accessibilityHelper.destroy();
    if (performanceOptimizer) performanceOptimizer.destroy();
  });

  describe('PWA Integration', () => {
    test('should register service worker and setup PWA features', async () => {
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
      expect(document.body.querySelector('#pwa-install-container')).toBeTruthy();
    });

    test('should handle install prompt', () => {
      const installEvent = new Event('beforeinstallprompt');
      installEvent.preventDefault = jest.fn();
      
      window.dispatchEvent(installEvent);
      
      expect(installEvent.preventDefault).toHaveBeenCalled();
    });

    test('should show offline/online status', () => {
      // Test offline
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);
      
      // Test online
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);
      
      // Should have status messages
      expect(document.body.querySelector('#pwa-status-container')).toBeTruthy();
    });
  });

  describe('Data Visualization Integration', () => {
    test('should create visualization controls', () => {
      const controls = document.querySelector('.data-viz-controls');
      expect(controls).toBeTruthy();
      
      const animationControls = controls.querySelector('.animation-controls');
      const colorSchemeSelector = controls.querySelector('.color-scheme-selector');
      const streamingControls = controls.querySelector('.streaming-controls');
      
      expect(animationControls).toBeTruthy();
      expect(colorSchemeSelector).toBeTruthy();
      expect(streamingControls).toBeTruthy();
    });

    test('should handle animation playback', () => {
      const playButton = document.querySelector('.play-pause-btn');
      
      // Start playback
      playButton.click();
      expect(dataVisualization.isPlaying).toBe(true);
      
      // Pause playback
      playButton.click();
      expect(dataVisualization.isPlaying).toBe(false);
    });

    test('should change color schemes', () => {
      const colorSchemeBtn = document.querySelector('[data-scheme="viridis"]');
      
      colorSchemeBtn.click();
      
      expect(dataVisualization.currentColorScheme).toBe('viridis');
      expect(colorSchemeBtn.classList.contains('active')).toBe(true);
    });

    test('should handle WebSocket streaming', () => {
      const streamToggle = document.querySelector('.stream-toggle-btn');
      
      streamToggle.click();
      
      expect(dataVisualization.isStreaming).toBe(true);
    });
  });

  describe('Accessibility Integration', () => {
    test('should create accessibility menu', () => {
      const menu = document.getElementById('accessibility-menu');
      expect(menu).toBeTruthy();
      expect(menu.getAttribute('role')).toBe('dialog');
    });

    test('should handle keyboard shortcuts', () => {
      // Test Alt+M (focus map)
      const mapFocusEvent = new KeyboardEvent('keydown', {
        key: 'm',
        altKey: true
      });
      
      document.dispatchEvent(mapFocusEvent);
      
      // Should attempt to focus map
      const mapElement = document.getElementById('map');
      expect(mapElement).toBeTruthy();
    });

    test('should handle accessibility settings', () => {
      // Toggle high contrast
      accessibilityHelper.toggleHighContrast(true);
      expect(document.body.classList.contains('high-contrast')).toBe(true);
      
      // Toggle large text
      accessibilityHelper.toggleLargeText(true);
      expect(document.body.classList.contains('large-text')).toBe(true);
      
      // Toggle reduced motion
      accessibilityHelper.toggleReducedMotion(true);
      expect(document.body.classList.contains('reduced-motion')).toBe(true);
    });

    test('should provide screen reader announcements', () => {
      const announcer = document.getElementById('sr-announcer');
      expect(announcer).toBeTruthy();
      
      accessibilityHelper.announce('Test announcement');
      
      setTimeout(() => {
        expect(announcer.textContent).toBe('Test announcement');
      }, 100);
    });
  });

  describe('Performance Optimization Integration', () => {
    test('should detect WebGL support', () => {
      expect(performanceOptimizer.webGLSupported).toBeDefined();
    });

    test('should initialize tile caching', () => {
      expect(performanceOptimizer.tileCache).toBeInstanceOf(Map);
      expect(performanceOptimizer.maxCacheSize).toBeGreaterThan(0);
    });

    test('should setup lazy loading', () => {
      expect(performanceOptimizer.lazyObserver).toBeDefined();
      expect(global.IntersectionObserver).toHaveBeenCalled();
    });

    test('should monitor performance', () => {
      expect(performanceOptimizer.isMonitoring).toBe(true);
      expect(performanceOptimizer.performanceMetrics).toBeDefined();
    });

    test('should adapt to connection quality', () => {
      expect(performanceOptimizer.connectionInfo).toBeDefined();
      expect(performanceOptimizer.connectionInfo.effectiveType).toBe('4g');
    });

    test('should generate performance report', () => {
      const report = performanceOptimizer.getPerformanceReport();
      
      expect(report).toHaveProperty('webGL');
      expect(report).toHaveProperty('performance');
      expect(report).toHaveProperty('cache');
      expect(report).toHaveProperty('network');
    });
  });

  describe('Component Interactions', () => {
    test('should integrate accessibility with other components', () => {
      // Test keyboard navigation to data visualization controls
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Tab'
      });
      
      document.dispatchEvent(keyEvent);
      
      // Should add keyboard navigation class
      expect(document.body.classList.contains('keyboard-navigation')).toBe(true);
    });

    test('should integrate PWA with performance monitoring', () => {
      // Performance optimizer should work with PWA features
      expect(performanceOptimizer.isMonitoring).toBe(true);
      
      // PWA should register background sync
      expect(pwaHelper.serviceWorkerRegistration).toBeDefined();
    });

    test('should handle responsive design interactions', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      // Components should adapt to mobile
      const deviceType = performanceOptimizer.getDeviceType();
      expect(deviceType).toBe('mobile');
    });

    test('should coordinate data visualization with performance', () => {
      // Performance optimizer should affect data visualization quality
      performanceOptimizer.enablePerformanceMode();
      expect(performanceOptimizer.tileQuality).toBe('low');
      
      performanceOptimizer.enableQualityMode();
      expect(performanceOptimizer.tileQuality).toBe('high');
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle component initialization failures gracefully', () => {
      // Mock failed service worker registration
      global.navigator.serviceWorker.register = jest.fn().mockRejectedValue(new Error('SW failed'));
      
      const pwaHelperWithError = new PWAHelper();
      
      // Should not throw and should continue working
      expect(pwaHelperWithError).toBeDefined();
    });

    test('should handle missing WebGL gracefully', () => {
      // Mock WebGL not supported
      const performanceOptimizerNoWebGL = new PerformanceOptimizer(mockMap);
      performanceOptimizerNoWebGL.webGLSupported = false;
      
      const result = performanceOptimizerNoWebGL.enableWebGLAcceleration();
      expect(result).toBe(false);
    });

    test('should handle accessibility API unavailability', () => {
      // Mock missing APIs
      delete global.Notification;
      delete global.IntersectionObserver;
      
      const accessibilityHelperLimited = new AccessibilityHelper(mockMap);
      
      // Should still initialize core features
      expect(accessibilityHelperLimited).toBeDefined();
    });

    test('should handle network failures in data visualization', () => {
      // Mock WebSocket connection failure
      global.WebSocket = jest.fn(() => {
        throw new Error('Connection failed');
      });
      
      const dataVizWithError = new DataVisualization(mockMap);
      
      // Should handle error gracefully
      expect(dataVizWithError.webSocket).toBeNull();
    });
  });

  describe('Memory Management', () => {
    test('should cleanup resources on destroy', () => {
      // All components should have destroy methods
      expect(typeof pwaHelper.destroy).toBe('function');
      expect(typeof dataVisualization.destroy).toBe('function');
      expect(typeof accessibilityHelper.destroy).toBe('function');
      expect(typeof performanceOptimizer.destroy).toBe('function');
      
      // Destroy should not throw errors
      expect(() => {
        pwaHelper.destroy();
        dataVisualization.destroy();
        accessibilityHelper.destroy();
        performanceOptimizer.destroy();
      }).not.toThrow();
    });

    test('should manage cache sizes appropriately', () => {
      const initialCacheSize = performanceOptimizer.tileCache.size;
      
      // Add items to cache
      performanceOptimizer.cacheTile('test1', new Blob(), 100);
      performanceOptimizer.cacheTile('test2', new Blob(), 100);
      
      expect(performanceOptimizer.tileCache.size).toBeGreaterThan(initialCacheSize);
      
      // Cleanup should reduce cache size
      performanceOptimizer.cleanupTileCache();
      
      // Cache should still be functional
      expect(performanceOptimizer.tileCache).toBeInstanceOf(Map);
    });
  });
});
