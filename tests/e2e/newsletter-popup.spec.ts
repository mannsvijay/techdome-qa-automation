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

    await page.goto('/');

    const servicesButton = page.getByRole('banner').getByRole('button', { name: 'Services', exact: true });
    const dialog = page.getByRole('dialog', { name: DIALOG_NAME });

    await servicesButton.click();
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
