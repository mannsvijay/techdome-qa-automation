import { test, expect } from '../../utils/fixtures';
import { HomePage } from '../../utils/pages/HomePage';

/**
 * US-002: Footer navigation.
 *
 * Observed live before writing any assertion:
 * - Exactly one contentinfo (footer) landmark.
 * - Four nav landmarks inside it, each with an aria-label matching its visible heading:
 *   "Services" (9 links), "Industries" (8), "Products" (8), "Company" (9).
 * - 48 total <a> elements in the footer, 47 unique hrefs (39 internal, starting with
 *   "/"; 7 external https:// links; 1 "tel:" link).
 * - 5 links with the accessible-name pattern "Techdome on X" are the social icon row
 *   (LinkedIn, X, Instagram, GitHub, Facebook) — distinct from a separate "Clutch" /
 *   "$300K+ · 100% Upwork" trust-badge row, which this file doesn't treat as "social
 *   icons" since it wasn't observed to share that same naming/visual pattern.
 */

const EXPECTED_FOOTER_NAVS: Record<string, number> = {
  Services: 9,
  Industries: 8,
  Products: 8,
  Company: 9,
};

const SOCIAL_DOMAINS: Record<string, string> = {
  LinkedIn: 'linkedin.com',
  X: 'x.com',
  Instagram: 'instagram.com',
  GitHub: 'github.com',
  Facebook: 'facebook.com',
};

test.describe('US-002: Footer navigation', () => {
  test('each footer nav landmark is present with at least one link', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.footer).toHaveCount(1);

    for (const [label, expectedLinkCount] of Object.entries(EXPECTED_FOOTER_NAVS)) {
      const nav = homePage.footer.getByRole('navigation', { name: label, exact: true });
      await expect(nav).toHaveCount(1);
      const linkCount = await nav.getByRole('link').count();
      expect(linkCount).toBeGreaterThan(0);
      expect(linkCount).toBe(expectedLinkCount);
    }
  });

  test('every unique internal footer link resolves with a status under 400', async ({ page, request }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const hrefs = await homePage.footer.getByRole('link').evaluateAll((links) =>
      links.map((el) => el.getAttribute('href')).filter((href): href is string => !!href)
    );

    const internalHrefs = [...new Set(hrefs.filter((href) => href.startsWith('/')))];

    console.log(`Internal footer hrefs (count=${internalHrefs.length}):`, internalHrefs);
    await test.info().attach('internal-footer-hrefs', {
      body: JSON.stringify(internalHrefs, null, 2),
      contentType: 'application/json',
    });

    // Sequential, not parallel — and maxRedirects: 0 so a redirecting internal path
    // (e.g. /go/whatsapp) is never actually followed out to a third-party domain.
    for (const href of internalHrefs) {
      const response = await request.get(href, { maxRedirects: 0 });
      expect(response.status(), `${href} returned ${response.status()}`).toBeLessThan(400);
    }
  });

  test('social icons have a non-empty accessible name and the expected domain', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    for (const [platform, domain] of Object.entries(SOCIAL_DOMAINS)) {
      const icon = homePage.footer.getByRole('link', { name: `Techdome on ${platform}`, exact: true });
      await expect(icon).toHaveCount(1);

      const accessibleName = await icon.evaluate((el) => el.getAttribute('aria-label') || el.textContent?.trim());
      const href = await icon.getAttribute('href');

      console.log(`${platform}: name=${JSON.stringify(accessibleName)} href=${JSON.stringify(href)}`);

      expect(accessibleName).toBeTruthy();
      expect(href).toBeTruthy();
      expect(new URL(href!).hostname.replace(/^www\./, '')).toBe(domain);
    }
  });
});
