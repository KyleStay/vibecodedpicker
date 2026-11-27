import { test, expect } from '../helpers/fixtures.mjs';
import { openApp, waitForAppReady, getRosterFromUrl, getClipboardWrites } from '../helpers/app.mjs';
import { openMenu } from '../helpers/roster.mjs';

test('adds a name from the keyboard with Extraction on and no alias', async ({ page }) => {
  await openApp(page, { 'crt-effect': 'off', roster: '[]', extraction: 'on' });
  await openMenu(page);
  await expect(page.locator('#newValueInput')).toBeVisible();
  await expect(page.locator('#newValueInput')).toHaveValue('');
  await page.locator('#newNameInput').fill('Ada');
  await page.locator('#newNameInput').press('Enter');
  expect(await getRosterFromUrl(page)).toEqual([{ name: 'Ada', value: '' }]);
  await page.locator('#menuToggleBtn').click({ force: true });
  await page.locator('#selectedNameDisplayWrapper').click();
  await expect.poll(() => getClipboardWrites(page)).toEqual(['Ada']);
});

test('confirms roster clearing and retains the empty roster on reload', async ({ page }) => {
  await openApp(page, { 'crt-effect': 'off', names: 'Ada|A,Grace|G', title: 'My Picker' });
  await page.locator('#selectedNameDisplayWrapper').click();
  await openMenu(page);
  await page.getByRole('button', { name: 'Split Teams', exact: true }).click();
  await page.getByRole('button', { name: 'Generate Teams' }).click();
  const clear = page.getByRole('button', { name: 'Clear Roster', exact: true });
  await clear.click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('#nameList .name-item')).toHaveCount(2);
  await expect(page.locator('#teamResults .team-card')).toHaveCount(2);
  await clear.click();
  await page.getByRole('button', { name: 'Remove All Names' }).click();
  await expect(page.locator('#nameList .name-item')).toHaveCount(0);
  await expect(page.getByText('Roster empty...')).toBeVisible();
  await expect(page.locator('#teamResults')).toBeHidden();
  await expect(page.locator('#undoBtn')).toBeDisabled();
  await expect(clear).toBeDisabled();
  const params = new URL(page.url()).searchParams;
  expect(params.get('title')).toBe('My Picker');
  expect(params.get('roster')).toBe('[]');
  expect(params.has('name')).toBe(false);
  expect(params.has('alias')).toBe(false);
  await page.reload();
  await waitForAppReady(page);
  await openMenu(page);
  await expect(page.locator('#nameList .name-item')).toHaveCount(0);
  await page.locator('#newNameInput').fill('Katherine');
  await page.getByRole('button', { name: 'Add Name' }).click();
  await expect(page.getByRole('button', { name: 'Rename Katherine' })).toBeVisible();
});
