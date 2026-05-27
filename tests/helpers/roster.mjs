import { expect } from './fixtures.mjs';

export async function addOperative(page, { name, alias = '' }) {
  await openMenu(page);
  await page.locator('#newNameInput').fill(name);
  if (alias) {
    await page.locator('#newValueInput').fill(alias);
  }
  await page.locator('#addNameBtn').click();
}

export async function enableExtractionMode(page) {
  await openMenu(page);
  const button = page.locator('#extractionModeBtn');
  if ((await button.getAttribute('aria-pressed')) !== 'true') {
    await button.scrollIntoViewIfNeeded();
    await button.click({ force: true });
  }
}

export async function openMenu(page) {
  const panel = page.locator('#managementPanel');
  const isOpen = await panel.evaluate((element) => element.classList.contains('visible'));
  if (!isOpen) {
    await page.locator('#menuToggleBtn').click({ force: true });
    await expect(panel).toHaveClass(/visible/);
    await page.waitForTimeout(350);
  }
  await panel.evaluate((element) => {
    element.scrollTop = 0;
  });
}

export async function expectRosterOrder(page, names) {
  await expect(page.locator('#nameList .name-item .name-span')).toHaveText(names);
}
