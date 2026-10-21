import { test, expect } from '../../utils/fixtures';
import { HomePage } from '../../utils/pages/HomePage';
import { ContactPage } from '../../utils/pages/ContactPage';
import { assertNoHorizontalOverflow } from '../../utils/helpers';

/**
 * US-007 / US-008: Mobile and tablet responsiveness.
 *
 * Observed live before writing any assertion (both 375x812 and 768x1024):
 * - No horizontal overflow on homepage or /contact at either width.
 * - Hero heading and /contact's First name field both visible at either width.
 * - Header: Services/Portfolio/Insights/Company are hidden; a single toggle button
 *   (role=button, accessible name "Open navigation", aria-controls="mobile-nav")
 *   takes their place at both widths.
 * - Clicking it opens a full-screen role="dialog" (aria-label "Site Navigation")
 *   containing its own Services/Portfolio/Insights/Company buttons — confirmed visible
 *   at both widths.
 * - Re-clicking the header's own toggle button (whose name flips to "Close navigation"
 *   once open) reproducibly times out at both widths: Playwright reports the button's
 *   own icon <path> as intercepting pointer events. Screenshot:
 *   docs/evidence/mobile-nav-close-button-blocked.png.
 * - The dialog itself has a SEPARATE "Close navigation" button (confirmed via a marker
 *   attribute: it is a distinct DOM node from the header's toggle, despite sharing the
 *   same accessible name). Clicking that one works cleanly at both widths and the
 *   dialog becomes hidden (confirmed after allowing its closing transition to finish).
 *   The test below clicks this dialog-scoped button, not the header toggle.
 */

const VIEWPORTS = [
  { label: '375x812 (mobile)', width: 375, height: 812 },
  { label: '768x1024 (tablet)', width: 768, height: 1024 },
];

for (const vp of VIEWPORTS) {
  test.describe(`US-007 / US-008: ${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('homepage has no horizontal overflow and the hero heading is visible', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await assertNoHorizontalOverflow(page);
      await expect(homePage.heroHeading).toBeVisible();
    });

    test('/contact has no horizontal overflow and the First name field is visible', async ({ page }) => {
      const contactPage = new ContactPage(page);
      await contactPage.goto();

      await assertNoHorizontalOverflow(page);
      await expect(contactPage.firstNameInput).toBeVisible();
    });

    test('header nav items are hidden behind a single menu toggle', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      for (const name of ['Services', 'Portfolio', 'Insights', 'Company']) {
        await expect(homePage.headerMenuButton(name)).toBeHidden();
      }

      await expect(homePage.mobileNavToggle).toBeVisible();
    });

    test('opening the menu toggle reveals the nav items', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.mobileNavToggle.click();

      await expect(homePage.mobileNavDialog).toBeVisible();
      for (const name of ['Services', 'Portfolio', 'Insights', 'Company']) {
        await expect(homePage.mobileNavMenuButton(name)).toBeVisible();
      }
    });

    test('closing the menu toggle hides the nav items', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.mobileNavToggle.click();
      await expect(homePage.mobileNavDialog).toBeVisible();

      // Deliberately the dialog's own close button, not the header toggle (see the
      // file header comment) — the header toggle's "Close navigation" state is the one
      // confirmed broken (blocked by its own icon).
      await homePage.mobileNavCloseButton.click();
      await expect(homePage.mobileNavDialog).toBeHidden();
    });
  });
}
