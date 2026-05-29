import { test as base, expect } from '@playwright/test';

async function installBrowserStubs(page) {
  await page.addInitScript(() => {
    window.__TEST_CLIPBOARD__ = [];
    window.__TEST_FULLSCREEN_ELEMENT__ = null;
    window.__TEST_FULLSCREEN_REJECT_COUNT__ = window.__TEST_FULLSCREEN_REJECT_COUNT__ || 0;

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
      if (window.__TEST_FULLSCREEN_REJECT_COUNT__ > 0) {
        window.__TEST_FULLSCREEN_REJECT_COUNT__ -= 1;
        return Promise.reject(new Error('Fullscreen blocked by test stub.'));
      }
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
