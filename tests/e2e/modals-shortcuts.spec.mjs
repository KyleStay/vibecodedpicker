import { test, expect } from '../helpers/fixtures.mjs';
import { openApp } from '../helpers/app.mjs';
import { openMenu } from '../helpers/roster.mjs';

test.describe('modals, shortcuts, and fullscreen-backed modes', () => {
  test('menu toggle opens and closes the panel', async ({ page }) => {
    await openApp(page, { crt: 'false' });

    await expect(page.locator('#managementPanel')).not.toHaveClass(/visible/);

    await page.locator('#menuToggleBtn').click({ force: true });
    await expect(page.locator('#managementPanel')).toHaveClass(/visible/);

    await page.locator('#menuToggleBtn').click({ force: true });
    await expect(page.locator('#managementPanel')).not.toHaveClass(/visible/);
  });

  test('help modal opens by button and closes with Escape', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    await page.locator('#helpBtn').click({ force: true });
    await expect(page.locator('#helpModalOverlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#helpModalOverlay')).not.toHaveClass(/visible/);
  });

  test('command palette filters and executes a command', async ({ page }) => {
    await openApp(page, { crt: 'false' });

    await page.keyboard.press('Control+/');
    await expect(page.locator('#commandPaletteOverlay')).toBeVisible();

    await page.locator('#commandPaletteInput').fill('Construct');
    await page.keyboard.press('Enter');

    await expect(page.locator('body')).toHaveClass(/construct-mode/);
    await expect(page.locator('#commandPaletteOverlay')).not.toHaveClass(/visible/);
  });

  test('single-key shortcuts toggle the expected modes', async ({ page }) => {
    await openApp(page, { crt: 'false' });

    await page.keyboard.press('c');
    await expect(page.locator('body')).toHaveClass(/construct-mode/);

    await page.keyboard.press('e');
    await expect(page.locator('#extractionModeBtn')).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('t');
    await expect(page.locator('#crtModeBtn')).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('o');
    await expect(page.locator('#overdriveModeBtn')).toHaveAttribute('aria-pressed', 'false');
  });

  test('matrix mode enters fullscreen and exits when fullscreen ends', async ({ page }) => {
    await openApp(page, { crt: 'false' });

    await page.keyboard.press('m');
    await expect(page.locator('body')).toHaveClass(/matrix-mode-active/);
    await expect(page.locator('#enterMatrixBtn')).toHaveText('[M] Exit');

    await page.evaluate(() => document.exitFullscreen());
    await expect(page.locator('body')).not.toHaveClass(/matrix-mode-active/);
    await expect(page.locator('#enterMatrixBtn')).toHaveText('[M] Matrix');
  });
});
