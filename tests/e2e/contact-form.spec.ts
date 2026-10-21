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
 *   with a "Select…" placeholder (selected by default) followed by 6 options in a
 *   fixed order.
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
      if (request.method() === 'GET') return;
      // Compare the hostname, not a substring of the full URL — GA beacon URLs carry
      // "techdome.io" inside an encoded `dl=` (document location) query parameter, which
      // a substring check would wrongly match even though the request itself goes to
      // google-analytics.com/google.com.
      const hostname = new URL(request.url()).hostname;
      if (hostname === 'techdome.io' || hostname === 'www.techdome.io') {
        nonGetToTechdome.push(`${request.method()} ${request.url()}`);
      }
    });

    await contactPage.firstNameInput.fill('QA Test');
    await contactPage.workEmailInput.fill('qa-test@example.com');
    await contactPage.nextButton.click();

    await expect(contactPage.whatDoYouNeedSelect).toBeVisible();

    // The select has a non-selectable "Select…" placeholder as its first option,
    // selected by default — confirmed directly against the live DOM, not dropped
    // from this assertion.
    const optionTexts = (await contactPage.whatDoYouNeedSelect.locator('option').allTextContents()).map((t) => t.trim());
    expect(optionTexts[0]).toBe('Select…');
    expect(optionTexts.slice(1)).toEqual([
      'Engineering Pods / Staff Augmentation',
      'Automation / n8n',
      'AI / GenAI',
      'Product Development',
      'Venture Studio',
      'Something else',
    ]);

    const selectedOptionText = await contactPage.whatDoYouNeedSelect.evaluate(
      (el: HTMLSelectElement) => el.options[el.selectedIndex]?.textContent?.trim()
    );
    expect(selectedOptionText).toBe('Select…');

    expect(nonGetToTechdome).toEqual([]);
  });

  test('a failed submission shows the error banner and stays on step 2', async ({ page }) => {
    await page.route('**/api/leads', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));

    await contactPage.fillFullLead({
      firstName: 'QA Test',
      workEmail: 'qa-test@example.com',
      whatDoYouNeed: 'Engineering Pods / Staff Augmentation',
      requirement: 'QA automation test - please ignore',
      teamSize: '1–2',
      timeline: 'Immediately',
      budget: 'Not decided',
    });

    await contactPage.findATimeButton.click();

    // Confirmed in docs/evidence/contact-banner-role.txt: the only role="alert"/"status"
    // element on this page is Next.js's own persistent, always-empty route announcer
    // (#__next-route-announcer__) — the banner itself has no ARIA role at all, and its
    // ancestor chain (<p> -> plain <div>s -> <section> -> <main> -> <body>) has no <form>
    // or other landmark to scope to either. A page-level text locator is the only option
    // here — the same deliberate exception as the "Required." check above.
    const banner = page.getByText("We couldn't submit your request right now. Please try again.", { exact: true });
    await expect(banner).toBeVisible();

    await expect(contactPage.whatDoYouNeedSelect).toBeVisible();
    await expect(contactPage.teamSizeNeededSelect).toBeVisible();
  });
});
