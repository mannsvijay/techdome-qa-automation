import { Page, Locator } from '@playwright/test';

/**
 * Page object for the techdome.io homepage.
 *
 * Header and footer locators are scoped to the `banner` / `contentinfo` landmarks
 * so that links/buttons with the same accessible name in both regions (or in page
 * content) don't trigger Playwright strict-mode violations.
 */
export class HomePage {
  readonly page: Page;
  readonly header: Locator;
  readonly footer: Locator;

  readonly logoLink: Locator;
  readonly heroHeading: Locator;
  readonly newsletterDialog: Locator;
  readonly newsletterCloseButton: Locator;

  // Mobile/tablet only (<lg breakpoint): observed at 375x812 and 768x1024 — the header
  // CTAs/menu buttons are hidden and replaced by this single toggle button, which opens
  // a full-screen role="dialog" (id="mobile-nav", aria-label="Site Navigation")
  // containing its own Services/Portfolio/Insights/Company buttons.
  readonly mobileNavToggle: Locator;
  readonly mobileNavDialog: Locator;
  readonly mobileNavCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByRole('banner');
    this.footer = page.getByRole('contentinfo');

    this.logoLink = this.header.getByRole('link', { name: 'Techdome Venture Studio — home' });
    this.heroHeading = page.getByRole('heading', { level: 1 });

    // Accessible name verified against the live accessibility tree: the dialog is
    // labelled by its heading ("One engineering note, every other Monday."), not by
    // the visual "Techdome newsletter" eyebrow text, which plays no part in its ARIA name.
    this.newsletterDialog = page.getByRole('dialog', { name: 'One engineering note, every other Monday.' });
    this.newsletterCloseButton = this.newsletterDialog.getByRole('button', { name: 'Close newsletter pop-up' });

    // Same element throughout — its accessible name flips between "Open navigation" and
    // "Close navigation" depending on aria-expanded, so one regex-based locator covers both.
    this.mobileNavToggle = this.header.getByRole('button', { name: /^(Open|Close) navigation$/ });
    this.mobileNavDialog = page.getByRole('dialog', { name: 'Site Navigation' });

    // Distinct DOM element from mobileNavToggle (confirmed: setting a marker attribute
    // on one is not visible on the other), despite sharing the same accessible name —
    // this is the dialog's own "X" close button, separate from the header's hamburger
    // toggle that opened it.
    this.mobileNavCloseButton = this.mobileNavDialog.getByRole('button', { name: 'Close navigation', exact: true });
  }

  async goto(): Promise<void> {
    // Two layers of defense against the newsletter pop-up, kept together deliberately:
    //
    // 1. Primary: utils/fixtures.ts seeds localStorage("td_nl_popup_until") via an init
    //    script before navigation, using the same key the site itself writes when a
    //    visitor closes the pop-up (confirmed in docs/evidence/bug-001-investigation.txt).
    //    For any test using that fixture's `test`, the pop-up never appears at all.
    // 2. Fallback: this locator handler stays registered regardless of which `test` import
    //    a caller uses, so if the pop-up does appear anyway — e.g. in
    //    tests/e2e/newsletter-popup.spec.ts, which deliberately uses the plain
    //    @playwright/test to exercise the pop-up itself — it still gets closed
    //    automatically instead of blocking every subsequent action.
    await this.page.addLocatorHandler(this.newsletterDialog, async () => {
      await this.newsletterCloseButton.click();
    });

    await this.page.goto('/');
  }

  /** A header dropdown toggle button, e.g. "Services", "Portfolio", "Insights", "Company". */
  headerMenuButton(name: string): Locator {
    return this.header.getByRole('button', { name, exact: true });
  }

  /** A link inside the footer landmark, scoped so it can't collide with a same-named header link. */
  footerLink(name: string): Locator {
    return this.footer.getByRole('link', { name, exact: true });
  }

  /** A dropdown toggle button inside the mobile nav dialog, e.g. "Services", "Company". */
  mobileNavMenuButton(name: string): Locator {
    return this.mobileNavDialog.getByRole('button', { name, exact: true });
  }
}
