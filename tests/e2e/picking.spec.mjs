import { test, expect } from '../helpers/fixtures.mjs';
import { openApp, getClipboardWrites } from '../helpers/app.mjs';
import { enableExtractionMode, openMenu } from '../helpers/roster.mjs';

test.describe('picking flow', () => {
  test('pick marks an operative selected and advances progress', async ({ page }) => {
    await openApp(page, { crt: 'false' });

    await page.locator('#selectedNameDisplayWrapper').click();
    await expect(page.locator('#selectedNameDisplay')).not.toHaveText('|');
    await expect(page.locator('#undoBtn')).toBeEnabled();
    await expect(page.locator('#progressBar .progress-segment.filled')).toHaveCount(1);

    const pickedName = await page.locator('#selectedNameDisplay').textContent();
    await expect(page.locator(`li[data-name="${pickedName}"]`)).toHaveClass(/name-item-selected/);
  });

  test('undo restores the last pick and replays it on the next pick', async ({ page }) => {
    await openApp(page, { crt: 'false', names: 'Alpha|A,Beta|B,Gamma|G' });

    await page.locator('#selectedNameDisplayWrapper').click();
    const firstPick = await page.locator('#selectedNameDisplay').textContent();

    await page.locator('#selectedNameDisplayWrapper').click();
    const secondPick = await page.locator('#selectedNameDisplay').textContent();
    await expect(secondPick).not.toBe(firstPick);

    await page.locator('#undoBtn').click();
    await expect(page.locator('#selectedNameDisplay')).toHaveText(firstPick);

    await page.locator('#selectedNameDisplayWrapper').click();
    await expect(page.locator('#selectedNameDisplay')).toHaveText(secondPick);
  });

  test('reboot resets selections and the display', async ({ page }) => {
    await openApp(page, { crt: 'false' });

    await page.locator('#selectedNameDisplayWrapper').click();
    await openMenu(page);
    await page.locator('#rebootBtn').scrollIntoViewIfNeeded();
    await page.locator('#rebootBtn').click({ force: true });

    await expect(page.locator('#selectedNameDisplay')).toHaveText('|');
    await expect(page.locator('#undoBtn')).toBeDisabled();
    await expect(page.locator('#progressBar .progress-segment.filled')).toHaveCount(0);
  });

  test('extraction mode copies alias if present, otherwise name', async ({ page }) => {
    await openApp(page, { crt: 'false', names: 'Switch|Relay' });
    await enableExtractionMode(page);

    await page.locator('#selectedNameDisplayWrapper').click();
    await expect(await getClipboardWrites(page)).toEqual(['Relay']);

    await openApp(page, { crt: 'false', names: 'Mouse|' });
    await enableExtractionMode(page);

    await page.locator('#selectedNameDisplayWrapper').click();
    await expect(await getClipboardWrites(page)).toEqual(['Mouse']);
  });

  test('picks a newly added operative in a single-item roster', async ({ page }) => {
    await openApp(page, { crt: 'false', names: 'Solo|' });
    await enableExtractionMode(page);
    await page.locator('#selectedNameDisplayWrapper').click();
    await expect(page.locator('#selectedNameDisplay')).toHaveText('Solo');
  });
});
