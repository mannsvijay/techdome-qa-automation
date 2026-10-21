import { test, expect } from '../../utils/fixtures';
import { HomePage } from '../../utils/pages/HomePage';

/**
 * Page-level performance: Largest Contentful Paint, recorded but not asserted against
 * a threshold (per instructions). Confirmed live before writing this: a
 * PerformanceObserver with `buffered: true` reliably captures an LCP entry on this
 * page (observed value: ~1328ms in a one-off check).
 */

test.describe('Homepage performance', () => {
  test('Largest Contentful Paint is recorded and attached to the report', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__lcpValue = null;
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1] as any;
          if (last) (window as any).__lcpValue = last.renderTime || last.loadTime || last.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        // PerformanceObserver/LCP not supported in this browser — __lcpValue stays null.
      }
    });

    const homePage = new HomePage(page);
    await homePage.goto();
    await page.waitForTimeout(1500);

    const lcp = await page.evaluate(() => (window as any).__lcpValue);
    console.log('Largest Contentful Paint (ms):', lcp);

    await test.info().attach('largest-contentful-paint-ms', {
      body: String(lcp),
      contentType: 'text/plain',
    });

    expect(lcp).not.toBeNull();
  });
});
