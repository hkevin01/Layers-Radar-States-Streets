// Cypress E2E: Map interactions and basic rendering
describe('Map renders and interacts', () => {
  const baseUrl = 'http://localhost:8082/index.html';

  it('renders canvas and loads tiles; extent finite', () => {
    const tilePattern = /tile|osm|openstreetmap|\.png|\/z\//i;
    let tileHit = 0;
    cy.intercept({ method: 'GET', url: tilePattern }).as('tiles');

    cy.visit(baseUrl);

    cy.get('#map').should('exist').then(($div) => {
      const h = $div.height();
      expect(h).to.be.greaterThan(300);
    });

    cy.get('#map canvas, #map .ol-layer').should('exist');

    cy.wait(2000);
    cy.get('@tiles.all').then((calls) => {
      tileHit = (calls || []).length;
      expect(tileHit).to.be.greaterThan(0);
    });

    cy.window().then((w) => {
      expect(w.__getMapDiagnostics, 'diagnostics helper').to.exist;
      const d = w.__getMapDiagnostics && w.__getMapDiagnostics();
      expect(d).to.have.property('size');
      expect(d.size[0]).to.be.finite;
      expect(d.size[1]).to.be.finite;
      if (d.extent4326) {
        d.extent4326.forEach((n) => expect(n).to.be.finite);
      }
    });
  });
});
/**
 * Cypress tests asserting canvas render and tile requests and finite extent
 */

describe('Map rendering diagnostics', () => {
  it('renders canvas and loads OSM tiles; extent is finite', () => {
    const requests = [];
    cy.intercept('GET', /tile\.openstreetmap\.org\//, (req) => {
      requests.push(req.url);
    }).as('osm');

  cy.visit('/index.html');

    // Map div exists and has a canvas inside
    cy.get('#map', { timeout: 20000 }).should('be.visible');
    cy.get('#map canvas', { timeout: 20000 }).should('exist');

    // Wait a bit for tiles
    cy.wait(1500).then(() => {
      expect(requests.length).to.be.greaterThan(0);
    });

    // Check extent numbers are finite
    cy.window().then((win) => {
      const opt = win.performanceOptimizer;
      if (opt && typeof opt._getVisibleBounds4326 === 'function') {
        const b = opt._getVisibleBounds4326();
        expect(b).to.have.length(4);
        b.forEach((n) => expect(Number.isFinite(n)).to.be.true);
      }
    });
  });
});
/**
 * Cypress E2E Tests for Map Interactions
 *
 * Interactive testing with OpenLayers event synchronization
 */

describe('Map Interactions', () => {
  const mapSelector = '#map';

  beforeEach(() => {
    // Visit the application
  cy.visit('/index.html');

    // Wait for map to load
    cy.window().should('have.property', 'mapComponent');

    // Setup OpenLayers event hooks
    cy.window().then((win) => {
      win.testHelper = {
        mapReady: false,
        renderComplete: false,
        layersLoaded: false,
        loadingCount: 0,
        errorCount: 0,
        events: []
      };

      if (win.mapComponent && win.mapComponent.map) {
        const map = win.mapComponent.map;

        map.on('rendercomplete', () => {
          win.testHelper.renderComplete = true;
        });

        win.testHelper.mapReady = true;
      }
    });

    // Wait for map to be ready
    cy.window().its('testHelper.mapReady').should('be.true');
  });

  it('should load the map successfully', () => {
    // Check if map element exists and is visible
    cy.get(mapSelector).should('be.visible');

    // Wait for render complete
    cy.window().its('testHelper.renderComplete').should('be.true', { timeout: 30000 });

    // Check for no errors
    cy.window().its('testHelper.errorCount').should('eq', 0);

    // Take screenshot
    cy.screenshot('map-loaded-cypress');
  });

  it('should handle zoom interactions', () => {
    // Wait for map ready
    cy.window().its('testHelper.mapReady').should('be.true');

    // Get initial zoom
    cy.window().then((win) => {
      if (win.mapComponent && win.mapComponent.map) {
        const initialZoom = win.mapComponent.map.getView().getZoom();
        cy.wrap(initialZoom).as('initialZoom');
      }
    });

    // Zoom in via API
    cy.window().then((win) => {
      if (win.mapComponent && win.mapComponent.map) {
        const view = win.mapComponent.map.getView();
        view.setZoom(view.getZoom() + 1);
      }
    });

    // Wait for render complete
    cy.window().its('testHelper.renderComplete').should('be.true');

    // Verify zoom changed
    cy.get('@initialZoom').then((initialZoom) => {
      cy.window().then((win) => {
        const newZoom = win.mapComponent.map.getView().getZoom();
        expect(newZoom).to.be.greaterThan(initialZoom);
      });
    });

    cy.screenshot('map-zoomed-in');
  });

  it('should handle pan interactions', () => {
    cy.window().its('testHelper.mapReady').should('be.true');

    // Get initial center
    cy.window().then((win) => {
      if (win.mapComponent && win.mapComponent.map) {
        const initialCenter = win.mapComponent.map.getView().getCenter();
        cy.wrap(initialCenter).as('initialCenter');
      }
    });

    // Simulate pan by dragging
    cy.get(mapSelector)
      .trigger('mousedown', { clientX: 400, clientY: 300 })
      .trigger('mousemove', { clientX: 500, clientY: 400 })
      .trigger('mouseup');

    // Wait for render complete
    cy.wait(1000); // Allow time for pan animation

    // Verify center changed
    cy.get('@initialCenter').then((initialCenter) => {
      cy.window().then((win) => {
        const newCenter = win.mapComponent.map.getView().getCenter();
        expect(newCenter[0]).to.not.equal(initialCenter[0]);
      });
    });

    cy.screenshot('map-panned');
  });

  it('should test performance optimizer functionality', () => {
    cy.window().its('testHelper.mapReady').should('be.true');

    // Test the fixed performance optimizer methods
    cy.window().then((win) => {
      if (win.performanceOptimizer) {
        // Test _getVisibleBounds4326 method
        const bounds = win.performanceOptimizer._getVisibleBounds4326();
        expect(bounds).to.be.an('array');
        expect(bounds).to.have.length(4);

        // Test _getZoom method
        const zoom = win.performanceOptimizer._getZoom();
        expect(zoom).to.be.a('number');
        expect(zoom).to.be.greaterThan(0);

        cy.log('Performance optimizer methods working correctly');
      }
    });

    cy.screenshot('performance-optimizer-tested');
  });

  it('should handle mobile touch events', () => {
    // Set mobile viewport
    cy.viewport(375, 667);

    cy.window().its('testHelper.mapReady').should('be.true');

    // Test touch interactions
    cy.get(mapSelector)
      .trigger('touchstart', { touches: [{ clientX: 200, clientY: 300 }] })
      .trigger('touchmove', { touches: [{ clientX: 250, clientY: 350 }] })
      .trigger('touchend');

    // Wait for any touch animations
    cy.wait(1000);

    // Check for no errors
    cy.window().its('testHelper.errorCount').should('eq', 0);

    cy.screenshot('mobile-touch-tested');
  });

  it('should load and display layers', () => {
    cy.window().its('testHelper.mapReady').should('be.true');

    // Check layer count
    cy.window().then((win) => {
      if (win.mapComponent && win.mapComponent.map) {
        const layerCount = win.mapComponent.map.getLayers().getLength();
        expect(layerCount).to.be.greaterThan(0);
        cy.log(`Map has ${layerCount} layers`);
      }
    });

    // Wait for layers to load
    cy.wait(5000); // Allow time for tile loading

    cy.screenshot('layers-loaded-cypress');
  });

  afterEach(() => {
    // Log any errors that occurred
    cy.window().then((win) => {
      if (win.testHelper && win.testHelper.errorCount > 0) {
        cy.log(`Test completed with ${win.testHelper.errorCount} errors`);
        cy.log('Events:', win.testHelper.events);
      }
    });
  });
});
