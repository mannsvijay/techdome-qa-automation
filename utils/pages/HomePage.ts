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
  }

  async goto(): Promise<void> {
    // The newsletter pop-up appears a few seconds after load with a full-viewport
    // backdrop that intercepts pointer events on the header until dismissed. Registering
    // a locator handler means Playwright closes it automatically whenever it becomes
    // visible, right before any action/assertion that would otherwise wait on it.
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
}
