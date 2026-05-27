import { test, expect } from '../helpers/fixtures.mjs';
import { openApp, expectUrlToContain } from '../helpers/app.mjs';
import { openMenu } from '../helpers/roster.mjs';

test.describe('settings and URL persistence', () => {
  test('toggles and sliders persist through the URL and reload', async ({ page }) => {
    test.slow();
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    await page.locator('#themeToggleBtn').evaluate((element) => element.click());
    await page.locator('#extractionModeBtn').evaluate((element) => element.click());
    await page.locator('#crtModeBtn').evaluate((element) => element.click());
    await page.locator('#overdriveModeBtn').evaluate((element) => element.click());
    await page.locator('#overdriveModeBtn').evaluate((element) => element.click());
    await page.locator('#glitchOverdriveBtn').evaluate((element) => element.click());

    await page.locator('#brightnessSlider').scrollIntoViewIfNeeded();
    await page.locator('#brightnessSlider').fill('73');
    await page.locator('#speedSlider').fill('22');
    await page.locator('#fontSizeSlider').fill('18');
    await page.locator('#tailCurveSlider').fill('35');
    await page.locator('#tailFloorSlider').fill('4');
    await page.locator('#glitchFrequencySlider').fill('63');
    await page.locator('#crtFishbowlSlider').fill('18');
    await page.locator('#crtVignetteSlider').fill('52');
    await page.locator('#overdriveDriveSlider').fill('168');
    await page.locator('#overdrivePersistenceSlider').fill('1820');
    await page.locator('#overdriveBloomSlider').fill('172');

    await page.locator('#brightnessSlider').blur();

    await expectUrlToContain(page, {
      brightness: 73,
      speed: 22,
      fontSize: 18,
      tailCurve: 35,
      tailFloor: 4,
      glitchFrequency: 63,
      crtFishbowl: 18,
      crtVignette: 52,
      overdriveDrive: 168,
      overdrivePersistence: 1820,
      overdriveBloom: 172,
      extract: 'true',
      theme: 'construct'
    });
    await expect(page.url()).toContain('glitchOverdrive=false');
    await expect(page.url()).not.toContain('crt=false');

    await page.reload();

    await expect(page.locator('body')).toHaveClass(/construct-mode/);
    await expect(page.locator('#extractionModeBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#crtModeBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#overdriveModeBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#glitchOverdriveBtn')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#brightnessSlider')).toHaveValue('73');
    await expect(page.locator('#overdriveDriveSlider')).toHaveValue('168');
    await expect(page.locator('#overdrivePersistenceSlider')).toHaveValue('1820');
    await expect(page.locator('#overdriveBloomSlider')).toHaveValue('172');
  });

  test('CRT controls stay directly below Construct Mode', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    const sectionChildren = await page.locator('#appearanceSectionBody > *').evaluateAll((nodes) =>
      nodes.map((node) => {
        const button = node.matches('button') ? node : node.querySelector('button');
        const label = node.matches('label') ? node : node.querySelector('label');
        return {
          id: node.id || '',
          buttonId: button?.id || '',
          labelFor: label?.htmlFor || ''
        };
      })
    );

    const constructIndex = sectionChildren.findIndex((child) => child.buttonId === 'themeToggleBtn');
    const crtIndex = sectionChildren.findIndex((child) => child.buttonId === 'crtModeBtn');
    const intensityIndex = sectionChildren.findIndex((child) => child.labelFor === 'brightnessSlider');

    expect(constructIndex).toBeGreaterThanOrEqual(0);
    expect(crtIndex).toBe(constructIndex + 1);
    expect(intensityIndex).toBeGreaterThan(crtIndex);
  });
});
