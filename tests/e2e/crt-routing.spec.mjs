import { test, expect } from '../helpers/fixtures.mjs';
import { clickThroughCrt, dragThroughCrt, expectTypingCaretFor, openApp } from '../helpers/app.mjs';
import { expectRosterOrder } from '../helpers/roster.mjs';

async function openMenuThroughCrt(page) {
  await clickThroughCrt(page, page.locator('#menuToggleBtn'));
  await expect(page.locator('#managementPanel')).toHaveClass(/visible/);
  await page.waitForTimeout(350);
}

async function enableExtractionModeThroughCrt(page) {
  const button = page.locator('#extractionModeBtn');
  if ((await button.getAttribute('aria-pressed')) !== 'true') {
    await clickThroughCrt(page, button);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }
}

test.describe('CRT interaction routing', () => {
  test('CRT-routed modal access and CRT slider changes still work', async ({ page }) => {
    await openApp(page, { crt: 'true' });

    await clickThroughCrt(page, page.locator('#helpBtn'));
    await expect(page.locator('#helpModalOverlay')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#helpModalOverlay')).not.toHaveClass(/visible/);

    await page.locator('#crtFishbowlSlider').fill('80');
    await expect(page.locator('#crtFishbowlSlider')).toHaveValue('80');
  });

  test('clicking a name edits it in CRT mode without extraction', async ({ page }) => {
    await openApp(page, { crt: 'true' });
    await openMenuThroughCrt(page);

    const nameLabel = page.locator('li[data-name="Neo"] .name-span');
    await clickThroughCrt(page, nameLabel);

    const nameInput = page.locator('li[data-name="Neo"] .name-edit-input');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeFocused();
    await nameInput.fill('Thomas Anderson');
    await nameInput.press('Enter');

    await expect(page.locator('li[data-name="Thomas Anderson"]')).toBeVisible();
    await expect(page.url()).toContain('Thomas%20Anderson|The%20One');
  });

  test('clicking a name edits it in CRT mode with extraction and preserves alias', async ({ page }) => {
    test.slow();
    await openApp(page, { crt: 'true' });
    await openMenuThroughCrt(page);
    await enableExtractionModeThroughCrt(page);

    const nameLabel = page.locator('li[data-name="Oracle"] .name-span');
    await clickThroughCrt(page, nameLabel);

    const nameInput = page.locator('li[data-name="Oracle"] .name-edit-input');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeFocused();
    await nameInput.fill('Pythia');
    await nameInput.press('Enter');

    await expect(page.locator('li[data-name="Pythia"]')).toBeVisible();
    await expect(page.url()).toContain('Pythia|Prophet');
  });

  test('shows a visible typing caret for add, extraction, inline rename, and construct inputs in CRT mode', async ({ page }) => {
    await openApp(page, { crt: 'true' });
    await openMenuThroughCrt(page);

    await clickThroughCrt(page, page.locator('#newNameInput'));
    await expectTypingCaretFor(page, '#newNameInput');

    await enableExtractionModeThroughCrt(page);
    await clickThroughCrt(page, page.locator('li[data-name="Neo"] .value-row input'));
    await expectTypingCaretFor(page, 'li[data-name="Neo"] .value-row input');

    await clickThroughCrt(page, page.locator('li[data-name="Neo"] .name-span'));
    await expectTypingCaretFor(page, 'li[data-name="Neo"] .name-edit-input');

    await clickThroughCrt(page, page.locator('#themeToggleBtn'));
    await clickThroughCrt(page, page.locator('#newNameInput'));
    await expectTypingCaretFor(page, '#newNameInput');
  });

  test('drag handle reorders operatives in CRT mode without extraction', async ({ page }) => {
    await openApp(page, { crt: 'true' });
    await openMenuThroughCrt(page);

    await dragThroughCrt(
      page,
      page.locator('li[data-name="Oracle"] .drag-handle'),
      page.locator('li[data-name="Neo"]')
    );

    await expectRosterOrder(page, ['Oracle', 'Neo', 'Trinity', 'Morpheus', 'Agent Smith', 'Cypher']);
    await page.reload();
    await expectRosterOrder(page, ['Oracle', 'Neo', 'Trinity', 'Morpheus', 'Agent Smith', 'Cypher']);
  });

  test('drag handle reorders operatives in CRT mode with extraction engaged', async ({ page }) => {
    await openApp(page, { crt: 'true' });
    await openMenuThroughCrt(page);
    await enableExtractionModeThroughCrt(page);

    await dragThroughCrt(
      page,
      page.locator('li[data-name="Trinity"] .drag-handle'),
      page.locator('li[data-name="Neo"]')
    );

    await expectRosterOrder(page, ['Trinity', 'Neo', 'Morpheus', 'Agent Smith', 'Oracle', 'Cypher']);
    await page.reload();
    await expectRosterOrder(page, ['Trinity', 'Neo', 'Morpheus', 'Agent Smith', 'Oracle', 'Cypher']);
  });
});
