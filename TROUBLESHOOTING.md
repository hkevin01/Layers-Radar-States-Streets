# Troubleshooting

## Blank Map Checklist

Use this checklist when the map renders blank or tiles do not appear:

- Verify DOM/CSS: ensure a single `#map` exists and has non-zero size (100% width, 100vh height, min-height 320px).
- OpenLayers import available: check that `window.ol` exists (if CDN) or module imports are correct. If CDN failed, use the documented local fallback in `public/vendor/ol`.
- HTTPS-only tile sources: avoid mixed content; upgrade any `http:` tile URLs to `https:`. On HTTPS, the app logs a warning if `http:` is detected.
- crossOrigin: set `crossOrigin: 'anonymous'` on OSM/XYZ sources to avoid canvas tainting.
- Call `map.updateSize()` after first render and on resize; debounce to 150–250ms.
- Projection sanity: centers in EPSG:3857 for OpenLayers v8; transforms via `ol.proj.fromLonLat` and `transformExtent`.
- PerformanceOptimizer guards: `_getVisibleBounds4326` returns a safe default when map/view/size are missing; avoids TypeError.
- Diagnostics: press `D` to toggle overlay; use `window.__getMapDiagnostics()` for current size/center/extent and inspect logs.

If issues persist, open DevTools Console and look for errors; capture a screenshot and the output of `__getMapDiagnostics()`.

## Blank Map Checklist (OpenLayers)

- Verify the container exists and has size:
   - Ensure `#map` is present in HTML.
   - CSS gives non-zero height/width (e.g., `height: calc(100vh - header - footer)` or `60vh`).
- Confirm OpenLayers loaded:
   - Check `window.ol` in DevTools console.
   - If CDN fails, the app attempts a fallback `/vendor/ol/ol.js`. See README for setup.
- Watch console diagnostics:
   - Look for `Diagnostics[first-render]` logs: size, center, zoom, extent.
   - Check for `Bounds fallback used` warnings indicating missing view/size.
- Resize handling:
   - `window.onresize` triggers `map.updateSize()`. Ensure no CSS keeps height at 0.
- Mixed content and CORS:
   - All tile sources should be `https` and use `crossOrigin: 'anonymous'` where needed.
- Projection issues:
   - Vector data must declare `dataProjection: 'EPSG:4326'` and be rendered to `'EPSG:3857'`.
- Performance optimizer guards:
   - `_getVisibleBounds4326()` now returns a safe default instead of throwing.

If still blank, open DevTools Network tab and confirm tiles are requested. Use the Cypress test `tests/cypress/e2e/map-interactions.cy.js` to automate verification.

## Weather Radar Application Troubleshooting Guide

This guide helps diagnose and fix common issues with the Layers-Radar-States-Streets weather radar applications.

## Quick Diagnostics

### 1. Run the Automated Test Suite

```bash
./test-weather-radar.sh
```

### 2. Open the Diagnostic Page

Visit: `http://localhost:8082/public/diagnostic-complete.html`

### 3. Check Console Errors

Press F12 in your browser and check the Console tab for errors.

## Common Issues and Solutions

### White/Blank Screen

**Symptoms:** Page loads but shows a white screen or loading indicator forever.

**Causes & Solutions:**

1. **Module Import Errors**
   - Check browser console for "Failed to resolve module" errors
   - Ensure ES modules are served with correct MIME type
   - Verify all import paths are correct relative to file location

2. **OpenLayers Not Loading**
   - Check if CDN is accessible: `https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js`
   - Verify console shows "OpenLayers v8.2.0" or similar
   - Ensure script loads before module imports

3. **Service Worker Issues**
   - Disable service worker in browser dev tools
   - Clear browser cache and reload
   - Check service worker registration errors in console

### Map Not Rendering / Tiles Not Loading

**Symptoms:** Map container appears but no tiles load, or only base map without radar.

**Solutions:**

1. **CORS Issues**

   ```javascript
   // Ensure crossOrigin is set for tile sources
   source: new ol.source.XYZ({
      url: 'https://...',
      crossOrigin: 'anonymous'
   })
   ```

2. **HTTP vs HTTPS Mixed Content**
   - If accessing over HTTPS, ensure all tile URLs use HTTPS
   - Check browser console for "Mixed Content" warnings

3. **Tile Server Connectivity**
   - Test NEXRAD: `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/4/8/6.png`
   - Test OSM: `https://tile.openstreetmap.org/4/8/6.png`

4. **Tile URL Template Issues**
   - Verify {z}/{x}/{y} parameters are correct
   - Check tile coordinate system (TMS vs XYZ)

### Service Worker Registration Fails

**Symptoms:** Console shows service worker registration errors.

**Solutions:**

1. **HTTPS/Localhost Requirement**
   - Service workers only work on HTTPS or localhost
   - Use `http://localhost:8082` not `http://127.0.0.1:8082`

2. **Scope Issues**

   ```javascript
   navigator.serviceWorker.register('/public/sw.js', {
      scope: '/public/'  // Ensure scope matches file paths
   });
   ```

3. **Service Worker File Path**
   - Ensure sw.js is accessible at the registered URL
   - Check server serves .js files with correct MIME type

### Module Import/ESM Errors

**Symptoms:** "Failed to resolve module specifier" or similar import errors.

**Solutions:**

1. **Relative Path Issues**

   ```javascript
   // From public/weather-radar.html
   import { init } from './js/weather-init.js';  // ✅ Correct

   // From public/apps/modern-weather-radar.html
   import { init } from '../js/weather-init.js'; // ✅ Correct
   ```

2. **Missing File Extensions**

   ```javascript
   import { init } from './weather-init.js';  // ✅ Include .js
   import { init } from './weather-init';     // ❌ Missing .js
   ```

3. **Server MIME Type**
   - Ensure server serves .js files as `text/javascript`
   - Check response headers in Network tab

### Docker Issues

**Symptoms:** Container fails to start or is unhealthy.

**Solutions:**

1. **Port Conflicts**
   ```bash
   # Use alternate port
   HOST_PORT=8083 docker-compose up -d

   # Or use the run.sh script (auto-finds free port)
   ./run.sh
   ```

2. **Container Build Issues**
   ```bash
   # Rebuild container
   docker-compose build --no-cache
   ```

3. **Health Check Failures**
   ```bash
   # Check container logs
   docker logs weather-radar

   # Check if server is binding correctly
   docker exec weather-radar netstat -tlnp
   ```

### PWA/Manifest Issues

**Symptoms:** App doesn't install as PWA or manifest errors.

**Solutions:**

1. **Manifest Path**

   ```html
   <!-- Correct path from any public/* file -->
   <link rel="manifest" href="/manifest.json">
   ```

2. **Manifest Format**
   - Validate JSON syntax
   - Ensure required fields: name, start_url, display, icons

3. **Icon Paths**
   - Verify icon files exist at specified paths
   - Use absolute paths in manifest: `/assets/icons/icon-144x144.png`

## Network Diagnostics

### Test External Services

```bash
# Test NEXRAD tiles
curl -I "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/4/8/6.png"

# Test OpenStreetMap tiles
curl -I "https://tile.openstreetmap.org/4/8/6.png"

# Test OpenLayers CDN
curl -I "https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js"
```

### Test Local Resources

```bash
# Test main app
curl -I "http://localhost:8082/public/weather-radar.html"

# Test modern app
curl -I "http://localhost:8082/public/apps/modern-weather-radar.html"

# Test JS modules
curl -I "http://localhost:8082/public/js/weather-init.js"

# Test manifest
curl -I "http://localhost:8082/manifest.json"
```

## Browser Compatibility



### Minimum Requirements

- **ES Modules:** Chrome 61+, Firefox 60+, Safari 10.1+
- **Service Workers:** Chrome 40+, Firefox 44+, Safari 11.1+
- **WebGL (for maps):** Chrome 9+, Firefox 4+, Safari 5.1+

### Testing in Different Browsers

1. **Chrome/Edge**
   - Generally best compatibility
   - Good dev tools for debugging

2. **Firefox**
   - May have stricter CORS policies
   - Check console for security warnings

3. **Safari**
   - May require user interaction for geolocation
   - Stricter service worker policies

4. **Mobile Browsers**
   - Test touch controls
   - Check viewport meta tag
   - Verify responsive design

## Performance Issues

### Slow Map Loading

1. **Reduce Initial Layers**
   - Start with only base map visible
   - Load radar/overlay layers on user request

2. **Optimize Tile Caching**
   - Implement proper cache headers
   - Use service worker for offline tiles

3. **Debounce Map Events**

  ```javascript
  let moveTimeout;
  map.on('moveend', () => {
     clearTimeout(moveTimeout);
     moveTimeout = setTimeout(() => {
        // Handle move end
     }, 300);
  });
  ```

### High Memory Usage

1. **Limit Zoom Levels**

   ```javascript
   view: new ol.View({
         minZoom: 3,  // Prevent over-zooming
         maxZoom: 15
   })
   ```

2. **Dispose Unused Layers**

   ```javascript
   // Remove and dispose layer when not needed
   map.removeLayer(layer);
   layer.dispose();
   ```

## Getting Help

### Debug Information

When reporting issues, include:

1. **Browser & Version:** Chrome 91, Firefox 89, etc.
2. **Console Errors:** Copy full error messages
3. **Network Tab:** Check for failed requests
4. **Test Results:** Output from `./test-weather-radar.sh`
5. **Diagnostic Page:** Screenshot of `diagnostic-complete.html`

### Enable Debug Mode

Add `?debug=1` to any URL to see debug information:

- `http://localhost:8082/public/weather-radar.html?debug=1`
- `http://localhost:8082/public/apps/modern-weather-radar.html?debug=1`

### Check Application Logs

```bash
# Docker logs
docker logs weather-radar

# Follow live logs
docker logs -f weather-radar

# Run.sh script logs
./run.sh logs
```
