import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry once locally to absorb a flaky network hiccup against the live site; twice on CI. */
  retries: process.env.CI ? 2 : 1,
  /* Limit workers — hard rule: never more than 5 concurrent users/workers (see CLAUDE.md). */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'https://techdome.io',

    /* Collect trace when a test fails. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',

    /* Capture screenshot when a test fails. */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      testIgnore: ['tests/load/**'],
      use: { ...devices['Desktop Chrome'] },
    },

    /* Load tests (US-014): isolated in their own project so they only ever run after
     * every other project has finished — never alongside them — per the hard rule of
     * never exceeding 5 concurrent users. `dependencies: ['chromium']` enforces that
     * ordering; by default, if the chromium project has any failing test, Playwright
     * skips this project entirely rather than running load tests against a build that
     * already failed functional checks. */
    {
      name: 'load',
      testDir: './tests/load',
      retries: 0,
      dependencies: ['chromium'],
      use: { ...devices['Desktop Chrome'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
