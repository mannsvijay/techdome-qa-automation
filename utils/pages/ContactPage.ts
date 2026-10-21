import { Page, Locator } from '@playwright/test';

/**
 * Page object for the techdome.io /contact page (the "Talk to an architect" scheduling form).
 *
 * "What do you need?" is confirmed (docs/evidence/contact-inspection.txt and
 * contact-find-a-time.txt) to be a native <select>, so its value must be set with
 * `selectOption`, not a click on an <option>.
 */
export class ContactPage {
  readonly page: Page;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly workEmailInput: Locator;
  readonly companyInput: Locator;
  readonly nextButton: Locator;
  readonly whatDoYouNeedSelect: Locator;
  readonly backButton: Locator;
  readonly findATimeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.firstNameInput = page.getByLabel('First name', { exact: false });
    this.lastNameInput = page.getByLabel('Last name', { exact: false });
    this.workEmailInput = page.getByLabel('Work email', { exact: false });
    this.companyInput = page.getByLabel('Company', { exact: false });
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
    this.whatDoYouNeedSelect = page.getByRole('combobox', { name: 'What do you need?', exact: false });
    this.backButton = page.getByRole('button', { name: 'Back', exact: true });
    this.findATimeButton = page.getByRole('button', { name: 'Find a time', exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('/contact');
  }
}
