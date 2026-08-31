import { test, expect } from '../helpers/fixtures.mjs';
import { expectUrlToContain, getClipboardWrites, openApp } from '../helpers/app.mjs';
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

  test('command palette copies a blank Matrix mode URL', async ({ page }) => {
    await openApp(page, {
      title: 'Loaded Deck',
      name: 'Switch',
      alias: 'Operator',
      brightness: 73,
      'matrix-mode': 'on'
    });

    await page.keyboard.press('Control+/');
    await page.locator('#commandPaletteInput').fill('Blank Matrix');
    await page.keyboard.press('Enter');

    const expectedUrl = new URL(page.url());
    expectedUrl.search = '';
    expectedUrl.hash = '';
    expectedUrl.searchParams.set('matrix-mode', 'on');

    await expect.poll(async () => {
      const writes = await getClipboardWrites(page);
      return writes.at(-1);
    }).toBe(expectedUrl.toString());
    await expect(page.locator('#commandPaletteOverlay')).not.toHaveClass(/visible/);
  });

  test('single-key shortcuts toggle the expected modes', async ({ page }) => {
    await openApp(page, { crt: 'false' });

    await page.keyboard.press('c');
    await expect(page.locator('body')).toHaveClass(/construct-mode/);

    await page.keyboard.press('e');
    await expect(page.locator('#extractionModeBtn')).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('y');
    await expect(page.locator('#rainGlyphSetBtn')).toHaveText('[Y] Original Glyphs');

    await page.keyboard.press('y');
    await expect(page.locator('#rainGlyphSetBtn')).toHaveText('[Y] Omarchy Glyphs');

    await page.keyboard.press('y');
    await expect(page.locator('#rainGlyphSetBtn')).toHaveText('[Y] Expanded Glyphs');

    await page.keyboard.press('t');
    await expect(page.locator('#crtModeBtn')).toHaveAttribute('aria-pressed', 'true');

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

  test('matrix mode restarts the CRT screen startup', async ({ page }) => {
    await openApp(page, { 'crt-startup-time': 9000 });

    await expect.poll(() => page.evaluate(() => window.__VIBE_TEST__.getCrtStartupDebug().active)).toBe(false);

    await page.keyboard.press('m');

    const startupDebug = await page.evaluate(() => window.__VIBE_TEST__.getCrtStartupDebug());
    expect(startupDebug.active).toBe(true);
    expect(startupDebug.progress).toBeLessThan(1);
  });

  test('matrix mode is shareable through the URL', async ({ page }) => {
    await openApp(page, { crt: 'false' });

    await page.keyboard.press('m');
    await expectUrlToContain(page, { 'matrix-mode': 'on' });

    await page.reload();
    await expect(page.locator('body')).toHaveClass(/matrix-mode-active/);
    await expect(page.locator('#enterMatrixBtn')).toHaveText('[M] Exit');

    await page.keyboard.press('m');
    await expect.poll(() => new URL(page.url()).searchParams.has('matrix-mode')).toBe(false);
    await expect(page.locator('body')).not.toHaveClass(/matrix-mode-active/);
  });

  test('shared matrix mode enters fullscreen on the first gesture when auto fullscreen is blocked', async ({ page }) => {
    await page.addInitScript(() => {
      window.__TEST_FULLSCREEN_REJECT_COUNT__ = 1;
    });
    await openApp(page, { crt: 'false', 'matrix-mode': 'on' });

    await expect(page.locator('body')).toHaveClass(/matrix-mode-active/);

    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
    await page.mouse.click(20, 20);

    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    await expect(page.locator('body')).toHaveClass(/matrix-mode-active/);
  });
});
