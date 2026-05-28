import { test, expect } from '../helpers/fixtures.mjs';
import { getRosterFromUrl, openApp, expectUrlToContain } from '../helpers/app.mjs';
import { addOperative, enableExtractionMode, expectRosterOrder, openMenu } from '../helpers/roster.mjs';

test.describe('roster management', () => {
  test('adds an operative, updates title, and persists via URL', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    await page.locator('#titleInput').fill('Mission Roster');
    await addOperative(page, { name: 'Switch' });

    await expect(page.locator('#nameList .name-item[data-name="Switch"]')).toBeVisible();
    await expect(page.locator('#schemaTitleDisplay')).toHaveText('Mission Roster');
    await expectUrlToContain(page, { title: 'Mission Roster' });
    await expect(await getRosterFromUrl(page)).toContainEqual({ name: 'Switch', value: '' });
  });

  test('shows alias inputs in extraction mode and saves alias edits', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    await expect(page.locator('#newValueWrapper')).toBeHidden();
    await enableExtractionMode(page);
    await expect(page.locator('#newValueWrapper')).toBeVisible();

    await addOperative(page, { name: 'Dozer', alias: 'Zion' });
    await expect(await getRosterFromUrl(page)).toContainEqual({ name: 'Dozer', value: 'Zion' });

    const aliasInput = page.locator('li[data-name="Dozer"] .value-row input');
    await aliasInput.fill('Nebuchadnezzar');
    await aliasInput.blur();
    await expect(await getRosterFromUrl(page)).toContainEqual({ name: 'Dozer', value: 'Nebuchadnezzar' });
  });

  test('clicking a name edits it in non-extraction mode', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    const nameLabel = page.locator('li[data-name="Neo"] .name-span');
    await nameLabel.click();
    const nameInput = page.locator('li[data-name="Neo"] .name-edit-input');
    await nameInput.fill('Thomas Anderson');
    await nameInput.press('Enter');

    await expect(page.locator('li[data-name="Thomas Anderson"]')).toBeVisible();
    await expect(await getRosterFromUrl(page)).toContainEqual({ name: 'Thomas Anderson', value: 'The One' });
  });

  test('clicking a name edits it in extraction mode and preserves the alias', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);
    await enableExtractionMode(page);

    const nameLabel = page.locator('li[data-name="Oracle"] .name-span');
    await nameLabel.click();
    const nameInput = page.locator('li[data-name="Oracle"] .name-edit-input');
    await nameInput.fill('Pythia');
    await nameInput.press('Enter');

    await expect(page.locator('li[data-name="Pythia"]')).toBeVisible();
    await expect(await getRosterFromUrl(page)).toContainEqual({ name: 'Pythia', value: 'Prophet' });
  });

  test('uses the native input caret in non-CRT mode', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    await page.locator('#newNameInput').click();
    await expect(page.locator('#newNameInput')).toBeFocused();
    await expect(page.locator('#managedTextCaret')).toHaveAttribute('data-active', 'false');

    await enableExtractionMode(page);
    await page.locator('li[data-name="Neo"] .value-row input').click();
    await expect(page.locator('li[data-name="Neo"] .value-row input')).toBeFocused();
    await expect(page.locator('#managedTextCaret')).toHaveAttribute('data-active', 'false');

    await page.locator('li[data-name="Neo"] .name-span').click();
    await expect(page.locator('li[data-name="Neo"] .name-edit-input')).toBeFocused();
    await expect(page.locator('#managedTextCaret')).toHaveAttribute('data-active', 'false');

    await page.locator('#themeToggleBtn').click();
    await page.locator('#newNameInput').click();
    await expect(page.locator('#newNameInput')).toBeFocused();
    await expect(page.locator('#managedTextCaret')).toHaveAttribute('data-active', 'false');
  });

  test('does not add duplicate names', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);
    const initialCount = await page.locator('#nameList .name-item').count();

    await page.locator('#newNameInput').fill('Neo');
    await page.locator('#addNameBtn').click();

    await expect(page.locator('#nameList .name-item')).toHaveCount(initialCount);
  });

  test('removes an operative and updates the URL', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    await page.locator('li[data-name="Cypher"] .remove-name-btn').click({ force: true });
    await page.waitForTimeout(350);

    await expect(page.locator('li[data-name="Cypher"]')).toHaveCount(0);
    await expect((await getRosterFromUrl(page)).some((entry) => entry.name === 'Cypher')).toBe(false);
  });

  test('reorders operatives and keeps the order after reload', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    const source = page.locator('li[data-name="Oracle"] .drag-handle');
    const target = page.locator('li[data-name="Neo"]');
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    if (!sourceBox || !targetBox) {
      throw new Error('Expected source handle and target row to be visible for drag reorder.');
    }
    await page.mouse.move(sourceBox.x + (sourceBox.width / 2), sourceBox.y + (sourceBox.height / 2));
    await page.mouse.down();
    await page.mouse.move(targetBox.x + (targetBox.width / 2), targetBox.y + (targetBox.height / 2), { steps: 16 });
    await page.mouse.up();

    await expectRosterOrder(page, ['Oracle', 'Neo', 'Trinity', 'Morpheus', 'Agent Smith', 'Cypher']);
    await page.reload();
    await expectRosterOrder(page, ['Oracle', 'Neo', 'Trinity', 'Morpheus', 'Agent Smith', 'Cypher']);
  });

  test('reorders operatives from the drag handle when extraction mode is engaged', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);
    await enableExtractionMode(page);

    const source = page.locator('li[data-name="Oracle"] .drag-handle');
    const target = page.locator('li[data-name="Neo"]');
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    if (!sourceBox || !targetBox) {
      throw new Error('Expected source handle and target row to be visible for drag reorder.');
    }
    await page.mouse.move(sourceBox.x + (sourceBox.width / 2), sourceBox.y + (sourceBox.height / 2));
    await page.mouse.down();
    await page.mouse.move(targetBox.x + (targetBox.width / 2), targetBox.y + (targetBox.height / 2), { steps: 16 });
    await page.mouse.up();

    await expectRosterOrder(page, ['Oracle', 'Neo', 'Trinity', 'Morpheus', 'Agent Smith', 'Cypher']);
    await page.reload();
    await expectRosterOrder(page, ['Oracle', 'Neo', 'Trinity', 'Morpheus', 'Agent Smith', 'Cypher']);
  });
});
