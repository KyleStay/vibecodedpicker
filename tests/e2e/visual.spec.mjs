import { test, expect } from '../helpers/fixtures.mjs';
import { clickThroughCrt, openApp, pauseRain } from '../helpers/app.mjs';
import { openMenu } from '../helpers/roster.mjs';

const CRT_SCREENSHOT_TIMEOUT_MS = 15000;

async function setSliderValue(page, selector, value) {
  await page.locator(selector).evaluate((slider, nextValue) => {
    slider.value = String(nextValue);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function measureGrilleContrastAtBeamFocus(page, beamFocusPercent) {
  await setSliderValue(page, '#crtBeamFocusSlider', beamFocusPercent);
  return page.evaluate(() => {
    window.__VIBE_TEST__.renderCrtTestPattern('green-field');
    return window.__VIBE_TEST__.measureCrtVerticalCarrierContrast();
  });
}

async function measureScanlineContrastAtFishbowl(page, fishbowlPercent) {
  await setSliderValue(page, '#crtFishbowlSlider', fishbowlPercent);
  return page.evaluate(() => {
    window.__VIBE_TEST__.renderCrtTestPattern('green-field');
    return window.__VIBE_TEST__.measureCrtHorizontalCarrierContrast();
  });
}

test.describe('visual snapshots', () => {
  test('management panel layout', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);
    await pauseRain(page);
    await expect(page.locator('#managementPanel')).toHaveScreenshot('management-panel-layout.png');
  });

  test('extraction roster handle rail layout', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);
    await page.locator('#extractionModeBtn').click();
    await pauseRain(page);
    await expect(page.locator('#rosterSectionBody')).toHaveScreenshot('extraction-roster-handle-rail.png');
  });

  test('construct mode shell', async ({ page }) => {
    await openApp(page, { crt: 'false', theme: 'construct' });
    await pauseRain(page);
    await expect(page.locator('#mainDisplayContainer')).toHaveScreenshot('construct-shell.png');
  });

  test('overlay masking with help modal', async ({ page }) => {
    await openApp(page, { crt: 'true' });
    await clickThroughCrt(page, page.locator('#helpBtn'));
    await expect(page.locator('#helpModalOverlay')).toBeVisible();
    await pauseRain(page);
    await expect(page).toHaveScreenshot('overlay-masking-help.png', { timeout: CRT_SCREENSHOT_TIMEOUT_MS });
  });
});

test.describe('CRT rendering model', () => {
  test('beam focus does not change aperture grille carrier clarity', async ({ page }) => {
    await openApp(page, {
      crt: 'true',
      brightness: 100,
      'crt-fishbowl': 0,
      'crt-vignette': 0,
      'crt-scanlines': 0,
      'crt-grille': 100,
      'crt-noise': 0,
      'crt-sync-roll': 0,
      'crt-jitter': 0,
      'crt-distortion-drift': 0
    });

    const softBeam = await measureGrilleContrastAtBeamFocus(page, 0);
    const sharpBeam = await measureGrilleContrastAtBeamFocus(page, 100);
    const contrastDrift = Math.abs(softBeam.adjacentContrast - sharpBeam.adjacentContrast)
      / Math.max(softBeam.adjacentContrast, sharpBeam.adjacentContrast);

    expect(softBeam.averageLuminance).toBeGreaterThan(10);
    expect(softBeam.adjacentContrast).toBeGreaterThan(0.015);
    expect(sharpBeam.adjacentContrast).toBeGreaterThan(0.015);
    expect(contrastDrift).toBeLessThan(0.02);
  });

  test('tube curvature does not swim the scanline carrier', async ({ page }) => {
    await openApp(page, {
      crt: 'true',
      brightness: 100,
      'crt-fishbowl': 0,
      'crt-vignette': 0,
      'crt-beam-focus': 100,
      'crt-scanlines': 100,
      'crt-grille': 0,
      'crt-noise': 0,
      'crt-sync-roll': 0,
      'crt-jitter': 0,
      'crt-distortion-drift': 0
    });

    const flatTube = await measureScanlineContrastAtFishbowl(page, 0);
    const curvedTube = await measureScanlineContrastAtFishbowl(page, 100);
    const contrastDrift = Math.abs(flatTube.adjacentContrast - curvedTube.adjacentContrast)
      / Math.max(flatTube.adjacentContrast, curvedTube.adjacentContrast);

    expect(flatTube.averageLuminance).toBeGreaterThan(10);
    expect(flatTube.adjacentContrast).toBeGreaterThan(0.015);
    expect(curvedTube.adjacentContrast).toBeGreaterThan(0.015);
    expect(contrastDrift).toBeLessThan(0.02);
  });

  test('signal noise sits under the glass vignette', async ({ page }) => {
    await openApp(page, {
      crt: 'true',
      brightness: 100,
      'crt-fishbowl': 0,
      'crt-vignette': 100,
      'crt-beam-focus': 100,
      'crt-scanlines': 0,
      'crt-grille': 0,
      'crt-noise': 100,
      'crt-sync-roll': 0,
      'crt-jitter': 0,
      'crt-distortion-drift': 0
    });

    const noiseEnvelope = await page.evaluate(() => {
      window.__VIBE_TEST__.renderCrtTestPattern('black-field');
      return {
        center: window.__VIBE_TEST__.measureCrtRegionLuminance({ x: 0.47, y: 0.47, width: 0.06, height: 0.06 }),
        corner: window.__VIBE_TEST__.measureCrtRegionLuminance({ x: 0.02, y: 0.02, width: 0.08, height: 0.08 })
      };
    });

    expect(noiseEnvelope.center.averageLuminance).toBeGreaterThan(1);
    expect(noiseEnvelope.corner.averageLuminance).toBeLessThan(noiseEnvelope.center.averageLuminance * 0.35);
  });
});
