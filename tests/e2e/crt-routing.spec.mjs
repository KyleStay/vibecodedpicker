import { test, expect } from '../helpers/fixtures.mjs';
import { clickThroughCrt, dragThroughCrt, expectTypingCaretFor, getRosterFromUrl, openApp, waitForAppReady } from '../helpers/app.mjs';
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

async function dispatchTouchDrag(page, start, end) {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: start.x, y: start.y, id: 1 }]
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: end.x, y: end.y, id: 1 }]
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  });
  await client.detach();
}

async function tapWithTouch(page, locator) {
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await page.evaluate(() => window.__VIBE_TEST__.renderFrame());
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Locator is not visible for touch tap.');
  }
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: box.x + (box.width / 2), y: box.y + (box.height / 2), id: 1 }]
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  });
  await client.detach();
}

async function clickRangeAtRatio(page, locator, ratio) {
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await page.evaluate(() => window.__VIBE_TEST__.renderFrame());
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Slider is not visible for range click.');
  }
  const boundedRatio = Math.max(0, Math.min(1, ratio));
  await page.mouse.click(box.x + (box.width * boundedRatio), box.y + (box.height / 2));
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

  test('desktop slider track clicks set values without dragging', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenuThroughCrt(page);

    const nativeSlider = page.locator('#brightnessSlider');
    await clickRangeAtRatio(page, nativeSlider, 0.73);
    const nativeValue = Number(await nativeSlider.inputValue());
    expect(nativeValue).toBeGreaterThanOrEqual(70);
    expect(nativeValue).toBeLessThanOrEqual(76);

    await openApp(page, { crt: 'true', 'crt-fishbowl': 0 });
    await openMenuThroughCrt(page);

    const crtSlider = page.locator('#crtScanlinesSlider');
    await clickRangeAtRatio(page, crtSlider, 0.84);
    const crtValue = Number(await crtSlider.inputValue());
    expect(crtValue).toBeGreaterThanOrEqual(78);
    expect(crtValue).toBeLessThanOrEqual(87);
  });

  test('CRT-routed setting help buttons expand explanations', async ({ page }) => {
    test.slow();
    await openApp(page, { crt: 'true', flatGrid: 'false' });
    await openMenuThroughCrt(page);

    const helpLabel = page.locator('label[for="rainDepthSlider"]');
    const helpButton = page.locator('label[for="rainDepthSlider"] + .setting-help-btn');
    await expect(helpButton).toHaveCount(1);
    const popoverId = await helpButton.getAttribute('aria-controls');
    await clickThroughCrt(page, helpLabel);

    await expect(helpButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(`#${popoverId}`)).toBeVisible();
  });

  test('mobile CRT slider rows allow vertical scroll and horizontal adjustment', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await openApp(page, { crt: 'true' });
    await openMenuThroughCrt(page);

    const panel = page.locator('#managementPanel');
    const slider = page.locator('#crtFishbowlSlider');
    await slider.evaluate((element) => {
      element.scrollIntoView({ block: 'center', inline: 'nearest' });
    });
    await panel.evaluate((element) => {
      element.scrollTop = Math.max(0, element.scrollTop - 180);
    });
    await page.evaluate(() => window.__VIBE_TEST__.renderFrame());

    const before = await panel.evaluate((element) => element.scrollTop);
    const valueBefore = await slider.inputValue();
    const box = await slider.boundingBox();
    if (!box) {
      throw new Error('CRT fishbowl slider is not visible for touch-scroll regression.');
    }

    await dispatchTouchDrag(
      page,
      { x: box.x + (box.width / 2), y: box.y + (box.height / 2) },
      { x: box.x + (box.width / 2), y: box.y + (box.height / 2) - 120 }
    );

    await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBeGreaterThan(before);
    await expect(slider).toHaveValue(valueBefore);

    await slider.evaluate((element) => {
      element.scrollIntoView({ block: 'center', inline: 'nearest' });
    });
    await page.evaluate(() => window.__VIBE_TEST__.renderFrame());
    const horizontalBox = await slider.boundingBox();
    if (!horizontalBox) {
      throw new Error('CRT fishbowl slider is not visible for touch-drag regression.');
    }

    await dispatchTouchDrag(
      page,
      { x: horizontalBox.x + (horizontalBox.width * 0.25), y: horizontalBox.y + (horizontalBox.height / 2) },
      { x: horizontalBox.x + (horizontalBox.width * 0.8), y: horizontalBox.y + (horizontalBox.height / 2) }
    );

    await expect(slider).not.toHaveValue(valueBefore);
  });

  test('mobile CRT setting help buttons still open explanations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await openApp(page, { crt: 'true', flatGrid: 'false' });
    await openMenuThroughCrt(page);

    const helpButton = page.locator('label[for="rainDepthSlider"] + .setting-help-btn');
    await expect(helpButton).toHaveCount(1);
    const popoverId = await helpButton.getAttribute('aria-controls');

    await tapWithTouch(page, helpButton);

    await expect(helpButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(`#${popoverId}`)).toBeVisible();
  });

  test('clicking a name edits it in CRT mode without extraction', async ({ page }) => {
    test.slow();
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
    await expect(await getRosterFromUrl(page)).toContainEqual({ name: 'Thomas Anderson', value: 'The One' });
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
    await expect(await getRosterFromUrl(page)).toContainEqual({ name: 'Pythia', value: 'Prophet' });
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
    test.slow();
    await openApp(page, { crt: 'true' });
    await openMenuThroughCrt(page);

    await dragThroughCrt(
      page,
      page.locator('li[data-name="Trinity"] .drag-handle'),
      page.locator('li[data-name="Neo"]'),
      { targetPosition: { x: 24, y: 4 } }
    );

    await expectRosterOrder(page, ['Trinity', 'Neo', 'Morpheus', 'Agent Smith', 'Oracle', 'Cypher']);
    await page.reload();
    await waitForAppReady(page);
    await expectRosterOrder(page, ['Trinity', 'Neo', 'Morpheus', 'Agent Smith', 'Oracle', 'Cypher']);
  });

  test('drag handle reorders a selected operative in CRT mode', async ({ page }) => {
    test.slow();
    await openApp(page, { crt: 'true', names: 'Alpha|A,Beta|B,Gamma|G' });
    await openMenuThroughCrt(page);

    await page.locator('li[data-name="Beta"]').evaluate((item) => {
      item.classList.add('name-item-selected');
      item.querySelector('.name-span')?.classList.add('line-through');
    });
    await page.evaluate(() => window.__VIBE_TEST__.renderFrame());

    await expect(page.locator('li[data-name="Beta"]')).toHaveClass(/name-item-selected/);
    await dragThroughCrt(
      page,
      page.locator('li[data-name="Beta"] .drag-handle'),
      page.locator('li[data-name="Alpha"]'),
      { targetPosition: { x: 24, y: 4 } }
    );

    await expectRosterOrder(page, ['Beta', 'Alpha', 'Gamma']);
  });

  test('drag handle reorders operatives in CRT mode with extraction engaged', async ({ page }) => {
    test.slow();
    await openApp(page, { crt: 'true' });
    await openMenuThroughCrt(page);
    await enableExtractionModeThroughCrt(page);

    await dragThroughCrt(
      page,
      page.locator('li[data-name="Trinity"] .drag-handle'),
      page.locator('li[data-name="Neo"]'),
      { targetPosition: { x: 24, y: 4 } }
    );

    await expectRosterOrder(page, ['Trinity', 'Neo', 'Morpheus', 'Agent Smith', 'Oracle', 'Cypher']);
    await page.reload();
    await waitForAppReady(page);
    await expectRosterOrder(page, ['Trinity', 'Neo', 'Morpheus', 'Agent Smith', 'Oracle', 'Cypher']);
  });
});
