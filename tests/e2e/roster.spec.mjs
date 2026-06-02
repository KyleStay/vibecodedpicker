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
    const sharedUrl = new URL(page.url());
    expect(sharedUrl.searchParams.getAll('name')).toContain('Switch');
    expect(sharedUrl.searchParams.has('roster')).toBe(false);
  });

  test('shows alias inputs in extraction mode and saves alias edits', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    await expect(page.locator('#newValueWrapper')).toBeHidden();
    await enableExtractionMode(page);
    await expect(page.locator('#newValueWrapper')).toBeVisible();
    await expect(page.locator('#nameList')).toHaveClass(/extraction-mode/);
    await expect(page.locator('li[data-name="Neo"] .drag-handle')).toHaveCSS('position', 'absolute');
    await expect(page.locator('li[data-name="Neo"] .name-row')).toHaveCSS('display', 'grid');
    await expect(page.locator('li[data-name="Neo"] .value-row input')).toBeVisible();

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

  test('normal roster rows use the full list width', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    await expect(page.locator('#nameList')).toHaveCSS('padding-left', '0px');
    await expect(page.locator('#nameList')).toHaveCSS('margin-left', '0px');
    await expect(page.locator('li[data-name="Neo"] .name-row')).toHaveCSS('display', 'grid');
    await expect(page.locator('li[data-name="Neo"]')).toHaveCSS('cursor', 'default');
    await expect(page.locator('li[data-name="Neo"] .name-span')).toHaveCSS('cursor', 'text');
    await expect(page.locator('li[data-name="Neo"] .drag-handle')).toHaveCSS('cursor', 'grab');
    await expect(page.locator('li[data-name="Neo"] .drag-handle')).toHaveCSS('width', '24px');
    await expect(page.locator('li[data-name="Neo"] .remove-name-btn')).toHaveCSS('width', '28px');
    await expect(page.locator('li[data-name="Neo"] .remove-name-btn')).toHaveCSS('justify-self', 'end');
  });

  test('removes an operative and updates the URL', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    await page.locator('li[data-name="Cypher"] .remove-name-btn').evaluate((element) => element.click());
    await page.waitForTimeout(350);

    await expect(page.locator('li[data-name="Cypher"]')).toHaveCount(0);
    await expect((await getRosterFromUrl(page)).some((entry) => entry.name === 'Cypher')).toBe(false);
  });

  test('handles roster names with selector metacharacters', async ({ page }) => {
    const specialName = 'Cipher "One"]';

    await openApp(page, { crt: 'false', names: specialName });
    await page.locator('#selectedNameDisplayWrapper').click();
    await expect(page.locator('#selectedNameDisplay')).toHaveText(specialName);
    await openMenu(page);
    await expect(page.locator('#nameList .name-item').filter({ hasText: specialName })).toHaveClass(/name-item-selected/);

    await openApp(page, { crt: 'false' });
    await openMenu(page);
    await addOperative(page, { name: specialName });
    const specialRow = page.locator('#nameList .name-item').filter({ hasText: specialName });
    await expect(specialRow).toBeVisible();
    await specialRow.locator('.remove-name-btn').evaluate((element) => element.click());
    await page.waitForTimeout(350);

    await expect(specialRow).toHaveCount(0);
    await expect((await getRosterFromUrl(page)).some((entry) => entry.name === specialName)).toBe(false);
  });

  test('reorders operatives and keeps the order after reload', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    const source = page.locator('li[data-name="Oracle"] .drag-handle');
    const target = page.locator('li[data-name="Neo"]');
    const targetBox = await target.boundingBox();
    if (!targetBox) {
      throw new Error('Expected source handle and target row to be visible for drag reorder.');
    }
    await source.dragTo(target, {
      targetPosition: {
        x: targetBox.width / 2,
        y: 4
      }
    });

    await expectRosterOrder(page, ['Oracle', 'Neo', 'Trinity', 'Morpheus', 'Agent Smith', 'Cypher']);
    await page.reload();
    await expectRosterOrder(page, ['Oracle', 'Neo', 'Trinity', 'Morpheus', 'Agent Smith', 'Cypher']);
  });

  test('shows the operative card under the pointer while dragging', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    const source = page.locator('li[data-name="Trinity"]');
    const handle = source.locator('.drag-handle');
    const sourceBox = await source.boundingBox();
    const handleBox = await handle.boundingBox();
    if (!sourceBox || !handleBox) {
      throw new Error('Expected source row and handle to be visible for drag preview.');
    }

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;
    const dragX = startX + 52;
    const dragY = startY + 34;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(dragX, dragY, { steps: 4 });

    const preview = page.locator('body > .roster-drag-preview');
    await expect(preview).toBeVisible();
    await expect(preview.locator('.name-span')).toHaveText('Trinity');
    const previewBox = await preview.boundingBox();
    if (!previewBox) {
      throw new Error('Expected drag preview to have a visible bounding box.');
    }
    expect(dragX).toBeGreaterThanOrEqual(previewBox.x);
    expect(dragX).toBeLessThanOrEqual(previewBox.x + previewBox.width);
    expect(dragY).toBeGreaterThanOrEqual(previewBox.y);
    expect(dragY).toBeLessThanOrEqual(previewBox.y + previewBox.height);

    await page.mouse.up();
    await expect(preview).toHaveCount(0);
  });

  test('reorders a selected operative and keeps the order after reload', async ({ page }) => {
    await openApp(page, { crt: 'false', names: 'Alpha|A,Beta|B,Gamma|G' });

    await page.locator('#selectedNameDisplayWrapper').click();
    const pickedName = await page.locator('#selectedNameDisplay').textContent();
    await openMenu(page);

    const targetName = pickedName === 'Gamma' ? 'Alpha' : 'Gamma';
    const source = page.locator(`li[data-name="${pickedName}"] .drag-handle`);
    const target = page.locator(`li[data-name="${targetName}"]`);
    const targetBox = await target.boundingBox();
    if (!pickedName || !targetBox) {
      throw new Error('Expected selected source and reorder target to be visible.');
    }

    await expect(page.locator(`li[data-name="${pickedName}"]`)).toHaveClass(/name-item-selected/);
    await source.dragTo(target, {
      targetPosition: {
        x: targetBox.width / 2,
        y: 4
      }
    });

    const expectedOrder = ['Alpha', 'Beta', 'Gamma'].filter((name) => name !== pickedName);
    expectedOrder.splice(expectedOrder.indexOf(targetName), 0, pickedName);
    await expectRosterOrder(page, expectedOrder);

    await page.reload();
    await expectRosterOrder(page, expectedOrder);
  });

  test('reorders operatives from the drag handle when extraction mode is engaged', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);
    await enableExtractionMode(page);

    const source = page.locator('li[data-name="Oracle"] .drag-handle');
    const target = page.locator('li[data-name="Neo"]');
    const targetBox = await target.boundingBox();
    if (!targetBox) {
      throw new Error('Expected source handle and target row to be visible for drag reorder.');
    }
    await source.dragTo(target, {
      targetPosition: {
        x: targetBox.width / 2,
        y: 4
      }
    });

    await expectRosterOrder(page, ['Oracle', 'Neo', 'Trinity', 'Morpheus', 'Agent Smith', 'Cypher']);
    await page.reload();
    await expectRosterOrder(page, ['Oracle', 'Neo', 'Trinity', 'Morpheus', 'Agent Smith', 'Cypher']);
  });
});
