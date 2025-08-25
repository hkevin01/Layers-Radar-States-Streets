/**
 * Playwright Configuration for Layers Radar States Streets
 *
 * Multi-browser E2E testing with OpenLayers event synchronization
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'tests/reports/playwright' }],
    ['json', { outputFile: 'tests/reports/playwright-results.json' }],
    ['junit', { outputFile: 'tests/reports/playwright-junit.xml' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:8089',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.CI ? true : false,
    actionTimeout: 30000,
    navigationTimeout: 30000
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

  // Note: Edge disabled by default; enable locally if msedge is installed
  ],

  webServer: {
    // Serve the public folder as the site root so /index.html resolves
    command: 'npx http-server public -p 8089 --cors -c-1',
    port: 8089,
    reuseExistingServer: !process.env.CI,
  },
});
