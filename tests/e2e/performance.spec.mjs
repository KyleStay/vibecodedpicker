import { test, expect } from '../helpers/fixtures.mjs';
import { getPerformanceMetrics, openApp, pauseRain, renderFrame, setForceCpuOverdrive } from '../helpers/app.mjs';

async function sampleAverageCpuDrawMs(page, frameCount = 18) {
  let totalCpuDrawMs = 0;
  let totalCompositeMs = 0;
  let totalCpuOverdriveTextOps = 0;

  for (let index = 0; index < frameCount; index += 1) {
    await renderFrame(page);
    const metrics = await getPerformanceMetrics(page);
    totalCpuDrawMs += metrics.cpuMatrixDrawMs;
    totalCompositeMs += metrics.compositeMs;
    totalCpuOverdriveTextOps += metrics.cpuOverdriveTextOps;
  }

  return {
    averageCpuDrawMs: totalCpuDrawMs / frameCount,
    averageCompositeMs: totalCompositeMs / frameCount,
    averageCpuOverdriveTextOps: totalCpuOverdriveTextOps / frameCount
  };
}

test.describe('GPU overdrive performance path', () => {
  test('non-CRT overdrive uses the GPU compositor without increasing CPU overdrive text work versus forced CPU fallback', async ({ page }) => {
    await openApp(page, { crt: 'false', e2eScene: 'overdrive-demo', overdrive: 'true' });
    await pauseRain(page);

    await setForceCpuOverdrive(page, false);
    const gpuAverages = await sampleAverageCpuDrawMs(page);
    const gpuMetrics = await getPerformanceMetrics(page);

    expect(gpuMetrics.renderer).toBe('gpu-noncrt');
    expect(gpuMetrics.compositeMs).toBeGreaterThan(0);

    await setForceCpuOverdrive(page, true);
    const cpuAverages = await sampleAverageCpuDrawMs(page);
    const cpuMetrics = await getPerformanceMetrics(page);

    expect(cpuMetrics.renderer).toBe('cpu');
    expect(gpuAverages.averageCpuOverdriveTextOps).toBeLessThanOrEqual(cpuAverages.averageCpuOverdriveTextOps);
    expect(gpuAverages.averageCompositeMs).toBeGreaterThanOrEqual(0);
  });

  test('CRT overdrive uses the GPU compositor and reports composite timing', async ({ page }) => {
    await openApp(page, { crt: 'true', e2eScene: 'overdrive-demo', overdrive: 'true' });
    await pauseRain(page);

    await setForceCpuOverdrive(page, false);
    const gpuAverages = await sampleAverageCpuDrawMs(page, 6);
    const gpuMetrics = await getPerformanceMetrics(page);

    expect(gpuMetrics.renderer).toBe('gpu-crt');
    expect(gpuMetrics.compositeMs).toBeGreaterThan(0);
    expect(gpuAverages.averageCpuDrawMs).toBeGreaterThan(0);
  });
});
