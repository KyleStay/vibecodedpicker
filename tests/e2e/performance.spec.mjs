import { test, expect } from '../helpers/fixtures.mjs';
import { getPerformanceMetrics, openApp, renderFrame } from '../helpers/app.mjs';

async function sampleCanvasHash(page, canvasId = 'matrixCanvas') {
  return page.evaluate((targetCanvasId) => {
    const canvas = document.getElementById(targetCanvasId);
    const context = canvas?.getContext('2d');
    if (!canvas || !context || canvas.width <= 0 || canvas.height <= 0) {
      return null;
    }
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261 >>> 0;
    for (let index = 0; index < pixels.length; index += 64) {
      const value = pixels[index] + pixels[index + 1] + pixels[index + 2] + pixels[index + 3];
      hash ^= value;
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash;
  }, canvasId);
}

async function sampleCrtHash(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById('crtCanvas');
    const gl = canvas?.getContext('webgl');
    if (!canvas || !gl || canvas.width <= 0 || canvas.height <= 0) {
      return null;
    }
    const width = canvas.width;
    const height = canvas.height;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let hash = 2166136261 >>> 0;
    for (let index = 0; index < pixels.length; index += 96) {
      const value = pixels[index] + pixels[index + 1] + pixels[index + 2] + pixels[index + 3];
      hash ^= value;
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash;
  });
}

test.describe('matrix rendering performance path', () => {
  test('non-CRT rain reports CPU renderer metrics', async ({ page }) => {
    await openApp(page, { crt: 'false' });
    await renderFrame(page);

    const metrics = await getPerformanceMetrics(page);
    expect(metrics.renderer).toBe('cpu');
    expect(metrics.cpuMatrixDrawMs).toBeGreaterThanOrEqual(0);
    expect(metrics.rainUpdateMs).toBeGreaterThanOrEqual(metrics.cpuMatrixDrawMs);
  });

  test('CRT rain keeps animating', async ({ page }) => {
    test.slow();
    await openApp(page, { crt: 'true', speed: '40' });
    await page.evaluate(() => window.__VIBE_TEST__.resumeRain());
    await page.waitForTimeout(800);

    const activeHash = await sampleCrtHash(page);
    await expect.poll(() => sampleCrtHash(page), { timeout: 3000 }).not.toBe(activeHash);

    const metrics = await getPerformanceMetrics(page);
    expect(metrics.renderer).toBe('webgl');
    expect(metrics.crtTextureUpload).toBe('gpu');
    expect(metrics.crtSourceScale).toBeGreaterThan(0);
    expect(metrics.crtSourceScale).toBeLessThanOrEqual(0.7);

    const debug = await page.evaluate(() => window.__VIBE_TEST__.getMatrixRenderDebug());
    expect(debug.leaderStyle.glowPasses).toEqual([]);
    expect(debug.gpuRainReady).toBe(true);
  });
});
