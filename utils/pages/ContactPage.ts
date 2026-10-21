import { Page, Locator } from '@playwright/test';

export interface FullLeadData {
  firstName: string;
  lastName?: string;
  workEmail: string;
  company?: string;
  /** Option label for the "What do you need?" select, e.g. "Engineering Pods / Staff Augmentation". */
  whatDoYouNeed: string;
  /** Text for "What are you looking to build or staff?". */
  requirement: string;
  /** Option label for "Team size needed". */
  teamSize: string;
  /** Option label for "Timeline". */
  timeline: string;
  /** Option label for "Budget range". */
  budget: string;
}

/**
 * Page object for the techdome.io /contact page (the "Talk to an architect" scheduling form).
 *
 * "What do you need?" is confirmed (docs/evidence/contact-inspection.txt and
 * contact-find-a-time.txt) to be a native <select>, so its value must be set with
 * `selectOption`, not a click on an <option>.
 *
 * Field locators use getByRole('textbox', { name: /^.../  }) with anchored regexes,
 * not getByLabel — getByLabel matches any element with that accessible name, which
 * on this page also includes non-form landmarks (e.g. the footer's
 * `<nav aria-label="Company">`), causing a strict-mode violation. Scoping to the
 * textbox role rules those out. The anchor (^) still guards against loosely matching
 * the unrelated "Enter your work email" input (confirmed in contact-inspection.txt).
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

    this.firstNameInput = page.getByRole('textbox', { name: /^First name/ });
    this.lastNameInput = page.getByRole('textbox', { name: /^Last name/ });
    this.workEmailInput = page.getByRole('textbox', { name: /^Work email/ });
    this.companyInput = page.getByRole('textbox', { name: /^Company/ });
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
    this.whatDoYouNeedSelect = page.getByRole('combobox', { name: /^What do you need\?/ });
    this.backButton = page.getByRole('button', { name: 'Back', exact: true });
    this.findATimeButton = page.getByRole('button', { name: 'Find a time', exact: true });

    this.whatToBuildOrStaffInput = page.getByRole('textbox', { name: /^What are you looking to build or staff\?/ });
    this.teamSizeNeededSelect = page.getByRole('combobox', { name: /^Team size needed/ });
    this.timelineSelect = page.getByRole('combobox', { name: /^Timeline/ });
    this.budgetRangeSelect = page.getByRole('combobox', { name: /^Budget range/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/contact');
  }

  /**
   * Fills step 1, advances to step 2, selects the engagement type, reveals the rest of
   * step 2's fields (confirmed in contact-find-a-time.txt: the first "Find a time" click
   * only expands the form — it does not submit), and fills those fields too.
   *
   * Deliberately does NOT click the final "Find a time" — that's the real submission
   * trigger (confirmed in contact-submit-inspection.txt: it POSTs to /api/leads), so
   * callers decide when/whether to click it themselves.
   */
  async fillFullLead(data: FullLeadData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    if (data.lastName) await this.lastNameInput.fill(data.lastName);
    await this.workEmailInput.fill(data.workEmail);
    if (data.company) await this.companyInput.fill(data.company);
    await this.nextButton.click();

    await this.whatDoYouNeedSelect.selectOption({ label: data.whatDoYouNeed });
    await this.findATimeButton.click();

    await this.whatToBuildOrStaffInput.fill(data.requirement);
    await this.teamSizeNeededSelect.selectOption({ label: data.teamSize });
    await this.timelineSelect.selectOption({ label: data.timeline });
    await this.budgetRangeSelect.selectOption({ label: data.budget });
  }
}
