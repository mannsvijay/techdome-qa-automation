import { Page, Locator } from '@playwright/test';

/**
 * Page object for the techdome.io /contact page (the "Talk to an architect" scheduling form).
 *
 * "What do you need?" is confirmed (docs/evidence/contact-inspection.txt and
 * contact-find-a-time.txt) to be a native <select>, so its value must be set with
 * `selectOption`, not a click on an <option>.
 *
 * Label locators use anchored regexes (e.g. /^Work email/) rather than exact:false
 * substring matching, because /contact also contains an unrelated "Enter your work
 * email" input (confirmed in contact-inspection.txt) whose label would otherwise
 * also satisfy a loose "Work email" substring match.
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

  // Fields revealed after "Find a time" (confirmed in contact-find-a-time.txt).
  readonly whatToBuildOrStaffInput: Locator;
  readonly teamSizeNeededSelect: Locator;
  readonly timelineSelect: Locator;
  readonly budgetRangeSelect: Locator;

  constructor(page: Page) {
    this.page = page;

    this.firstNameInput = page.getByLabel(/^First name/);
    this.lastNameInput = page.getByLabel(/^Last name/);
    this.workEmailInput = page.getByLabel(/^Work email/);
    this.companyInput = page.getByLabel(/^Company/);
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
    this.whatDoYouNeedSelect = page.getByRole('combobox', { name: /^What do you need\?/ });
    this.backButton = page.getByRole('button', { name: 'Back', exact: true });
    this.findATimeButton = page.getByRole('button', { name: 'Find a time', exact: true });

    this.whatToBuildOrStaffInput = page.getByLabel(/^What are you looking to build or staff\?/);
    this.teamSizeNeededSelect = page.getByRole('combobox', { name: /^Team size needed/ });
    this.timelineSelect = page.getByRole('combobox', { name: /^Timeline/ });
    this.budgetRangeSelect = page.getByRole('combobox', { name: /^Budget range/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/contact');
  }
}
