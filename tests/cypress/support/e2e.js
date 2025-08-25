/**
 * Cypress E2E Support File
 * 
 * Custom commands and setup for OpenLayers testing
 */

// Import commands
import './commands';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on uncaught exceptions
  // This helps when testing error recovery
  console.log('Uncaught exception:', err.message);
  return false;
});

// Custom commands for OpenLayers
Cypress.Commands.add('waitForMapReady', (timeout = 30000) => {
  cy.window({ timeout }).should('have.property', 'mapComponent');
  cy.window().its('mapComponent.map').should('exist');
});

Cypress.Commands.add('waitForRenderComplete', (timeout = 10000) => {
  cy.window({ timeout }).its('testHelper.renderComplete').should('be.true');
});

Cypress.Commands.add('getMapZoom', () => {
  return cy.window().then((win) => {
    if (win.mapComponent && win.mapComponent.map) {
      return win.mapComponent.map.getView().getZoom();
    }
    return null;
  });
});

Cypress.Commands.add('setMapZoom', (zoom) => {
  cy.window().then((win) => {
    if (win.mapComponent && win.mapComponent.map) {
      win.mapComponent.map.getView().setZoom(zoom);
    }
  });
});

Cypress.Commands.add('getMapCenter', () => {
  return cy.window().then((win) => {
    if (win.mapComponent && win.mapComponent.map) {
      return win.mapComponent.map.getView().getCenter();
    }
    return null;
  });
});

Cypress.Commands.add('setMapCenter', (center) => {
  cy.window().then((win) => {
    if (win.mapComponent && win.mapComponent.map) {
      win.mapComponent.map.getView().setCenter(center);
    }
  });
});

Cypress.Commands.add('checkPerformanceOptimizer', () => {
  cy.window().then((win) => {
    if (win.performanceOptimizer) {
      // Test the fixed methods
      const bounds = win.performanceOptimizer._getVisibleBounds4326();
      const zoom = win.performanceOptimizer._getZoom();
      
      expect(bounds).to.be.an('array');
      expect(zoom).to.be.a('number');
      
      return { bounds, zoom, working: true };
    }
    return { working: false };
  });
});
