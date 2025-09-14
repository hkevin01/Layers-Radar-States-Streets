/**
 * Cypress Configuration for Layers Radar States Streets
 * 
 * Interactive E2E testing with OpenLayers integration
 */

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:8082',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 30000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    
    // Test file patterns
    specPattern: 'tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/cypress/support/e2e.js',
    fixturesFolder: 'tests/cypress/fixtures',
    screenshotsFolder: 'tests/reports/cypress/screenshots',
    videosFolder: 'tests/reports/cypress/videos',
    
    setupNodeEvents(on, config) {
      // Task definitions for custom commands
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        // OpenLayers specific tasks
        waitForMapRender(timeout = 30000) {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(null);
            }, timeout);
          });
        }
      });

      // Browser launch options
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-web-security');
          launchOptions.args.push('--disable-features=VizDisplayCompositor');
        }
        return launchOptions;
      });

      return config;
    },

    env: {
      // Environment variables for tests
      mapSelector: '#map',
      timeout: 30000,
      retries: 3
    }
  },

  component: {
    devServer: {
      framework: 'vanilla',
      bundler: 'vite',
    },
    specPattern: 'tests/cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/cypress/support/component.js'
  },
});
