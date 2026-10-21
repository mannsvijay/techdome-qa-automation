import { test, expect } from '../../utils/fixtures';
import { HomePage } from '../../utils/pages/HomePage';

/**
 * US-010: Third-party scripts (Google Tag Manager / gtag) must not block the hero
 * content from rendering.
 *
 * Confirmed via a one-off check before writing this test: the gtm.js/gtag.js <script>
 * tags are injected dynamically (not present at domcontentloaded, only after) with
 * `async: true` and no `defer` attribute — consistent with non-blocking loading.
 *
 * Rather than asserting a fixed wall-clock budget, this test ties the hero's
 * visibility directly to the thing it's supposed to be independent of: every
 * googletagmanager.com request is delayed by 5s, and the hero must become visible
 * strictly before that delayed response is actually released back to the page.
 */
test.describe('US-010: Third-party scripts do not block homepage render', () => {
  test('hero heading renders before any delayed GTM response is released', async ({ page }) => {
    let firstGtmResponseReleasedAt: number | null = null;
    let resolveFirstRelease: () => void;
    const firstReleasePromise = new Promise<void>((resolve) => {
      resolveFirstRelease = resolve;
    });

    await page.route('https://www.googletagmanager.com/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      if (firstGtmResponseReleasedAt === null) {
        firstGtmResponseReleasedAt = Date.now();
        resolveFirstRelease();
      }
      await route.continue();
    });

    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.heroHeading).toBeVisible();
    const heroVisibleAt = Date.now();

    // Let the delayed GTM request actually resolve so there's a real release
    // timestamp to compare against, not just an absence of one.
    await firstReleasePromise;

    expect(heroVisibleAt).toBeLessThan(firstGtmResponseReleasedAt!);
  });
});
