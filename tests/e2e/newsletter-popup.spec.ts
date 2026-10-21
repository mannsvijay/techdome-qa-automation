import { test, expect } from '@playwright/test';

/**
 * US-018: Newsletter pop-up vs. header dropdown interaction.
 *
 * Deliberately imports the plain @playwright/test (not utils/fixtures.ts) — every
 * other spec file suppresses the pop-up via that fixture, but this file exists
 * specifically to exercise the pop-up itself.
 */

const DIALOG_NAME = 'One engineering note, every other Monday.';

test.describe('US-018: Newsletter pop-up vs header dropdown', () => {
  test('Services dropdown stays open once the newsletter pop-up appears (BUG-001)', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'bug', description: 'BUG-001' });
    test.fail();

    const servicesButton = page.getByRole('banner').getByRole('button', { name: 'Services', exact: true });
    const dialog = page.getByRole('dialog', { name: DIALOG_NAME });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await servicesButton.waitFor({ state: 'visible' });

    // page.clock does not control this pop-up (confirmed by investigation: waiting with
    // the clock installed but not advanced still let it appear), so there's no way to hold
    // it off deterministically. If it's already up before we can click, the click itself
    // would just hang on its backdrop for the rest of the test instead of exercising the
    // race this test documents — skip that run rather than timing out.
    if (await dialog.isVisible()) {
      test.skip(true, 'Precondition not met: pop-up appeared before the menu could be opened');
    }

    // A race window still remains between the check above and the click below — the
    // pop-up can appear in that gap too, which is itself part of what BUG-001 covers.
    await servicesButton.click({ timeout: 3000 });
    await expect(servicesButton).toHaveAttribute('aria-expanded', 'true');

    await dialog.waitFor({ state: 'visible' });

    await expect(servicesButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('closing the newsletter pop-up persists suppression across a reload', async ({ page }) => {
    await page.goto('/');

    const dialog = page.getByRole('dialog', { name: DIALOG_NAME });
    const closeButton = dialog.getByRole('button', { name: 'Close newsletter pop-up' });

    await dialog.waitFor({ state: 'visible' });
    await closeButton.click();

    const storedValue = await page.evaluate(() => window.localStorage.getItem('td_nl_popup_until'));
    expect(storedValue).not.toBeNull();

    await page.reload();
    await page.waitForTimeout(6000);
    await expect(dialog).not.toBeVisible();
  });
});
