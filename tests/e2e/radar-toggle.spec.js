// Verifies that when NEXRAD is unchecked and rechecked, the animation restarts.
// This test intentionally loads normal mode (no ?e2e=1) so UIControls and radar loop initialize.

import { expect, test } from '@playwright/test';

test.describe('NEXRAD toggle restart', () => {
  test('rechecking restarts animation if it was playing before hide', async ({ page, browserName }) => {
    test.slow();
    // Load the dev harness (no e2e mode) so the radar loop is active.
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    // Wait for UIControls and radar layer API to be present
    await page.waitForFunction(() => {
      const ui = window.__uiControls;
      const layer = ui && typeof ui.getLayer === 'function' ? ui.getLayer('radar') : null;
      return !!(layer && typeof layer.isPlaying === 'function');
    }, { timeout: 10000 });

    // Ensure it is initially playing (index.html auto-starts the loop)
    const initiallyPlaying = await page.evaluate(() => window.__uiControls.getLayer('radar').isPlaying());
    // If not playing (e.g., fallback static radar), skip gracefully
    test.skip(!initiallyPlaying, 'Radar loop not playing initially (likely using static fallback)');

    // Toggle off
    const toggle = page.locator('#radar-toggle');
    await expect(toggle).toBeVisible();

    // For mobile devices, ensure the controls panel is expanded and element is accessible
    const controlsPanel = page.locator('.map-ui-controls');
    await controlsPanel.scrollIntoViewIfNeeded();

    // Expand controls if collapsed on mobile
    const expandButton = page.locator('.toggle-controls');
    await expandButton.click().catch(() => {}); // Ignore if already expanded

    // Now scroll to and click the toggle
    await toggle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000); // Allow for panel expansion and scroll

    // For mobile, try to get the bounding box and click at center
    const boundingBox = await toggle.boundingBox();
    if (boundingBox && (browserName.includes('Mobile') || browserName.includes('webkit'))) {
      await page.mouse.click(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
    } else {
      await toggle.click({ force: true });
    }

    // Wait until animation stops
    await page.waitForFunction(() => {
      try { return window.__uiControls.getLayer('radar').isPlaying() === false; } catch { return false; }
    }, { timeout: 8000 });

    // Toggle on
    await toggle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Allow for scroll animation to complete

    // For mobile, use coordinate-based clicking for second toggle
    const boundingBox2 = await toggle.boundingBox();
    if (boundingBox2 && (browserName.includes('Mobile') || browserName.includes('webkit'))) {
      await page.mouse.click(boundingBox2.x + boundingBox2.width / 2, boundingBox2.y + boundingBox2.height / 2);
    } else {
      await toggle.click({ force: true });
    }

    // Expect animation to auto-restart
    await page.waitForFunction(() => {
      try { return window.__uiControls.getLayer('radar').isPlaying() === true; } catch { return false; }
    }, { timeout: 10000 });

    const isPlayingAgain = await page.evaluate(() => window.__uiControls.getLayer('radar').isPlaying());
    expect(isPlayingAgain).toBe(true);
  });
});
