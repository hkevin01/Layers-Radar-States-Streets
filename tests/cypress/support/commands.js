/**
 * Custom Cypress Commands for OpenLayers Testing
 */

// Screenshot with timestamp
Cypress.Commands.add('screenshotWithTimestamp', (name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}-${timestamp}`);
});

// Wait for element with retry
Cypress.Commands.add('waitForElementWithRetry', (selector, retries = 3) => {
  const attempt = (remainingRetries) => {
    if (remainingRetries <= 0) {
      throw new Error(`Element ${selector} not found after retries`);
    }
    
    cy.get('body').then(($body) => {
      if ($body.find(selector).length > 0) {
        cy.get(selector);
      } else {
        cy.wait(1000);
        attempt(remainingRetries - 1);
      }
    });
  };
  
  attempt(retries);
});

// Log performance metrics
Cypress.Commands.add('logPerformanceMetrics', () => {
  cy.window().then((win) => {
    if (win.testHelper && win.testHelper.getPerformanceMetrics) {
      const metrics = win.testHelper.getPerformanceMetrics();
      cy.log('Performance Metrics:', metrics);
    }
  });
});
