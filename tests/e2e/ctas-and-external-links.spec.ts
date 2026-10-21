import { test, expect } from '../../utils/fixtures';
import { HomePage } from '../../utils/pages/HomePage';

/**
 * US-005 / US-006 / US-016: CTAs and external links. Reads hrefs only — never
 * navigates to a third-party site.
 *
 * Observed live before writing any assertion (1280x720, the default desktop viewport):
 * - Header "Contact Us" link: href="/contact".
 * - 15 external links on the homepage, every single one either `target="_blank"` with
 *   `rel="noopener noreferrer"` (the real external sites: Upwork, Product Hunt, n8n.io,
 *   Clutch, LinkedIn, X, Instagram, GitHub, Facebook), or a `mailto:`/`tel:` link with
 *   no target/rel (expected — those aren't window.open-style navigations).
 * - "Book call" (exact role=link match) does NOT exist at 1280x720 — a `<a>` with that
 *   exact text does exist in the DOM there (found via a loose text search) but is not
 *   visible/accessible-tree-exposed at that width. It IS visible as a real accessible
 *   link (href="/contact") at the 375x812 mobile viewport. Checked 768/1024/1280/1440 —
 *   all show "Contact Us" instead, not "Book call".
 */

test.describe('US-005 / US-006: Homepage CTAs and external links', () => {
  test('header "Contact Us" link points to /contact', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const contactUs = homePage.header.getByRole('link', { name: 'Contact Us', exact: true });
    await expect(contactUs).toHaveAttribute('href', '/contact');
  });

  test('every external link has the expected target/rel', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const links = await page.getByRole('link').evaluateAll((els) =>
      els.map((el) => ({
        name: el.getAttribute('aria-label') || el.textContent?.trim() || '',
        href: el.getAttribute('href'),
        target: el.getAttribute('target'),
        rel: el.getAttribute('rel'),
      }))
    );

    const externalLinks = links.filter((l) => {
      if (!l.href) return false;
      try {
        const u = new URL(l.href, 'https://techdome.io');
        return u.hostname !== 'techdome.io' && u.hostname !== 'www.techdome.io';
      } catch {
        return false;
      }
    });

    console.log(`External links found (count=${externalLinks.length}):`);
    for (const l of externalLinks) {
      console.log(`  name=${JSON.stringify(l.name)} href=${l.href} target=${JSON.stringify(l.target)} rel=${JSON.stringify(l.rel)}`);
    }
    await test.info().attach('external-links', {
      body: JSON.stringify(externalLinks, null, 2),
      contentType: 'application/json',
    });

    expect(externalLinks.length).toBeGreaterThan(0);

    for (const l of externalLinks) {
      if (l.target === '_blank') {
        expect(l.rel, `${l.href} has target="_blank" but rel="${l.rel}"`).toContain('noopener');
      }
    }
  });
});

test.describe('US-016: Where does "Book call" exist?', () => {
  test('"Book call" is not an accessible link/button at the default desktop viewport', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const asLink = homePage.header.getByRole('link', { name: 'Book call', exact: true });
    const asButton = homePage.header.getByRole('button', { name: 'Book call', exact: true });
    expect(await asLink.count()).toBe(0);
    expect(await asButton.count()).toBe(0);
  });

  test.describe('at the 375x812 mobile viewport', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('"Book call" exists in the header as a visible link to /contact', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      const bookCall = homePage.header.getByRole('link', { name: 'Book call', exact: true });
      await expect(bookCall).toBeVisible();
      await expect(bookCall).toHaveAttribute('href', '/contact');
    });
  });
});
