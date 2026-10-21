import { test, expect } from '../../utils/fixtures';
import { ContactPage } from '../../utils/pages/ContactPage';

/**
 * US-009: Contact form submission sends the expected request payload.
 *
 * Confirmed via a one-off manual check before writing this test: even a mocked
 * status 200 with an empty JSON body ("{}") still shows the exact same "We couldn't
 * submit your request right now. Please try again." banner as a 500 response — there
 * is no distinct "success" UI state for this response shape, so this test asserts
 * only the outgoing request itself, not anything about the UI afterward.
 */
test.describe('US-009: Contact form submission request', () => {
  test('submitting the full lead form sends the expected POST payload', async ({ page }) => {
    const contactPage = new ContactPage(page);

    const requestPromise = page.waitForRequest((req) => req.url().includes('/api/leads') && req.method() === 'POST');

    await page.route('**/api/leads', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

    await contactPage.goto();
    await contactPage.fillFullLead({
      firstName: 'QA Test',
      lastName: 'Automation',
      workEmail: 'qa-test@example.com',
      company: 'QA Co',
      whatDoYouNeed: 'Engineering Pods / Staff Augmentation',
      requirement: 'QA automation test - please ignore',
      teamSize: '1–2',
      timeline: 'Immediately',
      budget: 'Not decided',
    });

    await contactPage.findATimeButton.click();

    const request = await requestPromise;
    expect(request.method()).toBe('POST');
    expect(request.headers()['content-type']).toContain('application/json');

    const body = request.postDataJSON();
    expect(body.service).toBe('staff-aug');
    expect(body.contact).toEqual({
      firstName: 'QA Test',
      lastName: 'Automation',
      email: 'qa-test@example.com',
      company: 'QA Co',
    });
    expect(body.answers).toEqual({
      requirement: 'QA automation test - please ignore',
      teamSize: '1–2',
      timeline: 'Immediately',
      budget: 'Not decided',
    });
    expect(body.utm).toEqual({});
    expect(body.attribution).toEqual({});
    expect(body.landingPage).toBe('/contact');
    expect(body.website).toBe('');
  });

  test('a successful submission shows the "Thank you" confirmation', async ({ page }) => {
    const contactPage = new ContactPage(page);

    // Found by searching the loaded first-party JS (chunk 7254-...js) for its /api/leads
    // handling: `let t=await e.json();if(!e.ok||!t.success){...show error...return}` — so
    // success requires BOTH res.ok AND a truthy `success` field in the JSON body, which
    // is exactly why the earlier `status:200, body:'{}'` mock still showed the error.
    await page.route('**/api/leads', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, contactId: 'test-contact-id', bookingToken: 'test-booking-token' }),
      })
    );

    await contactPage.goto();
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

    // Inspected first (one-off check) before asserting: a success response replaces the
    // form with a "Thank you, <first name>!" confirmation and opens a booking dialog
    // (role="dialog") — this test only asserts the confirmation, not the dialog's contents.
    await expect(page.getByRole('heading', { name: 'Thank you, QA!' })).toBeVisible();
  });
});
