import { test, expect } from '../helpers/fixtures.mjs';
import { clickThroughCrt, openApp, pauseRain } from '../helpers/app.mjs';
import { openMenu } from '../helpers/roster.mjs';

const CRT_SCREENSHOT_TIMEOUT_MS = 15000;

test.describe('visual snapshots', () => {
  test('management panel layout', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);
    await pauseRain(page);
    await expect(page.locator('#managementPanel')).toHaveScreenshot('management-panel-layout.png');
  });

  test('construct mode shell', async ({ page }) => {
    await openApp(page, { crt: 'false', theme: 'construct' });
    await pauseRain(page);
    await expect(page.locator('#mainDisplayContainer')).toHaveScreenshot('construct-shell.png');
  });

  test('overlay masking with help modal', async ({ page }) => {
    await openApp(page, { crt: 'true' });
    await clickThroughCrt(page, page.locator('#helpBtn'));
    await expect(page.locator('#helpModalOverlay')).toBeVisible();
    await pauseRain(page);
    await expect(page).toHaveScreenshot('overlay-masking-help.png', { timeout: CRT_SCREENSHOT_TIMEOUT_MS });
  });
});
