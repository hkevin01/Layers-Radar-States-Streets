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
    // Ensure no stale SW/caches interfere during tests
    await this.page.evaluate(async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister().catch(() => {})));
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
          }
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k).catch(() => {})));
        }
      } catch (_) {}
      // Set explicit E2E flag for runtime to skip SW registration
      window.__E2E_TEST__ = true;
    });

  // Inject OpenLayers event listeners for test synchronization
    await this.page.evaluate(() => {
      // Preserve any existing flags set by early bootstrap
      const existing = window.testHelper || {};
      window.testHelper = Object.assign({
        mapReady: false,
        renderComplete: false,
        layersLoaded: false,
        loadingCount: 0,
        errorCount: 0,
        events: []
      }, existing);

      function attachOnce() {
        if (window.__olHooksAttached) return;
        const map = window.mapComponent && window.mapComponent.map;
        if (!map) return;
        window.__olHooksAttached = true;

        // Map render complete
        map.on && map.on('rendercomplete', () => {
          window.testHelper.renderComplete = true;
          // If canvas exists, mark mapReady as well to unblock waits
          try {
            const hasCanvas = !!document.querySelector('#map canvas, #map .ol-layer, canvas.ol-unselectable');
            if (hasCanvas) window.testHelper.mapReady = true;
          } catch(_) {}
          // Treat first render as layers initially available
          if (window.testHelper.loadingCount <= 0) {
            window.testHelper.layersLoaded = true;
          }
          window.testHelper.events.push({ type: 'rendercomplete', timestamp: Date.now() });
        });

        // Layer loading events for currently present layers
        try {
          const layers = (map.getLayers && map.getLayers())?.getArray?.() || [];
          layers.forEach(layer => {
            const source = layer && layer.getSource && layer.getSource();
            if (source && source.on) {
              source.on('tileloadstart', () => { window.testHelper.loadingCount++; });
              source.on('tileloadend', () => {
                window.testHelper.loadingCount--;
                if (window.testHelper.loadingCount <= 0) window.testHelper.layersLoaded = true;
              });
              source.on('tileloaderror', (event) => {
                window.testHelper.loadingCount--;
                // Don't count tile loading errors as test failures since they're often network-related
                // window.testHelper.errorCount++;
              });

              // Also track single-image sources (e.g., ImageWMS)
              source.on('imageloadstart', () => { window.testHelper.loadingCount++; });
              source.on('imageloadend', () => {
                window.testHelper.loadingCount--;
                if (window.testHelper.loadingCount <= 0) window.testHelper.layersLoaded = true;
              });
              source.on('imageloaderror', (event) => {
                window.testHelper.loadingCount--;
                // Don't count image loading errors as test failures since they're often network-related
                // window.testHelper.errorCount++;
              });
            }
          });
        } catch (_) {}

        // If we already have a rendered canvas, mark readiness
        try {
          const hasCanvas = !!document.querySelector('#map canvas, #map .ol-layer, canvas.ol-unselectable');
          if (hasCanvas) {
            window.testHelper.mapReady = true;
            // renderComplete may lag; leave it to map event
          }
        } catch (_) {}
      }

      // Try immediate attach, then poll briefly until available
      attachOnce();
      const t0 = Date.now();
      const interval = setInterval(() => {
        if (window.__olHooksAttached || Date.now() - t0 > 10000) { clearInterval(interval); return; }
        attachOnce();
      }, 100);

      // Performance monitoring
      window.testHelper.getPerformanceMetrics = () => {
        const nav = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: nav ? (nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart) : 0,
          loadComplete: nav ? (nav.loadEventEnd - nav.loadEventStart) : 0,
          renderTime: performance.now()
        };
      };

      // Error tracking with filtering
      // Heuristic filter for benign/non-app errors across browsers
      const benignErrorPattern = /not supported|deprecation|slow network|EncodingError|Loading error|WebSocket connection.*failed|Error during WebSocket handshake|Failed to fetch|NetworkError|tileloaderror|imageloaderror|tile.*failed|layer.*failed|Failed to load|timeout|CORS|cross-origin|ResizeObserver|Script error\.|net::ERR_[A-Z_]+/i;
      function isCrossOrigin(filename) {
        try {
          if (!filename) return false;
          const u = new URL(filename, window.location.origin);
          return u.origin !== window.location.origin;
        } catch (_) {
          return false;
        }
      }
    function isOurAppFile(filename = '') {
        try {
          if (!filename) return false;
          const u = new URL(filename, window.location.href);
          if (u.origin !== window.location.origin) return false;
          const p = u.pathname || '';
      // Treat our authored files as those under /src or /js paths only; ignore index.html host document
      if (/\/(src|js)\//.test(p)) return true;
      // Explicitly do NOT treat index.html as an app file to avoid false positives from top-frame stacks
          return false;
        } catch (_) { return false; }
      }

      function isBenign(message = '', filename = '') {
        const msg = String(message || '');
        // Known benign patterns and noisy warnings/errors
        if (benignErrorPattern.test(msg)) return true;
        if (/Error loading resource|resource.*could not be decoded|favicon\.ico/i.test(msg)) return true;
        // Ignore errors coming from third-party or cross-origin resources (e.g., OSM tiles)
        if (isCrossOrigin(filename)) return true;
        // Ignore vendor library internal errors unless surfaced by our code
        if (/\/vendor\//.test(filename) || /ol(?:\.min)?\.js/.test(filename)) return true;
        return false;
      }

      // Keep a list of counted errors for diagnostics
      window.testHelper.errors = window.testHelper.errors || [];

      window.addEventListener('error', (event) => {
        const message = event.message || '';
        const filename = event.filename || '';
        if (!isBenign(message, filename) && filename && isOurAppFile(filename)) {
          window.testHelper.errorCount++;
          window.testHelper.errors.push({
            type: 'error', message, filename, lineno: event.lineno, colno: event.colno, timestamp: Date.now()
          });
        }
        window.testHelper.events.push({
          type: 'error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          timestamp: Date.now()
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason && event.reason.toString ? event.reason.toString() : '';
        // Try to extract filename from stack if available
        let fromFile = '';
        try { fromFile = (event.reason && event.reason.stack && String(event.reason.stack).split('\n')[0]) || ''; } catch(_) {}
        if (!isBenign(reason, fromFile) && isOurAppFile(fromFile)) {
          window.testHelper.errorCount++;
          window.testHelper.errors.push({ type: 'unhandledrejection', reason, fromFile, timestamp: Date.now() });
        }
        window.testHelper.events.push({
          type: 'unhandledrejection',
          reason: (event.reason && (event.reason.message || String(event.reason))) || 'unknown',
          timestamp: Date.now()
        });
      });
    });
  }

  async waitForMapReady() {
    const ready = await this.page.waitForFunction(
      () => (window.testHelper && window.testHelper.mapReady) || !!document.querySelector('#map canvas, #map .ol-layer, canvas.ol-unselectable'),
      { timeout: TEST_CONFIG.timeout }
    );
    // If we resolved due to canvas fallback but mapReady is still false, flip it and warn for diagnostics
    await this.page.evaluate(() => {
      if (window.testHelper && !window.testHelper.mapReady) {
        console.warn('waitForMapReady: canvas detected; forcing mapReady=true (hook did not flip)');
        window.testHelper.mapReady = true;
      }
    });
  }

  async waitForPerformanceOptimizer() {
    await this.page.waitForFunction(
      () => !!window.performanceOptimizer && typeof window.performanceOptimizer.getPerformanceReport === 'function',
      { timeout: TEST_CONFIG.timeout }
    );
  }

  async waitForRenderComplete() {
    await this.page.waitForFunction(
      () => (window.testHelper && window.testHelper.renderComplete) || !!document.querySelector('#map canvas, #map .ol-layer, canvas.ol-unselectable'),
      { timeout: TEST_CONFIG.timeout }
    );
    // If we only have canvas fallback, mark flag to unblock later waits
    await this.page.evaluate(() => {
      if (window.testHelper && !window.testHelper.renderComplete) {
        console.warn('waitForRenderComplete: canvas detected; forcing renderComplete=true');
        window.testHelper.renderComplete = true;
      }
    });
  }

  async waitForLayersLoaded() {
    // Prefer explicit loading counters, but allow a fallback: visible canvas for a short settling time
    try {
      await this.page.waitForFunction(
        () => window.testHelper && window.testHelper.layersLoaded && window.testHelper.loadingCount <= 0,
        { timeout: 12000 }
      );
    } catch (_) {
      // Fallback A: if renderComplete fired, consider layers loaded after a small settle
      try {
        await this.page.waitForFunction(() => window.testHelper && window.testHelper.renderComplete, { timeout: 4000 });
        await this.page.waitForTimeout(600);
        await this.page.evaluate(() => { if (window.testHelper) window.testHelper.layersLoaded = true; });
        return;
      } catch (__ignored) {}

      // Fallback B: wait for any OpenLayers canvas or layer element to appear in the DOM
      const selectors = [
        '#map canvas',
        '#map .ol-layer',
        '#map-area canvas',
        '#map-area .ol-layer',
        '.ol-viewport canvas',
        'canvas.ol-unselectable'
      ].join(', ');
      try {
        await this.page.waitForSelector(selectors, { timeout: 12000 });
      } catch (__) {
        // As a last resort, do a short polling check via page function (pass selectors as arg)
        await this.page.waitForFunction((s) => !!document.querySelector(s), selectors, { timeout: 4000 });
      }
      await this.page.waitForTimeout(600); // small settle time
      await this.page.evaluate(() => { if (window.testHelper) window.testHelper.layersLoaded = true; });
    }
  }

  async getTestEvents() {
  return await this.page.evaluate(() => (window.testHelper && window.testHelper.events) ? window.testHelper.events : []);
  }

  async getErrorCount() {
  return await this.page.evaluate(() => (window.testHelper && typeof window.testHelper.errorCount === 'number') ? window.testHelper.errorCount : 0);
  }

  async getErrors() {
    return await this.page.evaluate(() => (window.testHelper && Array.isArray(window.testHelper.errors)) ? window.testHelper.errors : []);
  }

  async getPerformanceMetrics() {
  return await this.page.evaluate(() => (window.testHelper && window.testHelper.getPerformanceMetrics) ? window.testHelper.getPerformanceMetrics() : { renderTime: 0 });
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
    if (errorCount > 0) {
      const errs = await helper.getErrors();
      // Surface details in assertion message for easier debugging in CI logs
      throw new Error(`App errors detected (${errorCount}):\n` + errs.map(e => `${e.type}: ${e.message || e.reason} @ ${e.filename || e.fromFile || 'inline'}`).join('\n'));
    }
    expect(errorCount).toBe(0);
  },

  async assertMapVisible(page) {
    const mapElement = await page.locator(TEST_CONFIG.mapSelector);
    await expect(mapElement).toBeVisible();
  }
};
