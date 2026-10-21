import { Page } from '@playwright/test';
import { test, expect } from '../../utils/fixtures';
import { HomePage } from '../../utils/pages/HomePage';
import { collectConsoleErrors, ConsoleErrorEntry } from '../../utils/helpers';

/**
 * US-001: Header navigation resolves without broken or blank pages.
 *
 * Exploration showed Services/Portfolio/Insights/Company are dropdown-toggle buttons
 * (aria-haspopup="true"), not links to separate pages — so this file asserts dropdown
 * open/close behaviour for them, not navigation. A timed newsletter pop-up intercepts
 * header clicks a few seconds after load; HomePage.goto() registers a locator handler
 * (page.addLocatorHandler) that closes it automatically whenever it appears.
 *
 * Console errors are collected and attached to the report for visibility only — this
 * file never fails a test because of a console error (including third-party ones).
 */

const HEADER_MENU_ITEMS = ['Services', 'Portfolio', 'Insights', 'Company'] as const;

// One link confirmed (via ariaSnapshot) to appear only inside that panel's own content,
// used to assert the panel itself is actually open/closed rather than just counting links.
const PANEL_UNIQUE_LINK: Record<(typeof HEADER_MENU_ITEMS)[number], string> = {
  Services: 'MVP development for startups',
  Portfolio: 'View Our products overview',
  Insights: 'Newsletter Engineering notes from the team, in your inbox.',
  Company: 'Careers Open roles and how we hire.',
};

const consoleErrorGetters = new WeakMap<Page, () => ConsoleErrorEntry[]>();

test.describe('US-001: Homepage header navigation and metadata', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    // Attach the console listener before navigating, so load-time errors are captured too.
    consoleErrorGetters.set(page, collectConsoleErrors(page));

    homePage = new HomePage(page);
    await homePage.goto();
  });

  test.afterEach(async ({ page }, testInfo) => {
    const getErrors = consoleErrorGetters.get(page);
    const errors = getErrors ? getErrors() : [];
    await testInfo.attach('console-errors', {
      body: JSON.stringify(errors, null, 2),
      contentType: 'application/json',
    });
  });

  test('homepage has the correct title and meta description', async ({ page }) => {
    await expect(page).toHaveTitle('Techdome: Custom Software Development & Venture Studio');

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      'content',
      'Techdome is a custom software development company and venture studio. MVPs, dedicated engineering pods and n8n and AI automation from 110+ engineers.'
    );
  });

  test('hero heading is visible with the expected copy', async () => {
    await expect(homePage.heroHeading).toBeVisible();
    await expect(homePage.heroHeading).toContainText('Your product team,');
    await expect(homePage.heroHeading).toContainText('fully assembled.');
  });

  test('logo link points back to the homepage', async () => {
    await expect(homePage.logoLink).toHaveAttribute('href', '/');
  });

  for (const name of HEADER_MENU_ITEMS) {
    test(`header menu "${name}" opens and closes a dropdown panel`, async () => {
      const button = homePage.headerMenuButton(name);
      const panelLink = homePage.header.getByRole('link', { name: PANEL_UNIQUE_LINK[name], exact: true });

      await expect(button).toHaveAttribute('aria-expanded', 'false');

      await button.click();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await expect(panelLink).toBeVisible();

      await button.click();
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      await expect(panelLink).toBeHidden();
    });
  }
});
