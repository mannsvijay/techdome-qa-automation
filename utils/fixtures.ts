import { test as base, expect } from '@playwright/test';

/**
 * Extends the base test so the newsletter pop-up never appears in the first place,
 * for any test that isn't about the pop-up itself.
 *
 * docs/evidence/bug-001-investigation.txt confirmed that closing the pop-up writes
 * localStorage("td_nl_popup_until") to an epoch-ms timestamp, and that the pop-up
 * does not reappear (on reload or on /contact) while that key is set in the future.
 * This fixture seeds that same key via an init script before the site's own scripts
 * run, so the pop-up is suppressed from the very first navigation — scoped to the
 * techdome.io origin only, so it never touches any other origin a test might visit.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      if (/(^|\.)techdome\.io$/.test(window.location.hostname)) {
        const oneDayFromNow = Date.now() + 24 * 60 * 60 * 1000;
        window.localStorage.setItem('td_nl_popup_until', String(oneDayFromNow));
      }
    });

    // GA4 "collect" beacons fire on real page views and custom events (confirmed in
    // docs/evidence/contact-inspection.txt and contact-find-a-time.txt — every
    // /contact load and step transition sends one to google-analytics.com/google.com).
    // Aborting them here stops every test run from reporting fake traffic and fake
    // events into Techdome's real GA property.
    await page.route('**/g/collect**', (route) => route.abort());

    // Default safety net: unconditionally abort every request to the real lead-submission
    // endpoint, so no test can ever send a real enquiry even if it forgets to mock this
    // itself (confirmed endpoint: docs/evidence/contact-submit-inspection.txt). Playwright
    // runs the most-recently-registered matching route first, so a test that calls
    // page.route('**/api/leads', ...) of its own takes precedence over this one.
    await page.route('**/api/leads', (route) => route.abort());

    await use(page);
  },
});

export { expect };
