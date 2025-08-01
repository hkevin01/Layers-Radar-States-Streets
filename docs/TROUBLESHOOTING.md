# Troubleshooting Guide

## Table of Contents

- [Quick Fixes](#quick-fixes)
- [Installation Issues](#installation-issues)
- [Runtime Problems](#runtime-problems)
- [Performance Issues](#performance-issues)
- [Browser Compatibility](#browser-compatibility)
- [Mobile Device Issues](#mobile-device-issues)
- [PWA and Offline Issues](#pwa-and-offline-issues)
- [Accessibility Problems](#accessibility-problems)
- [Data Loading Issues](#data-loading-issues)
- [Development Issues](#development-issues)

---

## Quick Fixes

### Common Solutions (Try These First)

#### 🔄 Clear Browser Cache and Data
```bash
# Chrome: Developer Tools → Application → Storage → Clear Storage
# Firefox: Developer Tools → Storage → Clear All
# Safari: Develop → Empty Caches

# Or use keyboard shortcuts:
# Chrome/Edge: Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
# Firefox: Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
```

#### 🔃 Force Refresh
```bash
# Hard refresh (bypasses cache)
# Chrome/Firefox/Edge: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
# Safari: Cmd+Option+R
```

#### 📱 Check Service Worker
```javascript
// Open browser console and run:
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(registration => {
      console.log('SW Registration:', registration);
      // Unregister if needed: registration.unregister();
    });
  });
```

#### 🧹 Reset Application State
```javascript
// Clear all local storage (run in console)
localStorage.clear();
sessionStorage.clear();
```

---

## Installation Issues

### Node.js and npm Problems

#### ❌ Problem: "Node.js version not supported"
```bash
# Check current version
node --version
npm --version

# Required: Node.js 16+ and npm 8+
```

**Solution:**
```bash
# Install Node Version Manager (nvm)
# Windows: Download from https://github.com/coreybutler/nvm-windows
# macOS/Linux:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18 LTS
nvm install 18
nvm use 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x or higher
```

#### ❌ Problem: "npm install fails with permission errors"
```bash
# Error: EACCES permission denied
```

**Solution (macOS/Linux):**
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to ~/.bashrc or ~/.zshrc:
export PATH=~/.npm-global/bin:$PATH

# Reload shell and retry
source ~/.bashrc
npm install
```

**Solution (Windows):**
```bash
# Run as Administrator or use:
npm install --no-optional
```

#### ❌ Problem: "Module not found" errors
```bash
# Error: Cannot resolve module './src/components/...'
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for case sensitivity issues (especially on Windows)
# Ensure file paths match exactly: 'Map-Component' vs 'map-component'
```

### Development Server Issues

#### ❌ Problem: "Port 8080 already in use"
```bash
# Error: EADDRINUSE :::8080
```

**Solution:**
```bash
# Find process using port 8080
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
npm start -- -p 3000
npx http-server public -p 3000
```

#### ❌ Problem: "Cannot GET /" error
```bash
# 404 error when accessing localhost
```

**Solution:**
```bash
# Ensure you're in the correct directory
cd /path/to/Layers-Radar-States-Streets

# Check if public/index.html exists
ls public/index.html

# Start server from project root
npm start

# Alternative: Direct file access
open public/index.html  # macOS
start public/index.html  # Windows
```

---

## Runtime Problems

### Map Loading Issues

#### ❌ Problem: "Map container not found"
```javascript
// Error: "Cannot read property 'style' of null"
```

**Solution:**
```javascript
// Ensure map container exists before initialization
const container = document.getElementById('map');
if (!container) {
  console.error('Map container not found');
  return;
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initializeApp('map'));
} else {
  initializeApp('map');
}
```

#### ❌ Problem: "OpenLayers fails to load"
```javascript
// Error: "ol is not defined" or map renders incorrectly
```

**Solution:**
```html
<!-- Verify OpenLayers is loaded correctly -->
<script src="https://cdn.jsdelivr.net/npm/ol@7.1.0/dist/ol.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@7.1.0/ol.css">

<!-- Check in console -->
<script>
  console.log('OpenLayers version:', ol?.VERSION || 'Not loaded');
</script>
```

#### ❌ Problem: "Layers not displaying"
```javascript
// Layers load but don't appear on map
```

**Solution:**
```javascript
// Check layer configuration
const layer = map.getLayer('radar');
console.log('Layer visibility:', layer?.getVisible());
console.log('Layer opacity:', layer?.getOpacity());
console.log('Layer source:', layer?.getSource());

// Check layer order (newer layers on top)
const layers = map.getLayers().getArray();
console.log('Layer order:', layers.map(l => l.get('name')));

// Verify layer bounds
const source = layer.getSource();
const extent = source.getExtent();
console.log('Layer extent:', extent);
```

### UI Component Issues

#### ❌ Problem: "Controls not responding"
```javascript
// UI buttons don't work or appear disabled
```

**Solution:**
```javascript
// Check for JavaScript errors
console.error('Check for errors in console');

// Verify event listeners are attached
const button = document.querySelector('.layer-toggle');
const listeners = getEventListeners(button); // Chrome DevTools
console.log('Event listeners:', listeners);

// Manually test component
if (window.uiControls) {
  window.uiControls.destroy();
  window.uiControls = new UIControls(window.mapComponent, container);
}
```

#### ❌ Problem: "Mobile controls not working"
```javascript
// Touch gestures don't work on mobile devices
```

**Solution:**
```css
/* Ensure touch-action is not disabled */
#map {
  touch-action: manipulation;
}

/* Check for pointer-events */
.ui-controls {
  pointer-events: auto;
}
```

```javascript
// Verify touch event support
console.log('Touch support:', 'ontouchstart' in window);
console.log('Pointer events:', 'onpointerdown' in window);

// Test touch listeners
element.addEventListener('touchstart', (e) => {
  console.log('Touch start:', e.touches.length);
}, { passive: false });
```

---

## Performance Issues

### Slow Loading Times

#### ❌ Problem: "Application takes too long to load"
```javascript
// Page load time > 5 seconds
```

**Solution:**
```javascript
// Measure loading performance
const perfData = {
  navigationStart: performance.timing.navigationStart,
  domContentLoaded: performance.timing.domContentLoadedEventEnd,
  loadComplete: performance.timing.loadEventEnd
};

const domTime = perfData.domContentLoaded - perfData.navigationStart;
const totalTime = perfData.loadComplete - perfData.navigationStart;

console.log('DOM load time:', domTime + 'ms');
console.log('Total load time:', totalTime + 'ms');

// Check resource loading
performance.getEntriesByType('resource').forEach(resource => {
  if (resource.duration > 1000) {
    console.warn('Slow resource:', resource.name, resource.duration + 'ms');
  }
});
```

**Optimization Steps:**
```html
<!-- Preload critical resources -->
<link rel="preload" href="src/main.js" as="script">
<link rel="preload" href="https://cdn.jsdelivr.net/npm/ol@7.1.0/dist/ol.js" as="script">

<!-- Use CDN for external libraries -->
<script src="https://cdn.jsdelivr.net/npm/ol@7.1.0/dist/ol.js"></script>
```

### Memory Issues

#### ❌ Problem: "Browser becomes slow or crashes"
```javascript
// High memory usage or memory leaks
```

**Solution:**
```javascript
// Monitor memory usage
if (performance.memory) {
  const memory = performance.memory;
  console.log('Used heap:', (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB');
  console.log('Total heap:', (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB');
  console.log('Heap limit:', (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB');
}

// Check for memory leaks
const checkMemoryLeak = () => {
  const before = performance.memory?.usedJSHeapSize || 0;
  
  // Trigger potential leak
  for (let i = 0; i < 100; i++) {
    window.mapComponent.addLayer({
      type: 'test',
      url: '/fake/{z}/{x}/{y}.png'
    });
  }
  
  // Force garbage collection (if available)
  if (window.gc) window.gc();
  
  const after = performance.memory?.usedJSHeapSize || 0;
  console.log('Memory delta:', (after - before) / 1024 / 1024 + ' MB');
};

// Cleanup components properly
const cleanup = () => {
  if (window.uiControls) window.uiControls.destroy();
  if (window.mobileControls) window.mobileControls.destroy();
  if (window.dataVisualization) window.dataVisualization.destroy();
  if (window.accessibilityHelper) window.accessibilityHelper.destroy();
  if (window.performanceOptimizer) window.performanceOptimizer.destroy();
};
```

---

## Browser Compatibility

### ES6 Module Issues

#### ❌ Problem: "Modules not supported in this browser"
```javascript
// Error: "Unexpected token 'import'"
```

**Solution:**
```html
<!-- Check browser support -->
<script>
  if (!('noModule' in HTMLScriptElement.prototype)) {
    document.write('<p>Your browser does not support ES6 modules. Please update your browser.</p>');
  }
</script>

<!-- Provide fallback for older browsers -->
<script nomodule>
  alert('This application requires a modern browser with ES6 module support.');
</script>
```

### CORS Issues

#### ❌ Problem: "CORS policy blocks requests"
```javascript
// Error: "Access blocked by CORS policy"
```

**Solution:**
```bash
# For development, start server with CORS enabled
npx http-server public -p 8080 --cors

# Or use Chrome with disabled security (DEVELOPMENT ONLY)
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev"
```

```javascript
// Check CORS in code
fetch('/api/data')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .catch(error => {
    console.error('CORS or network error:', error);
    // Implement fallback or show user-friendly message
  });
```

---

## Mobile Device Issues

### Touch Gestures Problems

#### ❌ Problem: "Pinch-to-zoom not working"
```css
/* Common CSS conflicts */
```

**Solution:**
```css
/* Ensure proper touch handling */
#map {
  touch-action: manipulation;
  -webkit-overflow-scrolling: touch;
}

/* Disable text selection during gestures */
.map-container {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Fix iOS Safari issues */
html, body {
  height: 100%;
  overflow: hidden;
}
```

#### ❌ Problem: "Drawer doesn't open on mobile"
```javascript
// Mobile drawer not responding to swipe
```

**Solution:**
```javascript
// Check for touch event conflicts
const debugTouch = (element) => {
  element.addEventListener('touchstart', (e) => {
    console.log('Touch start:', e.touches[0].clientY);
  });
  
  element.addEventListener('touchmove', (e) => {
    console.log('Touch move:', e.touches[0].clientY);
    // Ensure preventDefault is not blocking gesture
  });
  
  element.addEventListener('touchend', (e) => {
    console.log('Touch end');
  });
};

// Apply to mobile drawer
debugTouch(document.querySelector('.mobile-drawer'));
```

### Viewport Issues

#### ❌ Problem: "App doesn't fit mobile screen"
```html
<!-- Missing or incorrect viewport meta tag -->
```

**Solution:**
```html
<!-- Correct viewport configuration -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

<!-- For PWA -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
```

```css
/* Responsive layout fixes */
@media screen and (max-width: 768px) {
  .ui-controls {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }
  
  .ui-controls.open {
    transform: translateY(0);
  }
}
```

---

## PWA and Offline Issues

### Service Worker Problems

#### ❌ Problem: "Service worker not registering"
```javascript
// SW registration fails silently
```

**Solution:**
```javascript
// Debug service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('SW registered:', registration);
      
      // Check update status
      registration.addEventListener('updatefound', () => {
        console.log('SW update found');
      });
    })
    .catch(error => {
      console.error('SW registration failed:', error);
      
      // Common causes:
      // 1. sw.js not found (404)
      // 2. Syntax error in sw.js
      // 3. HTTPS required (except localhost)
      // 4. Scope issues
    });
} else {
  console.warn('Service workers not supported');
}

// Check service worker status
navigator.serviceWorker.ready.then(registration => {
  console.log('SW ready:', registration.active?.state);
});
```

#### ❌ Problem: "App doesn't work offline"
```javascript
// Offline functionality not working
```

**Solution:**
```javascript
// Check cache status
caches.keys().then(cacheNames => {
  console.log('Available caches:', cacheNames);
  
  cacheNames.forEach(cacheName => {
    caches.open(cacheName).then(cache => {
      cache.keys().then(requests => {
        console.log(`${cacheName} contains:`, requests.map(r => r.url));
      });
    });
  });
});

// Test offline mode
window.addEventListener('online', () => {
  console.log('Back online');
  document.body.classList.remove('offline');
});

window.addEventListener('offline', () => {
  console.log('Gone offline');
  document.body.classList.add('offline');
});

// Manual offline test
if (!navigator.onLine) {
  console.log('Currently offline');
}
```

### Installation Issues

#### ❌ Problem: "Install prompt doesn't appear"
```javascript
// PWA install banner not showing
```

**Solution:**
```javascript
// Check PWA installability
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt available');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install button
  document.getElementById('install-button').style.display = 'block';
});

// Check if already installed
window.addEventListener('appinstalled', () => {
  console.log('PWA installed');
});

// Debug manifest
fetch('/manifest.json')
  .then(response => response.json())
  .then(manifest => {
    console.log('Manifest:', manifest);
    
    // Check required fields
    const required = ['name', 'short_name', 'start_url', 'display', 'icons'];
    required.forEach(field => {
      if (!manifest[field]) {
        console.error(`Missing manifest field: ${field}`);
      }
    });
  });
```

---

## Accessibility Problems

### Screen Reader Issues

#### ❌ Problem: "Screen reader not announcing changes"
```javascript
// Dynamic content not accessible
```

**Solution:**
```html
<!-- Add ARIA live regions -->
<div id="announcements" aria-live="polite" aria-atomic="true" class="sr-only"></div>
<div id="status" aria-live="assertive" aria-atomic="true" class="sr-only"></div>
```

```javascript
// Proper announcement function
function announce(message, priority = 'polite') {
  const announcer = document.getElementById(
    priority === 'assertive' ? 'status' : 'announcements'
  );
  
  if (announcer) {
    // Clear previous message
    announcer.textContent = '';
    
    // Add new message after brief delay
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }
}

// Test screen reader announcements
announce('Radar layer enabled');
announce('Map zoom level changed to 10');
```

#### ❌ Problem: "Keyboard navigation broken"
```javascript
// Tab order or focus management issues
```

**Solution:**
```css
/* Ensure focus indicators are visible */
button:focus,
input:focus,
select:focus {
  outline: 2px solid #007cba;
  outline-offset: 2px;
}

/* Don't hide focus outline unless providing alternative */
*:focus {
  outline: none; /* ❌ Don't do this */
}

/* ✅ Better approach */
.custom-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5);
}
```

```javascript
// Debug focus order
function debugFocusOrder() {
  const focusableElements = document.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  focusableElements.forEach((element, index) => {
    element.dataset.focusOrder = index;
    console.log(`Focus ${index}:`, element);
  });
}

// Test keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    console.log('Tab to:', document.activeElement);
  }
});
```

---

## Data Loading Issues

### API Connection Problems

#### ❌ Problem: "Radar data not loading"
```javascript
// Weather API requests failing
```

**Solution:**
```javascript
// Debug API requests
const debugAPI = async (url) => {
  try {
    console.log('Fetching:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    return data;
    
  } catch (error) {
    console.error('API Error:', error);
    
    // Check common issues:
    // 1. Network connectivity
    // 2. API key missing/invalid
    // 3. Rate limiting
    // 4. CORS issues
    // 5. API endpoint changes
    
    return null;
  }
};

// Test weather API
debugAPI('https://api.weather.gov/alerts/active');
```

#### ❌ Problem: "Tiles not loading"
```javascript
// Map tiles show 404 or fail to load
```

**Solution:**
```javascript
// Debug tile loading
const layer = mapComponent.getLayer('radar');
const source = layer.getSource();

source.on('tileloaderror', (event) => {
  console.error('Tile load error:', event.tile.getKey());
  console.error('URL:', event.tile.src_);
  
  // Common causes:
  // 1. Incorrect URL template
  // 2. API key missing in URL
  // 3. Tile server down
  // 4. Network issues
  // 5. CORS restrictions
});

source.on('tileloadend', (event) => {
  console.log('Tile loaded:', event.tile.getKey());
});

// Check tile URL generation
console.log('Tile URL example:', source.getTileUrlFunction()(
  [8, 123, 45], 1, ol.proj.get('EPSG:3857')
));
```

---

## Development Issues

### Build and Development Problems

#### ❌ Problem: "Tests failing"
```bash
# Jest tests not running or failing
```

**Solution:**
```bash
# Clear Jest cache
npx jest --clearCache

# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- ui-controls.test.js

# Debug test environment
npm test -- --no-coverage --detectOpenHandles

# Check test setup
cat tests/setup.js
```

#### ❌ Problem: "Linting errors"
```bash
# ESLint reporting errors
```

**Solution:**
```bash
# Fix auto-fixable issues
npm run lint:fix

# Check specific files
npx eslint src/components/ui-controls.js

# Show all lint rules
npx eslint --print-config src/main.js

# Disable specific rules if needed
/* eslint-disable no-console */
console.log('Debug info');
/* eslint-enable no-console */
```

### Hot Reloading Issues

#### ❌ Problem: "Changes not reflected in browser"
```bash
# Development server not updating
```

**Solution:**
```bash
# Restart development server
npm start

# Use different port
npm start -- -p 3000

# Check file watchers (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Clear browser cache
# Hard refresh: Ctrl+F5 / Cmd+Shift+R
```

---

## Getting Additional Help

### Diagnostic Information

When reporting issues, please include:

```javascript
// Browser environment info
const diagnostics = {
  userAgent: navigator.userAgent,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  devicePixelRatio: window.devicePixelRatio,
  online: navigator.onLine,
  language: navigator.language,
  platform: navigator.platform,
  cookieEnabled: navigator.cookieEnabled,
  
  // Feature support
  features: {
    serviceWorker: 'serviceWorker' in navigator,
    webGL: !!window.WebGLRenderingContext,
    geolocation: 'geolocation' in navigator,
    localStorage: 'localStorage' in window,
    sessionStorage: 'sessionStorage' in window,
    indexedDB: 'indexedDB' in window,
    pushNotifications: 'Notification' in window,
    webShare: 'share' in navigator
  },
  
  // Performance info
  memory: performance.memory ? {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
  } : 'Not available',
  
  // Application state
  app: {
    version: '2.0.0',
    components: Object.keys(window).filter(key => 
      key.includes('Component') || key.includes('Controls') || key.includes('Helper')
    )
  }
};

console.table(diagnostics);
```

### Support Channels

1. **GitHub Issues**: [Create an issue](https://github.com/hkevin01/Layers-Radar-States-Streets/issues/new)
2. **Discussions**: [GitHub Discussions](https://github.com/hkevin01/Layers-Radar-States-Streets/discussions)
3. **Documentation**: Check the [docs/](.) directory
4. **Email**: technical-support@weather-radar.dev

### Before Contacting Support

Please try these steps first:

1. ✅ Clear browser cache and cookies
2. ✅ Try in incognito/private browsing mode
3. ✅ Test in a different browser
4. ✅ Check browser console for error messages
5. ✅ Verify you're using a supported browser version
6. ✅ Check network connectivity
7. ✅ Review this troubleshooting guide

---

*This troubleshooting guide covers the most common issues encountered with the Layers Radar States Streets application. If you can't find a solution here, please don't hesitate to reach out for support.*
