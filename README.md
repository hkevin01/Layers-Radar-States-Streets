# Layers Radar States Streets

Interactive map application built with OpenLayers featuring comprehensive testing infrastructure and performance optimization.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit the application
open http://127.0.0.1:8082/index.html
```bash

## 🗺️ Features

- **OpenLayers v8.2.0** integration with OSM tiles
- **Performance Optimization** with tile preloading and view state management
- **Responsive Design** with mobile-friendly interactions
- **Error Handling** with defensive programming patterns
- **Comprehensive Testing** across multiple frameworks

## 🧪 Testing Infrastructure

This project features a comprehensive testing setup with multiple frameworks:

### Test Frameworks

1. **Vitest** - Unit testing with JSDOM
2. **Playwright** - Multi-browser E2E testing
3. **Cypress** - Interactive testing with real browser
4. **Selenium** - Cross-browser compatibility testing
5. **Lighthouse CI** - Performance and accessibility audits

### Running Tests

```bash
# Run all tests (comprehensive suite)
npm test

# Quick test suite (unit + integration)
npm run test:quick

# Individual test frameworks
npm run test:unit          # Vitest unit tests
npm run test:playwright    # Playwright E2E tests
npm run test:cypress       # Cypress interactive tests
npm run test:selenium      # Selenium cross-browser tests
npm run test:performance   # Lighthouse performance audits

# Interactive modes
npm run test:unit:watch    # Watch mode for unit tests
npm run test:unit:ui       # Vitest UI interface
npm run test:playwright:ui # Playwright UI mode
npm run test:cypress:open  # Cypress interactive mode

# Coverage and reporting
npm run test:coverage      # Generate coverage reports
npm run test:report        # View test reports
```

### Test Structure

```text
tests/
├── unit/                     # Unit tests (Vitest)
│   └── performance-optimizer.test.js
├── e2e/                      # E2E tests (Playwright)
│   └── map-basic.spec.js
├── cypress/                  # Cypress tests
│   ├── e2e/
│   │   └── map-interactions.cy.js
│   └── support/
│       ├── commands.js
│       └── e2e.js
├── selenium/                 # Selenium tests
│   └── selenium-test.js
├── reports/                  # Test reports and artifacts
├── screenshots/              # Test screenshots
├── test-setup.js            # OpenLayers testing utilities
├── vitest.config.js         # Vitest configuration
├── vitest.setup.js          # Test environment setup
└── run-all-tests.js         # Comprehensive test runner
```

## � Run Spring Boot backend in Docker

You can run the backend REST API in a container and the frontend locally.

Quick start:

```bash
# Build and start backend container
docker compose build backend
docker compose up -d backend

# Or via helper
./scripts/start-backend-docker.sh

# Run frontend locally on 8089 and wait for backend health
./run.sh docker

# Verify API health
curl -fsS http://localhost:8081/api/weather/health
```

Notes:

- Container exposes port 8081 → host 8081.
- Healthcheck endpoint: /api/weather/health
- Stop containers:

```bash
docker compose down
# Or helper
./scripts/stop-backend-docker.sh
```

## �🔧 Configuration Files

- **`playwright.config.js`** - Multi-browser Playwright configuration
- **`cypress.config.js`** - Cypress interactive testing setup
- **`vitest.config.js`** - Unit testing with coverage
- **`.lighthouserc.js`** - Performance testing configuration
- **`.github/workflows/test-suite.yml`** - CI/CD pipeline

## 🎯 OpenLayers Integration

### Map Initialization

```javascript
// Basic map setup with OpenLayers v8
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([-98.5795, 39.8283]),
        zoom: 4
    })
});
```

### Performance Optimization

The `PerformanceOptimizer` class provides:

- **Tile Preloading** - Preloads tiles for better user experience
- **View State Management** - Optimizes map rendering based on zoom/pan
- **Error Handling** - Defensive programming with fallback values
- **OpenLayers API Integration** - Proper coordinate transformations

### Fixed Issues

The original `TypeError: this.mapComponent.getVisibleBounds is not a function` has been resolved by implementing proper OpenLayers API wrapper methods:

```javascript
// Fixed implementation in PerformanceOptimizer
_getVisibleBounds4326() {
    const map = this._getMap();
    const view = map.getView();
    const size = map.getSize();
    const extent = view.calculateExtent(size);
    return ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
}
```

## 🚦 CI/CD Pipeline

GitHub Actions workflow includes:

- **Multi-Node Testing** (Node.js 18.x, 20.x)
- **Cross-Browser Testing** (Chrome, Firefox, Safari, Edge)
- **Performance Audits** with Lighthouse CI
- **Test Artifacts** collection and storage
- **Coverage Reports** with Codecov integration

## 📊 Test Reports

Test results are automatically generated in multiple formats:

- **HTML Reports** - Interactive test results viewer
- **JSON Reports** - Machine-readable test data
- **Coverage Reports** - Code coverage analysis
- **Screenshots** - Visual test artifacts
- **Performance Reports** - Lighthouse audit results

## 🛠️ Development Scripts

```bash
# Development
npm run dev              # Start development server on port 8082
npm run start           # Start server on port 8080

# Testing
npm test                # Run comprehensive test suite
npm run test:quick      # Run quick test subset
npm run clean           # Clean test artifacts

# Utilities
npm run setup           # Setup test directories
npm run build           # No-op for static site
```

## 📁 Project Structure

```text
├── public/
│   └── index.html          # Main HTML file with OpenLayers
├── src/
│   └── components/
│       └── performance-optimizer.js  # Performance optimization
├── tests/                  # Comprehensive testing infrastructure
├── script.js              # Main application logic
├── quick-test.js          # Integration test utilities
└── package.json           # Dependencies and scripts
```

## 🐛 Debugging

### Common Issues

1. **Map not loading**: Check console for OpenLayers CDN connectivity
2. **TypeError in PerformanceOptimizer**: Ensure proper OpenLayers API usage
3. **Test failures**: Verify server is running on port 8082

### Debug Commands

```bash
# Debug specific test frameworks
npm run test:playwright:debug    # Debug Playwright tests
npm run test:cypress:open        # Open Cypress interactively
npm run test:unit:ui             # Visual unit test interface

# Check server status
curl http://127.0.0.1:8082/index.html

- Toggle diagnostics overlay with the D key. It shows current size, zoom, center, and visible extent in EPSG:4326. The overlay state persists across reloads.
- Use `window.__getMapDiagnostics()` in DevTools console to retrieve the same info programmatically.
- If the OpenLayers CDN fails, the app attempts to load a local fallback from `public/vendor/ol/ol.js` and `ol.css`. Run:

```bash
npm install
npm run prepare:ol
```

to populate the fallback files from your `node_modules/ol` package (v8.2.0).

### Quick checks

```bash
npm run dev
npm run test:quick
npm run test:cypress
npm run test:playwright
npm run test:unit
```

```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run the test suite: `npm test`
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Resources

- [OpenLayers Documentation](https://openlayers.org/doc/)
- [Playwright Testing](https://playwright.dev/)
- [Cypress Testing](https://docs.cypress.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Selenium WebDriver](https://selenium-python.readthedocs.io/)

### OpenLayers CDN fallback

This app loads OpenLayers v8 from the CDN first and automatically falls back to a local copy if the CDN is unavailable.

- CDN URLs used:
    - JS: <https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js>
    - CSS: <https://cdn.jsdelivr.net/npm/ol@8.2.0/ol.css>
- Local fallback files will be placed at:
    - `public/vendor/ol/ol.js`
    - `public/vendor/ol/ol.css`

Setup for fallback (runs automatically on install):

```bash
npm install
# postinstall runs: npm run prepare:ol
```

Manual refresh of fallback assets if needed:

```bash
npm run prepare:ol
```

If both CDN and local fallback fail, the page will show an on-screen error banner. See TROUBLESHOOTING.md for the “Blank map” checklist.
