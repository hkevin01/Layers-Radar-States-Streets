/**
 * Basic Map Functionality Tests
 * 
 * Tests core OpenLayers map functionality with proper event synchronization
 */

import { test, expect } from '@playwright/test';
import { OpenLayersTestHelper, DiagnosticsOverlay, TestUtils, TEST_CONFIG } from '../test-setup.js';

test.describe('Map Basic Functionality', () => {
  let helper;
  let diagnostics;

  test.beforeEach(async ({ page }) => {
    helper = new OpenLayersTestHelper(page);
    diagnostics = new DiagnosticsOverlay(page);
    
    // Navigate to application
    await page.goto('/public/index.html');
    
    // Setup test helpers
    await helper.setupEventHooks();
    await diagnostics.injectOverlay();
    
    // Wait for map to be ready
    await helper.waitForMapReady();
  });

  test('should load map without errors', async ({ page }) => {
    // Wait for map initialization
    await helper.waitForMapReady();
    await helper.waitForRenderComplete();
    
    // Assert no JavaScript errors
    await TestUtils.assertNoErrors(page);
    
    // Assert map is visible
    await TestUtils.assertMapVisible(page);
    
    // Check performance metrics
    const metrics = await helper.getPerformanceMetrics();
    expect(metrics.renderTime).toBeLessThan(5000); // 5 second max render time
    
    // Take success screenshot
    await TestUtils.takeScreenshot(page, 'map-loaded-successfully');
  });

  test('should handle map interactions', async ({ page }) => {
    await helper.waitForMapReady();
    await helper.waitForRenderComplete();
    
    const mapElement = page.locator(TEST_CONFIG.mapSelector);
    
    // Test zoom in
    await page.evaluate(() => {
      if (window.mapComponent && window.mapComponent.map) {
        const view = window.mapComponent.map.getView();
        const currentZoom = view.getZoom();
        view.setZoom(currentZoom + 1);
      }
    });
    
    await helper.waitForRenderComplete();
    
    // Test pan
    await mapElement.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();
    
    await helper.waitForRenderComplete();
    
    // Assert no errors after interactions
    await TestUtils.assertNoErrors(page);
    
    await TestUtils.takeScreenshot(page, 'map-after-interactions');
  });

  test('should load layers properly', async ({ page }) => {
    await helper.waitForMapReady();
    await helper.waitForLayersLoaded();
    
    // Check if layers are loaded
    const layerCount = await page.evaluate(() => {
      if (window.mapComponent && window.mapComponent.map) {
        return window.mapComponent.map.getLayers().getLength();
      }
      return 0;
    });
    
    expect(layerCount).toBeGreaterThan(0);
    
    // Assert no loading errors
    const errorCount = await helper.getErrorCount();
    expect(errorCount).toBe(0);
    
    await TestUtils.takeScreenshot(page, 'layers-loaded');
  });

  test('should handle performance optimizer without errors', async ({ page }) => {
    await helper.waitForMapReady();
    
    // Test the performance optimizer methods that were causing errors
    const optimizerTest = await page.evaluate(() => {
      try {
        if (window.performanceOptimizer) {
          // Test the methods that were previously failing
          const bounds = window.performanceOptimizer._getVisibleBounds4326();
          const zoom = window.performanceOptimizer._getZoom();
          
          return {
            success: true,
            bounds: bounds,
            zoom: zoom,
            boundsValid: bounds && Array.isArray(bounds) && bounds.length === 4,
            zoomValid: typeof zoom === 'number' && zoom > 0
          };
        }
        return { success: false, error: 'Performance optimizer not found' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    expect(optimizerTest.success).toBe(true);
    expect(optimizerTest.boundsValid).toBe(true);
    expect(optimizerTest.zoomValid).toBe(true);
    
    await TestUtils.takeScreenshot(page, 'performance-optimizer-working');
  });

  test('should display diagnostics overlay', async ({ page }) => {
    await helper.waitForMapReady();
    
    // Show diagnostics
    await diagnostics.show();
    
    // Verify diagnostics are visible
    const diagnosticsVisible = await page.locator('#test-diagnostics').isVisible();
    expect(diagnosticsVisible).toBe(true);
    
    // Wait a moment for diagnostics to update
    await page.waitForTimeout(2000);
    
    await TestUtils.takeScreenshot(page, 'diagnostics-overlay');
    
    // Hide diagnostics
    await diagnostics.hide();
  });

  test.afterEach(async ({ page }) => {
    // Collect any test events for debugging
    const events = await helper.getTestEvents();
    console.log('Test events:', events);
    
    // Final error check
    const finalErrorCount = await helper.getErrorCount();
    if (finalErrorCount > 0) {
      console.warn(`Test completed with ${finalErrorCount} errors`);
    }
  });
});
