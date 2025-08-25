/**
 * Selenium WebDriver Tests for Cross-Browser Compatibility
 *
 * Tests OpenLayers functionality across different browsers
 */

import { expect } from 'chai';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';
import firefox from 'selenium-webdriver/firefox.js';

const TEST_URL = 'http://127.0.0.1:8082/index.html';
const MAP_SELECTOR = '#map';
const TIMEOUT = 30000;

class SeleniumTestHelper {
  constructor(driver) {
    this.driver = driver;
  }

  async setupOpenLayersHooks() {
    // Inject test helper into browser
    await this.driver.executeScript(`
      window.testHelper = {
        mapReady: false,
        renderComplete: false,
        layersLoaded: false,
        loadingCount: 0,
        errorCount: 0,
        events: []
      };

      // Hook into map events
      if (window.mapComponent && window.mapComponent.map) {
        const map = window.mapComponent.map;

        map.on('rendercomplete', () => {
          window.testHelper.renderComplete = true;
          window.testHelper.events.push({
            type: 'rendercomplete',
            timestamp: Date.now()
          });
        });

        window.testHelper.mapReady = true;
      }

      // Error tracking
      window.addEventListener('error', (event) => {
        window.testHelper.errorCount++;
        window.testHelper.events.push({
          type: 'error',
          message: event.message,
          timestamp: Date.now()
        });
      });
    `);
  }

  async waitForMapReady() {
    await this.driver.wait(
      () => this.driver.executeScript('return window.testHelper && window.testHelper.mapReady'),
      TIMEOUT
    );
  }

  async waitForRenderComplete() {
    await this.driver.wait(
      () => this.driver.executeScript('return window.testHelper && window.testHelper.renderComplete'),
      TIMEOUT
    );
  }

  async getErrorCount() {
    return await this.driver.executeScript('return window.testHelper ? window.testHelper.errorCount : 0');
  }

  async takeScreenshot(name) {
    const screenshot = await this.driver.takeScreenshot();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tests/screenshots/selenium-${name}-${timestamp}.png`;

    // In a real implementation, you'd save this to a file
    console.log(`Screenshot taken: ${filename}`);
    return filename;
  }
}

async function createDriver(browserName) {
  let options;
  let driver;

  switch (browserName) {
    case 'chrome':
      options = new chrome.Options();
      options.addArguments('--disable-web-security');
      options.addArguments('--disable-features=VizDisplayCompositor');
      if (process.env.CI) {
        options.addArguments('--headless');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
      }
      driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
      break;

    case 'firefox':
      options = new firefox.Options();
      if (process.env.CI) {
        options.addArguments('--headless');
      }
      driver = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build();
      break;

    case 'edge':
      options = new edge.Options();
      if (process.env.CI) {
        options.addArguments('--headless');
      }
      driver = await new Builder()
        .forBrowser('MicrosoftEdge')
        .setEdgeOptions(options)
        .build();
      break;

    default:
      throw new Error(`Unsupported browser: ${browserName}`);
  }

  // Set window size
  await driver.manage().window().setRect({ width: 1280, height: 720 });

  return driver;
}

async function runBasicMapTest(browserName) {
  console.log(`Running basic map test on ${browserName}...`);

  const driver = await createDriver(browserName);
  const helper = new SeleniumTestHelper(driver);

  try {
    // Navigate to application
    await driver.get(TEST_URL);

    // Wait for page load
    await driver.wait(until.elementLocated(By.css('body')), TIMEOUT);

    // Setup test hooks
    await driver.wait(
      () => driver.executeScript('return window.mapComponent != null'),
      TIMEOUT
    );

    await helper.setupOpenLayersHooks();

    // Wait for map to be ready
    await helper.waitForMapReady();

    // Check if map element is visible
    const mapElement = await driver.findElement(By.css(MAP_SELECTOR));
    const isDisplayed = await mapElement.isDisplayed();
    expect(isDisplayed).to.be.true;

    // Wait for render complete
    await helper.waitForRenderComplete();

    // Check for errors
    const errorCount = await helper.getErrorCount();
    expect(errorCount).to.equal(0);

    // Test performance optimizer
    const optimizerResult = await driver.executeScript(`
      try {
        if (window.performanceOptimizer) {
          const bounds = window.performanceOptimizer._getVisibleBounds4326();
          const zoom = window.performanceOptimizer._getZoom();

          return {
            success: true,
            bounds: bounds,
            zoom: zoom,
            boundsValid: Array.isArray(bounds) && bounds.length === 4,
            zoomValid: typeof zoom === 'number' && zoom > 0
          };
        }
        return { success: false, error: 'Performance optimizer not found' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    `);

    expect(optimizerResult.success).to.be.true;
    expect(optimizerResult.boundsValid).to.be.true;
    expect(optimizerResult.zoomValid).to.be.true;

    // Take screenshot
    await helper.takeScreenshot(`${browserName}-basic-test`);

    console.log(`✅ Basic map test passed on ${browserName}`);

  } catch (error) {
    console.error(`❌ Basic map test failed on ${browserName}:`, error);
    await helper.takeScreenshot(`${browserName}-error`);
    throw error;
  } finally {
    await driver.quit();
  }
}

async function runInteractionTest(browserName) {
  console.log(`Running interaction test on ${browserName}...`);

  const driver = await createDriver(browserName);
  const helper = new SeleniumTestHelper(driver);

  try {
    await driver.get(TEST_URL);
    await driver.wait(until.elementLocated(By.css('body')), TIMEOUT);

    await driver.wait(
      () => driver.executeScript('return window.mapComponent != null'),
      TIMEOUT
    );

    await helper.setupOpenLayersHooks();
    await helper.waitForMapReady();

    // Get initial zoom
    const initialZoom = await driver.executeScript(`
      return window.mapComponent.map.getView().getZoom();
    `);

    // Test zoom interaction
    await driver.executeScript(`
      const view = window.mapComponent.map.getView();
      view.setZoom(view.getZoom() + 1);
    `);

    await helper.waitForRenderComplete();

    // Verify zoom changed
    const newZoom = await driver.executeScript(`
      return window.mapComponent.map.getView().getZoom();
    `);

    expect(newZoom).to.be.greaterThan(initialZoom);

    // Test pan interaction
    const mapElement = await driver.findElement(By.css(MAP_SELECTOR));
    const actions = driver.actions({ async: true });

    await actions
      .move({ origin: mapElement })
      .press()
      .move({ x: 100, y: 100, origin: 'pointer' })
      .release()
      .perform();

    // Wait for pan to complete
    await driver.sleep(1000);

    // Check for no errors
    const errorCount = await helper.getErrorCount();
    expect(errorCount).to.equal(0);

    await helper.takeScreenshot(`${browserName}-interaction-test`);

    console.log(`✅ Interaction test passed on ${browserName}`);

  } catch (error) {
    console.error(`❌ Interaction test failed on ${browserName}:`, error);
    await helper.takeScreenshot(`${browserName}-interaction-error`);
    throw error;
  } finally {
    await driver.quit();
  }
}

// Main test runner
async function runAllTests() {
  const browsers = ['chrome', 'firefox']; // Add 'edge' if available

  console.log('Starting Selenium cross-browser tests...');

  for (const browser of browsers) {
    try {
      await runBasicMapTest(browser);
      await runInteractionTest(browser);
    } catch (error) {
      console.error(`Tests failed for ${browser}:`, error);
    }
  }

  console.log('All Selenium tests completed.');
}

// Export for use in other test runners
export {
  createDriver, runAllTests, runBasicMapTest,
  runInteractionTest, SeleniumTestHelper
};

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}
