// Verifies that when NEXRAD is unchecked and rechecked, the animation restarts.
// This test intentionally loads normal mode (no ?e2e=1) so UIControls and radar loop initialize.

const { test, expect } = require('@playwright/test');

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
    await toggle.uncheck();

    // Wait until animation stops
    await page.waitForFunction(() => {
      try { return window.__uiControls.getLayer('radar').isPlaying() === false; } catch { return false; }
    }, { timeout: 8000 });

    // Toggle on
    await toggle.check();

    // Expect animation to auto-restart
    await page.waitForFunction(() => {
      try { return window.__uiControls.getLayer('radar').isPlaying() === true; } catch { return false; }
    }, { timeout: 10000 });

    const isPlayingAgain = await page.evaluate(() => window.__uiControls.getLayer('radar').isPlaying());
    expect(isPlayingAgain).toBe(true);
  });
});
