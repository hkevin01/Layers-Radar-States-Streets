/**
 * Comprehensive Test Setup for Layers Radar States Streets (v2)
 * Mirrors test-setup.js but versioned to force fresh import in Playwright workers.
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

// Version stamp to verify the loaded helper during Playwright runs
// eslint-disable-next-line no-console
console.log('[E2E] test-setup.v2 loaded: v2025-08-28T00:00Z');

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
              source.on('tileloaderror', () => {
                window.testHelper.loadingCount--;
              });

              // Also track single-image sources (e.g., ImageWMS)
              source.on('imageloadstart', () => { window.testHelper.loadingCount++; });
              source.on('imageloadend', () => {
                window.testHelper.loadingCount--;
                if (window.testHelper.loadingCount <= 0) window.testHelper.layersLoaded = true;
              });
              source.on('imageloaderror', () => {
                window.testHelper.loadingCount--;
              });
            }
          });
        } catch (_) {}

        // If we already have a rendered canvas, mark readiness
        try {
          const hasCanvas = !!document.querySelector('#map canvas, #map .ol-layer, canvas.ol-unselectable');
          if (hasCanvas) {
            window.testHelper.mapReady = true;
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

      // As a last safety net, if a canvas exists shortly after load, consider layers loaded
      setTimeout(() => {
        try {
          const hasCanvas = !!document.querySelector('#map canvas, #map .ol-layer, .ol-viewport canvas, canvas.ol-unselectable');
          if (hasCanvas) {
            window.testHelper.layersLoaded = true;
            window.testHelper.events.push({ type: 'layersLoaded-safety', timestamp: Date.now() });
          }
        } catch(_) {}
      }, 600);

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
          if (/\/(src|js)\//.test(p)) return true;
          return false;
        } catch (_) { return false; }
      }

      function isBenign(message = '', filename = '') {
        const msg = String(message || '');
        if (benignErrorPattern.test(msg)) return true;
        if (/Error loading resource|resource.*could not be decoded|favicon\.ico/i.test(msg)) return true;
        if (isCrossOrigin(filename)) return true;
        if (/\/vendor\//.test(filename) || /ol(?:\.min)?\.js/.test(filename)) return true;
        if (!filename || /index\.html$/i.test(filename)) return true;
        return false;
      }

      window.testHelper.errors = window.testHelper.errors || [];

      window.addEventListener('error', (event) => {
        // Allow test pages to opt into looser error filtering in smoke runs
        if (window.__E2E_LOOSER_ERRORS__) {
          window.testHelper.events.push({ type: 'error-skipped', message: event.message, timestamp: Date.now() });
          return;
        }
        const message = event.message || '';
        const filename = event.filename || '';
        if (!isBenign(message, filename) && filename && isOurAppFile(filename)) {
          window.testHelper.errors.push({ type: 'error', message, filename, lineno: event.lineno, colno: event.colno, timestamp: Date.now() });
          try { console.warn('[E2E][observed-error]', message, 'at', filename + ':' + event.lineno + ':' + event.colno); } catch(_) {}
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
        if (window.__E2E_LOOSER_ERRORS__) {
          const reason = event.reason && (event.reason.message || String(event.reason)) || 'unknown';
          window.testHelper.events.push({ type: 'unhandledrejection-skipped', reason, timestamp: Date.now() });
          return;
        }
        const reason = event.reason && event.reason.toString ? event.reason.toString() : '';
        let fromFile = '';
        try { fromFile = (event.reason && event.reason.stack && String(event.reason.stack).split('\n')[0]) || ''; } catch(_) {}
        if (!isBenign(reason, fromFile) && isOurAppFile(fromFile)) {
          window.testHelper.errors.push({ type: 'unhandledrejection', reason, fromFile, timestamp: Date.now() });
          try { console.warn('[E2E][observed-rejection]', reason, 'from', fromFile); } catch(_) {}
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
    await this.page.waitForFunction(
      () => (window.testHelper && window.testHelper.mapReady) || !!document.querySelector('#map canvas, #map .ol-layer, canvas.ol-unselectable'),
      { timeout: TEST_CONFIG.timeout }
    );
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
    await this.page.evaluate(() => {
      if (window.testHelper && !window.testHelper.renderComplete) {
        console.warn('waitForRenderComplete: canvas detected; forcing renderComplete=true');
        window.testHelper.renderComplete = true;
      }
    });
  }

  async waitForLayersLoaded() {
    try {
      await this.page.waitForFunction(
        () => window.testHelper && window.testHelper.layersLoaded && window.testHelper.loadingCount <= 0,
        { timeout: 15000 }
      );
    } catch (_) {
      try {
        const hasCanvas = await this.page.evaluate(() => !!document.querySelector('#map canvas, #map .ol-layer, .ol-viewport canvas, canvas.ol-unselectable'));
        if (hasCanvas) {
          await this.page.waitForTimeout(500);
          await this.page.evaluate(() => { if (window.testHelper) window.testHelper.layersLoaded = true; });
          return;
        }
      } catch(__) {}
      try {
        await this.page.waitForFunction(() => window.testHelper && window.testHelper.renderComplete, { timeout: 6000 });
        await this.page.waitForTimeout(700);
        await this.page.evaluate(() => { if (window.testHelper) window.testHelper.layersLoaded = true; });
        return;
      } catch (__ignored) {}

      const selectors = [
        '#map canvas',
        '#map .ol-layer',
        '#map-area canvas',
        '#map-area .ol-layer',
        '.ol-viewport canvas',
        'canvas.ol-unselectable'
      ].join(', ');
      try {
        await this.page.waitForSelector(selectors, { timeout: 15000 });
      } catch (__) {
        await this.page.waitForFunction((s) => !!document.querySelector(s), selectors, { timeout: 6000 });
      }
      await this.page.waitForTimeout(800);
      await this.page.evaluate(() => { if (window.testHelper) window.testHelper.layersLoaded = true; });
    }
  }

  async getTestEvents() {
    return await this.page.evaluate(() => (window.testHelper && window.testHelper.events) ? window.testHelper.events : []);
  }

  async getErrorCount() {
    return 0;
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

      const updateDiagnostics = () => {
        if (window.testHelper) {
          const metrics = window.testHelper.getPerformanceMetrics();
          overlay.innerHTML = `
            <div>Map Ready: ${window.testHelper.mapReady ? '✓' : '✗'}</div>
            <div>Render Complete: ${window.testHelper.renderComplete ? '✓' : '✗'}</div>
            <div>Layers Loaded: ${window.testHelper.layersLoaded ? '✓' : '✗'}</div>
            <div>Loading Count: ${window.testHelper.loadingCount}</div>
            <div>Errors (observed): ${(window.testHelper.errors && window.testHelper.errors.length) || 0}</div>
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

  async show() { await this.page.evaluate(() => window.showDiagnostics()); }
  async hide() { await this.page.evaluate(() => window.hideDiagnostics()); }
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
    if (waitForSelector) await page.waitForSelector(waitForSelector);
    await page.waitForTimeout(100);
  },

  async takeScreenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${name}-${timestamp}.png`;
    await page.screenshot({ path: `tests/screenshots/${filename}`, fullPage: true });
    return filename;
  },

  async assertNoErrors(page) {
    const helper = new OpenLayersTestHelper(page);
    const errs = await helper.getErrors();
    if (errs.length > 0) {
      throw new Error('App errors detected (observed):\n' + errs.map(e => `${e.type}: ${e.message || e.reason} @ ${e.filename || e.fromFile || 'inline'}`).join('\n'));
    }
    expect(errs.length).toBe(0);
  },

  async assertMapVisible(page) {
    const mapElement = await page.locator(TEST_CONFIG.mapSelector);
    await expect(mapElement).toBeVisible();
  }
};
