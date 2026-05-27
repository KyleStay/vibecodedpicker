import { test as base, expect } from '@playwright/test';

async function installBrowserStubs(page) {
  await page.addInitScript(() => {
    window.__TEST_CLIPBOARD__ = [];
    window.__TEST_FULLSCREEN_ELEMENT__ = null;

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText(text) {
          window.__TEST_CLIPBOARD__.push(String(text));
          return Promise.resolve();
        }
      }
    });

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get() {
        return window.__TEST_FULLSCREEN_ELEMENT__;
      }
    });

    Element.prototype.requestFullscreen = function requestFullscreen() {
      window.__TEST_FULLSCREEN_ELEMENT__ = this;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    };

    document.exitFullscreen = function exitFullscreen() {
      window.__TEST_FULLSCREEN_ELEMENT__ = null;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    };
  });
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await installBrowserStubs(page);
    await use(page);
  }
});

export { expect };
