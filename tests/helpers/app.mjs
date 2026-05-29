import { expect } from './fixtures.mjs';

export function buildAppPath(params = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set('e2e', '1');
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') { continue; }
    searchParams.set(key, String(value));
  }
  return `/?${searchParams.toString()}`;
}

export async function openApp(page, params = {}) {
  await page.goto(buildAppPath(params));
  await waitForAppReady(page);
}

export async function waitForAppReady(page) {
  await page.waitForFunction(() => window.__VIBE_TEST__ && window.__VIBE_TEST__.ready === true);
}

export async function pauseRain(page) {
  await page.evaluate(() => window.__VIBE_TEST__.pauseRain());
}

export async function setScene(page, sceneName) {
  await page.evaluate((scene) => window.__VIBE_TEST__.setScene(scene), sceneName);
}

export async function renderFrame(page) {
  await page.evaluate(() => window.__VIBE_TEST__.renderFrame());
}

export async function getPerformanceMetrics(page) {
  return page.evaluate(() => window.__VIBE_TEST__.getPerformanceMetrics());
}

export async function getClipboardWrites(page) {
  return page.evaluate(() => window.__TEST_CLIPBOARD__.slice());
}

export async function getRosterFromUrl(page) {
  const url = new URL(page.url());
  const names = url.searchParams.getAll('name');
  if (names.length > 0) {
    const aliases = url.searchParams.getAll('alias');
    return names.map((name, index) => ({
      name,
      value: aliases[index] || ''
    }));
  }
  const rosterPayload = url.searchParams.get('roster');
  return rosterPayload ? JSON.parse(rosterPayload) : [];
}

export async function clickThroughCrt(page, locator, options = {}) {
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await page.waitForTimeout(100);
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Locator is not visible for CRT click.');
  }
  const targetPosition = options.targetPosition || {
    x: box.width / 2,
    y: box.height / 2
  };
  await page.mouse.click(box.x + targetPosition.x, box.y + targetPosition.y);
}

export async function expectTypingCaretFor(page, inputSelector) {
  const caretLocator = page.locator('#managedTextCaret');
  await expect(caretLocator).toHaveAttribute('data-active', 'true');
  await expect(caretLocator).toHaveAttribute('data-visible', 'true');
  await page.waitForFunction((selector) => {
    const input = document.querySelector(selector);
    const caret = document.getElementById('managedTextCaret');
    if (!(input instanceof HTMLInputElement) || !caret) { return false; }
    const inputRect = input.getBoundingClientRect();
    const caretRect = caret.getBoundingClientRect();
    return document.activeElement === input
      && caret.dataset.active === 'true'
      && caret.dataset.visible === 'true'
      && caretRect.width > 0
      && caretRect.height > 0
      && caretRect.left >= inputRect.left - 4
      && caretRect.right <= inputRect.right + 4
      && caretRect.top >= inputRect.top - 6
      && caretRect.bottom <= inputRect.bottom + 6;
  }, inputSelector);
}

export async function dragThroughCrt(page, sourceLocator, targetLocator, options = {}) {
  await sourceLocator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await targetLocator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await page.waitForTimeout(100);
  const sourceBox = await sourceLocator.boundingBox();
  const targetBox = await targetLocator.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error('Expected both source and target to be visible for CRT drag.');
  }
  await page.mouse.move(sourceBox.x + (sourceBox.width / 2), sourceBox.y + (sourceBox.height / 2));
  await page.mouse.down();
  const targetPosition = options.targetPosition || {
    x: targetBox.width / 2,
    y: targetBox.height / 2
  };
  await page.mouse.move(targetBox.x + targetPosition.x, targetBox.y + targetPosition.y, { steps: 4 });
  await page.mouse.up();
}

export async function dragSliderThroughCrt(page, locator, ratio) {
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await page.waitForTimeout(100);
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Slider is not visible for CRT drag.');
  }
  const targetRatio = Math.max(0, Math.min(1, ratio));
  const startX = box.x + (box.width * 0.25);
  const endX = box.x + (box.width * targetRatio);
  const y = box.y + (box.height / 2);
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 12 });
  await page.mouse.up();
}

export async function expectUrlToContain(page, expectedPairs) {
  await page.waitForFunction((pairs) => {
    const url = new URL(window.location.href);
    return Object.entries(pairs).every(([key, value]) => url.searchParams.get(key) === String(value));
  }, expectedPairs);
}
