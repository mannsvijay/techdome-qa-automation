import { test, expect } from '../../utils/fixtures';
import { ContactPage } from '../../utils/pages/ContactPage';

/**
 * Injection: contact form "First name" field.
 *
 * Observed live before writing any assertion, for both payloads below:
 * - No page "dialog" event fires (no alert()).
 * - No <script> element containing "alert(1)" and no <img> with an onerror attribute
 *   exists anywhere in the DOM afterward.
 * - The outgoing /api/leads request body contains the RAW, unmodified payload as
 *   contact.firstName — the client does NOT sanitise before sending.
 * - The "Thank you, {name}!" confirmation heading renders the payload as literal
 *   (HTML-escaped) text. The site's own code computes the displayed name as
 *   `firstName.split(' ')[0]`, so a payload containing a space (the <img> one) only
 *   shows its first "word" in the heading, not the whole string — this test asserts
 *   that actually-observed fragment, not the full payload, for that case.
 *
 * Server-side sanitisation is explicitly out of scope: checking it would require a
 * real lead to actually reach the backend, which CLAUDE.md forbids. The /api/leads
 * mock below (and the fixture's own default abort) make sure that never happens.
 */

const PAYLOADS = ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>'];

test.describe('Injection: contact form First name field', () => {
  for (const payload of PAYLOADS) {
    test(`"${payload}" does not execute and is sent to the client request raw`, async ({ page }) => {
      let dialogFired = false;
      page.on('dialog', async (d) => {
        dialogFired = true;
        await d.dismiss();
      });

      await page.route('**/api/leads', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, contactId: 'test-contact-id', bookingToken: 'test-token' }),
        })
      );

      const requestPromise = page.waitForRequest((req) => req.url().includes('/api/leads') && req.method() === 'POST');

      const contactPage = new ContactPage(page);
      await contactPage.goto();
      await contactPage.fillFullLead({
        firstName: payload,
        workEmail: 'qa-test@example.com',
        whatDoYouNeed: 'Engineering Pods / Staff Augmentation',
        requirement: 'QA automation test - please ignore',
        teamSize: '1–2',
        timeline: 'Immediately',
        budget: 'Not decided',
      });
      await contactPage.findATimeButton.click();

      const request = await requestPromise;
      const sentFirstName = request.postDataJSON().contact.firstName;
      console.log(`Payload sent to /api/leads as contact.firstName: ${JSON.stringify(sentFirstName)}`);
      // Confirms the client sends the payload raw/unsanitised.
      expect(sentFirstName).toBe(payload);

      expect(dialogFired).toBe(false);

      const hasInjectedScript = await page.evaluate(() =>
        Array.from(document.scripts).some((s) => s.textContent?.includes('alert(1)'))
      );
      expect(hasInjectedScript).toBe(false);

      const hasInjectedImg = await page.evaluate(() => Array.from(document.images).some((img) => img.hasAttribute('onerror')));
      expect(hasInjectedImg).toBe(false);

      const heading = page.getByRole('heading', { name: /Thank you/ });
      await expect(heading).toBeVisible();
      const expectedVisibleFragment = payload.split(' ')[0];
      await expect(heading).toContainText(expectedVisibleFragment);
    });
  }
});
