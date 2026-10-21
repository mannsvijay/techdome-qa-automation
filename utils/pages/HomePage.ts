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
  readonly newsletterCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByRole('banner');
    this.footer = page.getByRole('contentinfo');

    this.logoLink = this.header.getByRole('link', { name: 'Techdome Venture Studio — home' });
    this.heroHeading = page.getByRole('heading', { level: 1 });
    this.newsletterCloseButton = page.getByRole('button', { name: 'Close newsletter pop-up' });
  }

  async goto(): Promise<void> {
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

  /**
   * The newsletter pop-up (role="dialog") appears a few seconds after load and its
   * full-viewport backdrop intercepts pointer events on the header until dismissed.
   * Call this before interacting with header controls. No-ops if the popup never appears.
   */
  async dismissNewsletterPopupIfPresent(timeout = 8000): Promise<void> {
    try {
      await this.newsletterCloseButton.waitFor({ state: 'visible', timeout });
      await this.newsletterCloseButton.click();
    } catch {
      // Popup didn't appear within the timeout — nothing to dismiss.
    }
  }
}
