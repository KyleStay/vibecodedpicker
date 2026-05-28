import { test, expect } from '../helpers/fixtures.mjs';
import { openApp, expectUrlToContain, waitForAppReady } from '../helpers/app.mjs';
import { openMenu } from '../helpers/roster.mjs';

test.describe('settings and URL persistence', () => {
  test('toggles and sliders persist through the URL and reload', async ({ page }) => {
    test.setTimeout(150000);
    await openApp(page, { crt: 'false', flatGrid: 'false' });
    await openMenu(page);

    await page.locator('#themeToggleBtn').evaluate((element) => element.click());
    await page.locator('#extractionModeBtn').evaluate((element) => element.click());
    await page.locator('#crtModeBtn').evaluate((element) => element.click());
    await expect(page.locator('#glitchFrequencySlider')).toHaveCount(0);

    await page.locator('#brightnessSlider').scrollIntoViewIfNeeded();
    await page.locator('#brightnessSlider').fill('73');
    await page.locator('#speedSlider').fill('22');
    await page.locator('#fontSizeSlider').fill('18');
    await page.locator('#tailCurveSlider').fill('35');
    await page.locator('#tailFloorSlider').fill('4');
    await page.locator('#rainDepthSlider').fill('68');
    await page.locator('#rainVarietySlider').fill('74');
    await page.locator('#laneDriftSlider').fill('61');
    await page.locator('#gapDensitySlider').fill('57');
    await page.locator('#leaderHeatSlider').fill('83');
    await page.locator('#glyphMutationSlider').fill('29');
    await page.locator('#crtFishbowlSlider').fill('18');
    await page.locator('#crtVignetteSlider').fill('52');
    await page.locator('#crtBeamFocusSlider').fill('41');
    await page.locator('#crtScanlinesSlider').fill('82');
    await page.locator('#crtGrilleSlider').fill('74');
    await page.locator('#crtNoiseSlider').fill('36');
    await page.locator('#crtSyncRollSlider').fill('22');
    await page.locator('#crtJitterSlider').fill('28');
    await page.locator('#brightnessSlider').blur();

    await expectUrlToContain(page, {
      brightness: 73,
      speed: 22,
      fontSize: 18,
      tailCurve: 35,
      tailFloor: 4,
      rainDepth: 68,
      rainVariety: 74,
      laneDrift: 61,
      gapDensity: 57,
      leaderHeat: 83,
      glyphMutation: 29,
      crtFishbowl: 18,
      crtVignette: 52,
      crtBeamFocus: 41,
      crtScanlines: 82,
      crtGrille: 74,
      crtNoise: 36,
      crtSyncRoll: 22,
      crtJitter: 28,
      flatGrid: 'false',
      extract: 'true',
      theme: 'construct'
    });
    await expect(page.url()).not.toContain('crt=false');

    await page.reload();
    await waitForAppReady(page);

    await expect(page.locator('body')).toHaveClass(/construct-mode/);
    await expect(page.locator('#extractionModeBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#crtModeBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#flatGridModeBtn')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#rainPerspectiveControls')).toBeVisible();
    await expect(page.locator('#glitchFrequencySlider')).toHaveCount(0);
    await expect(page.locator('#brightnessSlider')).toHaveValue('73');
    await expect(page.locator('#rainDepthSlider')).toHaveValue('68');
    await expect(page.locator('#rainVarietySlider')).toHaveValue('74');
    await expect(page.locator('#laneDriftSlider')).toHaveValue('61');
    await expect(page.locator('#gapDensitySlider')).toHaveValue('57');
    await expect(page.locator('#leaderHeatSlider')).toHaveValue('83');
    await expect(page.locator('#glyphMutationSlider')).toHaveValue('29');
    await expect(page.locator('#crtBeamFocusSlider')).toHaveValue('41');
    await expect(page.locator('#crtScanlinesSlider')).toHaveValue('82');
    await expect(page.locator('#crtGrilleSlider')).toHaveValue('74');
    await expect(page.locator('#crtNoiseSlider')).toHaveValue('36');
    await expect(page.locator('#crtSyncRollSlider')).toHaveValue('22');
    await expect(page.locator('#crtJitterSlider')).toHaveValue('28');
  });

  test('CRT controls stay directly below Construct Mode', async ({ page }) => {
    await openApp(page, { crt: 'false', flatGrid: 'false' });
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

  test('setting help buttons expand explanations', async ({ page }) => {
    await openApp(page, { crt: 'false', flatGrid: 'false' });
    await openMenu(page);

    const helpButton = page.locator('label[for="rainDepthSlider"] + .setting-help-btn');
    await expect(helpButton).toHaveCount(1);
    const popoverId = await helpButton.getAttribute('aria-controls');
    await helpButton.click();

    await expect(helpButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(`#${popoverId}`)).toBeVisible();
  });

  test('rain texture and perspective sliders preserve active trails', async ({ page }) => {
    await openApp(page, {
      crt: 'false',
      flatGrid: 'false',
      speed: 100,
      rainDepth: 35,
      rainVariety: 35,
      laneDrift: 30,
      gapDensity: 35,
      leaderHeat: 35
    });
    await openMenu(page);

    const beforeContinuity = await page.evaluate(() => window.__VIBE_TEST__.getRainContinuityDebug());
    const beforeProfiles = await page.evaluate(() => window.__VIBE_TEST__.getRainColumnProfiles());
    expect(beforeContinuity.columns).toBeGreaterThan(0);
    expect(beforeContinuity.trailHeads.some(Boolean)).toBe(true);

    await page.locator('#rainDepthSlider').fill('72');
    await page.locator('#rainVarietySlider').fill('82');
    await page.locator('#laneDriftSlider').fill('78');
    await page.locator('#gapDensitySlider').fill('68');
    await page.locator('#leaderHeatSlider').fill('92');

    const afterContinuity = await page.evaluate(() => window.__VIBE_TEST__.getRainContinuityDebug());
    const afterProfiles = await page.evaluate(() => window.__VIBE_TEST__.getRainColumnProfiles());

    expect(afterContinuity.columns).toBe(beforeContinuity.columns);
    expect(afterContinuity.profileSeeds).toEqual(beforeContinuity.profileSeeds);
    expect(afterContinuity.trailHeads).toEqual(beforeContinuity.trailHeads);
    expect(afterProfiles.some((profile, index) => profile.gapChance !== beforeProfiles[index].gapChance)).toBe(true);
    expect(afterProfiles.some((profile, index) => profile.leaderHeat !== beforeProfiles[index].leaderHeat)).toBe(true);
    expect(afterProfiles.some((profile, index) => profile.xOffset !== beforeProfiles[index].xOffset)).toBe(true);
  });

  test('effect reset buttons restore defaults without changing roster or extraction mode', async ({ page }) => {
    await openApp(page, {
      crt: 'false',
      flatGrid: 'false',
      brightness: 73,
      speed: 22,
      fontSize: 18,
      tailCurve: 35,
      tailFloor: 4,
      rainDepth: 68,
      rainVariety: 74,
      laneDrift: 61,
      gapDensity: 57,
      leaderHeat: 83,
      glyphMutation: 29,
      crtFishbowl: 18,
      crtVignette: 52,
      crtBeamFocus: 41,
      crtScanlines: 82,
      crtGrille: 74,
      crtNoise: 36,
      crtSyncRoll: 22,
      crtJitter: 28,
      theme: 'construct'
    });
    await openMenu(page);
    await page.locator('#extractionModeBtn').click();

    const rosterBefore = await page.locator('#nameList .name-span').allTextContents();

    await page.locator('#resetRainTextureEffectsBtn').scrollIntoViewIfNeeded();
    await page.locator('#resetRainTextureEffectsBtn').click();

    await expect(page.locator('#tailCurveSlider')).toHaveValue('10');
    await expect(page.locator('#tailFloorSlider')).toHaveValue('1');
    await expect(page.locator('#rainVarietySlider')).toHaveValue('50');
    await expect(page.locator('#gapDensitySlider')).toHaveValue('50');
    await expect(page.locator('#leaderHeatSlider')).toHaveValue('50');
    await expect(page.locator('#glyphMutationSlider')).toHaveValue('50');
    await expect(page.locator('#brightnessSlider')).toHaveValue('73');
    await expect(page.locator('#flatGridModeBtn')).toHaveAttribute('aria-pressed', 'false');
    await expectUrlToContain(page, {
      brightness: 73,
      speed: 22,
      fontSize: 18,
      rainDepth: 68,
      flatGrid: 'false',
      extract: 'true',
      theme: 'construct'
    });
    await expect(page.url()).not.toContain('rainVariety=');
    await expect(page.url()).not.toContain('gapDensity=');
    await expect(page.url()).not.toContain('leaderHeat=');
    await expect(page.url()).not.toContain('glyphMutation=');

    await page.locator('#resetAllEffectsBtn').scrollIntoViewIfNeeded();
    await page.locator('#resetAllEffectsBtn').click();

    await expect(page.locator('#extractionModeBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#crtModeBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#flatGridModeBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#rainPerspectiveControls')).toBeHidden();
    await expect(page.locator('body')).not.toHaveClass(/construct-mode/);
    await expect(page.locator('#brightnessSlider')).toHaveValue('100');
    await expect(page.locator('#speedSlider')).toHaveValue('10');
    await expect(page.locator('#fontSizeSlider')).toHaveValue('24');
    await expect(page.locator('#rainDepthSlider')).toHaveValue('50');
    await expect(page.locator('#rainVarietySlider')).toHaveValue('50');
    await expect(page.locator('#laneDriftSlider')).toHaveValue('50');
    await expect(page.locator('#crtBeamFocusSlider')).toHaveValue('72');
    await expect(page.locator('#crtScanlinesSlider')).toHaveValue('62');
    await expect(page.locator('#crtGrilleSlider')).toHaveValue('44');
    await expect(page.locator('#crtNoiseSlider')).toHaveValue('14');
    await expect(page.locator('#crtSyncRollSlider')).toHaveValue('6');
    await expect(page.locator('#crtJitterSlider')).toHaveValue('0');
    await expect(page.locator('#nameList .name-span')).toHaveText(rosterBefore);
    await expectUrlToContain(page, { extract: 'true' });
    await expect(page.url()).not.toContain('brightness=');
    await expect(page.url()).not.toContain('speed=');
    await expect(page.url()).not.toContain('flatGrid=');
    await expect(page.url()).not.toContain('theme=');
    await expect(page.url()).not.toContain('crt=false');
  });

  test('flat grid rain is default and organic perspective mode persists', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await openMenu(page);

    await expect(page.locator('#flatGridModeBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#rainPerspectiveControls')).toBeHidden();
    await expect(page.locator('#rainDepthSlider')).toBeDisabled();
    await expect(page.locator('#rainVarietySlider')).toBeEnabled();
    await expect(page.locator('#laneDriftSlider')).toBeDisabled();
    await expect(page.locator('#gapDensitySlider')).toBeEnabled();
    await expect(page.locator('#leaderHeatSlider')).toBeEnabled();
    await expect(page.locator('#glyphMutationSlider')).toBeEnabled();
    await expect(page.url()).not.toContain('flatGrid=');

    await page.locator('#rainVarietySlider').fill('77');
    await expectUrlToContain(page, {
      rainVariety: 77
    });
    await expect(page.url()).not.toContain('flatGrid=');
    const flatProfiles = await page.evaluate(() => window.__VIBE_TEST__.getRainColumnProfiles());
    const sampledFlatProfiles = flatProfiles.slice(0, 12);
    expect(sampledFlatProfiles.every((profile) => profile.xOffset === 0 && profile.driftAmount === 0)).toBe(true);
    expect(new Set(sampledFlatProfiles.map((profile) => profile.speedScale.toFixed(3))).size).toBeGreaterThan(1);
    expect(new Set(sampledFlatProfiles.map((profile) => profile.opacityScale.toFixed(3))).size).toBeGreaterThan(1);
    expect(new Set(sampledFlatProfiles.map((profile) => profile.trailLengthScale.toFixed(3))).size).toBeGreaterThan(1);
    expect(new Set(sampledFlatProfiles.map((profile) => profile.gapChance.toFixed(3))).size).toBeGreaterThan(1);
    expect(new Set(sampledFlatProfiles.map((profile) => profile.flipChanceScale.toFixed(3))).size).toBeGreaterThan(1);

    await page.locator('#flatGridModeBtn').click();
    await expect(page.locator('#flatGridModeBtn')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#rainPerspectiveControls')).toBeVisible();
    await expect(page.locator('#rainDepthSlider')).toBeEnabled();

    await page.locator('#rainDepthSlider').fill('82');
    await page.locator('#laneDriftSlider').fill('69');
    await expectUrlToContain(page, {
      flatGrid: 'false',
      rainDepth: 82,
      rainVariety: 77,
      laneDrift: 69
    });

    await page.locator('#flatGridModeBtn').click();
    await expect(page.locator('#flatGridModeBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#rainPerspectiveControls')).toBeHidden();
    await expect(page.url()).not.toContain('rainDepth=');
    await expect(page.url()).not.toContain('laneDrift=');
    await expect(page.url()).not.toContain('flatGrid=');
    await expectUrlToContain(page, {
      rainVariety: 77
    });

    await page.reload();
    await waitForAppReady(page);

    await expect(page.locator('#flatGridModeBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#rainPerspectiveControls')).toBeHidden();
    await expect(page.locator('#rainVarietySlider')).toBeEnabled();
    await expect(page.locator('#rainVarietySlider')).toHaveValue('77');
    await expect(page.locator('#gapDensitySlider')).toBeEnabled();
  });
});
