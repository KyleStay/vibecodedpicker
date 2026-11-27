import { test, expect } from '../helpers/fixtures.mjs';
import { openApp, getClipboardWrites } from '../helpers/app.mjs';
import { addOperative, openMenu } from '../helpers/roster.mjs';

test('splits the entire roster into balanced teams without changing picks', async ({ page }) => {
  await openApp(page, { crt: 'false', names: 'Neo|A,Trinity|B,Morpheus|C,Switch|D,Mouse|E' });
  await page.locator('#selectedNameDisplayWrapper').click();
  await openMenu(page);
  await page.getByRole('button', { name: 'Split Teams', exact: true }).click();
  await page.getByLabel('Number of teams').fill('3');
  await page.getByRole('button', { name: 'Generate Teams' }).click();
  const groups = page.locator('#teamResults .team-card');
  await expect(groups).toHaveCount(3);
  const names = await page.locator('#teamResults li').allTextContents();
  expect([...names].sort()).toEqual(['Morpheus', 'Mouse', 'Neo', 'Switch', 'Trinity']);
  expect(await groups.evaluateAll(cards => cards.map(card => card.querySelectorAll('li').length))).toEqual([2, 2, 1]);
  await expect(page.locator('#progressBar .progress-segment.filled')).toHaveCount(1);
  await page.getByRole('button', { name: 'Reshuffle Teams' }).click();
  await expect(groups).toHaveCount(3);
  await page.getByRole('button', { name: 'Copy Teams' }).click();
  expect((await getClipboardWrites(page))[0]).toMatch(/^Team 1\n[\s\S]*\n\nTeam 3\n/);
  await addOperative(page, { name: 'Cypher' });
  await expect(page.locator('#teamResults')).toBeHidden();
});

test('rejects invalid team counts and supports one team per operative on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page, { crt: 'false', names: 'Neo|A,Trinity|B' });
  await openMenu(page);
  await page.getByRole('button', { name: 'Split Teams', exact: true }).click();
  const count = page.getByLabel('Number of teams');
  await count.fill('2.5');
  await count.press('Enter');
  await expect(page.locator('#teamStatus')).toHaveText('Enter a whole number from 1 to 2.');
  await count.fill('2');
  await count.press('Enter');
  await expect(page.locator('#teamResults .team-card')).toHaveCount(2);
  expect(await page.locator('#teamResults ul').evaluateAll(lists => lists.map(list => list.children.length))).toEqual([1, 1]);
});
