import { test, expect } from '../../utils/fixtures';
import { ContactPage } from '../../utils/pages/ContactPage';

/**
 * US-003 / US-004: Contact form validation and the step 1 -> step 2 transition.
 *
 * Facts this file relies on (all confirmed in docs/evidence/contact-inspection.txt
 * and contact-find-a-time.txt, not re-derived here):
 * - Empty First name/Work email get aria-invalid="true" and a visible "Required."
 *   message that is NOT linked via aria-describedby.
 * - Work email is a native type="email" input, so an invalid value fails native
 *   constraint validation without any custom JS.
 * - "What do you need?" is a native <select> that only appears once step 2 renders,
 *   with exactly 6 options in a fixed order.
 * - No request to techdome.io itself (GET or otherwise) was ever recorded while
 *   moving from step 1 to step 2 — it's a client-side-only transition.
 *
 * "Find a time" is never clicked here — that stays out of scope for this file.
 */

test.describe('US-003 / US-004: Contact form validation and step transition', () => {
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page);
    await contactPage.goto();
  });

  test('empty required fields show "Required." and block advancing to step 2', async ({ page }) => {
    await contactPage.nextButton.click();

    // Deliberate exception to the no-text-selector rule in CLAUDE.md: the "Required."
    // message has no aria-describedby link to First name/Work email (confirmed in
    // docs/evidence/contact-inspection.txt), so there is no role/label-based way to
    // assert it — a text locator is the only option here.
    const requiredText = page.getByText('Required.', { exact: true });
    await expect(requiredText).toHaveCount(2);

    await expect(contactPage.firstNameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(contactPage.workEmailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(contactPage.whatDoYouNeedSelect).toBeHidden();
  });

  test('an invalid email fails native validation and keeps the form on step 1', async ({ page }) => {
    await contactPage.workEmailInput.fill('not-an-email');
    await page.keyboard.press('Tab');

    const isValid = await contactPage.workEmailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);

    await expect(contactPage.whatDoYouNeedSelect).toBeHidden();
  });

  test('valid required fields advance to step 2 with the expected engagement options', async ({ page }) => {
    const nonGetToTechdome: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET' && request.url().includes('techdome.io')) {
        nonGetToTechdome.push(`${request.method()} ${request.url()}`);
      }
    });

    await contactPage.firstNameInput.fill('QA Test');
    await contactPage.workEmailInput.fill('qa-test@example.com');
    await contactPage.nextButton.click();

    await expect(contactPage.whatDoYouNeedSelect).toBeVisible();

    const optionTexts = await contactPage.whatDoYouNeedSelect.locator('option').allTextContents();
    expect(optionTexts.map((t) => t.trim())).toEqual([
      'Engineering Pods / Staff Augmentation',
      'Automation / n8n',
      'AI / GenAI',
      'Product Development',
      'Venture Studio',
      'Something else',
    ]);

    expect(nonGetToTechdome).toEqual([]);
  });
});
