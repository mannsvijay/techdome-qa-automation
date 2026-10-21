import { test, expect } from '../../utils/fixtures';

/**
 * Plain HTTP status checks via the `request` fixture (no browser). Never calls
 * /api/leads — that's the real lead-submission endpoint and must only ever be
 * exercised through a mocked route (see contact-submission.spec.ts), not a real request.
 */
test.describe('HTTP status checks', () => {
  test('GET / returns 200', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
  });

  test('GET /contact returns 200', async ({ request }) => {
    const response = await request.get('/contact');
    expect(response.status()).toBe(200);
  });

  test('GET a non-existent page returns 404', async ({ request }) => {
    const response = await request.get('/qa-test-page-that-does-not-exist');
    expect(response.status()).toBe(404);
  });
});
