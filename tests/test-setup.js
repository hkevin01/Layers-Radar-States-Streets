/**
 * Comprehensive Test Setup for Layers Radar States Streets
 * 
 * This script sets up testing infrastructure with:
 * - Cypress for interactive E2E testing
 * - Selenium WebDriver for cross-browser testing
 * - Playwright for multi-browser E2E testing  
 * - OpenLayers event hooks for test synchronization
 * - Test diagnostics overlay for debugging
 */

import { expect } from '@playwright/test';

// Global test configuration
export const TEST_CONFIG = {
  baseUrl: 'http://127.0.0.1:8082',
  mapSelector: '#map',
  timeout: 30000,
  retries: 3,
  viewport: { width: 1280, height: 720 },
  slowMo: 100
};

// OpenLayers event hooks for test synchronization
export class OpenLayersTestHelper {
  constructor(page) {
    this.page = page;
    this.mapReady = false;
    this.renderComplete = false;
    this.layersLoaded = false;
  }

  async setupEventHooks() {
    // Inject OpenLayers event listeners for test synchronization
    await this.page.evaluate(() => {
      window.testHelper = {
        mapReady: false,
        renderComplete: false,
        layersLoaded: false,
        loadingCount: 0,
        errorCount: 0,
        events: []
      };

      // Hook into map ready event
      if (window.mapComponent && window.mapComponent.map) {
        const map = window.mapComponent.map;
        
        // Map render complete
        map.on('rendercomplete', () => {
          window.testHelper.renderComplete = true;
          window.testHelper.events.push({
            type: 'rendercomplete', 
            timestamp: Date.now()
          });
        });

        // Layer loading events
        map.getLayers().forEach(layer => {
          if (layer.getSource) {
            const source = layer.getSource();
            
            // Tile loading
            if (source.on) {
              source.on('tileloadstart', () => {
                window.testHelper.loadingCount++;
              });
              
              source.on('tileloadend', () => {
                window.testHelper.loadingCount--;
                if (window.testHelper.loadingCount <= 0) {
                  window.testHelper.layersLoaded = true;
                }
              });
              
              source.on('tileloaderror', () => {
                window.testHelper.loadingCount--;
                window.testHelper.errorCount++;
              });
            }
          }
        });

        window.testHelper.mapReady = true;
      }

      // Performance monitoring
      window.testHelper.getPerformanceMetrics = () => {
        const perfEntries = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.domContentLoadedEventStart,
          loadComplete: perfEntries.loadEventEnd - perfEntries.loadEventStart,
          renderTime: performance.now()
        };
      };

      // Error tracking
      window.addEventListener('error', (event) => {
        window.testHelper.errorCount++;
        window.testHelper.events.push({
          type: 'error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          timestamp: Date.now()
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        window.testHelper.errorCount++;
        window.testHelper.events.push({
          type: 'unhandledrejection',
          reason: event.reason.toString(),
          timestamp: Date.now()
        });
      });
    });
  }

  async waitForMapReady() {
    await this.page.waitForFunction(
      () => window.testHelper && window.testHelper.mapReady,
      { timeout: TEST_CONFIG.timeout }
    );
  }

  async waitForRenderComplete() {
    await this.page.waitForFunction(
      () => window.testHelper && window.testHelper.renderComplete,
      { timeout: TEST_CONFIG.timeout }
    );
  }

  async waitForLayersLoaded() {
    await this.page.waitForFunction(
      () => window.testHelper && window.testHelper.layersLoaded && window.testHelper.loadingCount <= 0,
      { timeout: TEST_CONFIG.timeout }
    );
  }

  async getTestEvents() {
    return await this.page.evaluate(() => window.testHelper.events);
  }

  async getErrorCount() {
    return await this.page.evaluate(() => window.testHelper.errorCount);
  }

  async getPerformanceMetrics() {
    return await this.page.evaluate(() => window.testHelper.getPerformanceMetrics());
  }
}

// Test diagnostics overlay
export class DiagnosticsOverlay {
  constructor(page) {
    this.page = page;
  }

  async injectOverlay() {
    await this.page.evaluate(() => {
      // Create diagnostics overlay
      const overlay = document.createElement('div');
      overlay.id = 'test-diagnostics';
      overlay.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        min-width: 200px;
        display: none;
      `;
      document.body.appendChild(overlay);

      // Update diagnostics every second
      const updateDiagnostics = () => {
        if (window.testHelper) {
          const metrics = window.testHelper.getPerformanceMetrics();
          overlay.innerHTML = `
            <div>Map Ready: ${window.testHelper.mapReady ? '✓' : '✗'}</div>
            <div>Render Complete: ${window.testHelper.renderComplete ? '✓' : '✗'}</div>
            <div>Layers Loaded: ${window.testHelper.layersLoaded ? '✓' : '✗'}</div>
            <div>Loading Count: ${window.testHelper.loadingCount}</div>
            <div>Errors: ${window.testHelper.errorCount}</div>
            <div>Render Time: ${metrics.renderTime.toFixed(2)}ms</div>
            <div>Events: ${window.testHelper.events.length}</div>
          `;
        }
      };

      window.showDiagnostics = () => {
        overlay.style.display = 'block';
        setInterval(updateDiagnostics, 1000);
      };

      window.hideDiagnostics = () => {
        overlay.style.display = 'none';
      };
    });
  }

  async show() {
    await this.page.evaluate(() => window.showDiagnostics());
  }

  async hide() {
    await this.page.evaluate(() => window.hideDiagnostics());
  }
}

// Common test utilities
export const TestUtils = {
  async waitForElement(page, selector, options = {}) {
    return await page.waitForSelector(selector, {
      timeout: TEST_CONFIG.timeout,
      ...options
    });
  },

  async clickAndWait(page, selector, waitForSelector = null) {
    await page.click(selector);
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector);
    }
    await page.waitForTimeout(100); // Small delay for animations
  },

  async takeScreenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${name}-${timestamp}.png`;
    await page.screenshot({ 
      path: `tests/screenshots/${filename}`,
      fullPage: true 
    });
    return filename;
  },

  async assertNoErrors(page) {
    const helper = new OpenLayersTestHelper(page);
    const errorCount = await helper.getErrorCount();
    expect(errorCount).toBe(0);
  },

  async assertMapVisible(page) {
    const mapElement = await page.locator(TEST_CONFIG.mapSelector);
    await expect(mapElement).toBeVisible();
  }
};
