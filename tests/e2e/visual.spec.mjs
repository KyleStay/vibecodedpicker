import { test, expect } from '../helpers/fixtures.mjs';
import { clickThroughCrt, openApp, pauseRain } from '../helpers/app.mjs';
import { openMenu } from '../helpers/roster.mjs';

test.describe('visual snapshots', () => {
  test('management panel layout', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);
    await pauseRain(page);
    await expect(page.locator('#managementPanel')).toHaveScreenshot('management-panel-layout.png');
  });

  test('non-CRT overdrive demo', async ({ page }) => {
    await openApp(page, { crt: 'false', e2eScene: 'overdrive-demo' });
    await pauseRain(page);
    await expect(page).toHaveScreenshot('noncrt-overdrive-demo.png');
  });

  test('CRT overdrive demo', async ({ page }) => {
    await openApp(page, { crt: 'true', e2eScene: 'overdrive-demo' });
    await pauseRain(page);
    await expect(page).toHaveScreenshot('crt-overdrive-demo.png');
  });

  test('non-CRT high-drive phosphor demo', async ({ page }) => {
    await openApp(page, { crt: 'false', e2eScene: 'overdrive-demo', overdriveDrive: '170' });
    await pauseRain(page);
    await expect(page).toHaveScreenshot('noncrt-overdrive-high-drive.png');
  });

  test('CRT high-drive phosphor demo', async ({ page }) => {
    await openApp(page, { crt: 'true', e2eScene: 'overdrive-demo', overdriveDrive: '170' });
    await pauseRain(page);
    await expect(page).toHaveScreenshot('crt-overdrive-high-drive.png');
  });

  test('non-CRT long-persistence phosphor demo', async ({ page }) => {
    await openApp(page, {
      crt: 'false',
      e2eScene: 'overdrive-demo',
      overdrivePersistence: '1900'
    });
    await pauseRain(page);
    await expect(page).toHaveScreenshot('noncrt-overdrive-long-persistence.png');
  });

  test('non-CRT wide-bloom phosphor demo', async ({ page }) => {
    await openApp(page, {
      crt: 'false',
      e2eScene: 'overdrive-demo',
      overdriveBloom: '180'
    });
    await pauseRain(page);
    await expect(page).toHaveScreenshot('noncrt-overdrive-wide-bloom.png');
  });

  test('construct mode shell', async ({ page }) => {
    await openApp(page, { crt: 'false', theme: 'construct' });
    await pauseRain(page);
    await expect(page.locator('#mainDisplayContainer')).toHaveScreenshot('construct-shell.png');
  });

  test('overlay masking with help modal', async ({ page }) => {
    await openApp(page, { crt: 'true', e2eScene: 'overdrive-demo' });
    await clickThroughCrt(page, page.locator('#helpBtn'));
    await expect(page.locator('#helpModalOverlay')).toBeVisible();
    await pauseRain(page);
    await expect(page).toHaveScreenshot('overlay-masking-help.png');
  });
});
