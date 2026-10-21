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
    await use(page);
  },
});

export { expect };
