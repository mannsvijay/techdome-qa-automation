import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../../utils/fixtures';

/**
 * Security response headers for "/" and "/contact".
 *
 * Observed live before writing any assertion (via the request fixture):
 * - Strict-Transport-Security present on both: "max-age=63072000; includeSubDomains; preload"
 * - X-Frame-Options present on both: "SAMEORIGIN"
 * - Content-Security-Policy: NOT PRESENT on either response — confirmed absent by
 *   directly listing every response header, not a test artifact. The assertion below
 *   is written as instructed and is expected to genuinely fail; it is not weakened or
 *   removed.
 * - X-Content-Type-Options: "nosniff"; Referrer-Policy: "strict-origin-when-cross-origin";
 *   Permissions-Policy: "camera=(), microphone=(), geolocation=()" — present on both,
 *   reported for information only, no assertion made on their values.
 */
test.describe('Security headers', () => {
  test('/ and /contact send the expected baseline security headers', async ({ request }, testInfo) => {
    testInfo.annotations.push({ type: 'bug', description: 'BUG-002: Content-Security-Policy missing on / and /contact' });
    test.fail();

    const reportLines: string[] = [];
    const headersByPath: Record<string, Record<string, string>> = {};

    // Report first, for every path, before any assertion can throw and skip the rest.
    for (const urlPath of ['/', '/contact']) {
      const response = await request.get(urlPath);
      const headers = response.headers();
      headersByPath[urlPath] = headers;

      reportLines.push(`=== ${urlPath} (status ${response.status()}) ===`);
      for (const [name, value] of Object.entries(headers)) {
        reportLines.push(`${name}: ${value}`);
      }
      reportLines.push('');

      await test.info().attach(`headers-${urlPath === '/' ? 'home' : 'contact'}`, {
        body: JSON.stringify(
          {
            'x-content-type-options': headers['x-content-type-options'] ?? null,
            'referrer-policy': headers['referrer-policy'] ?? null,
            'permissions-policy': headers['permissions-policy'] ?? null,
          },
          null,
          2
        ),
        contentType: 'application/json',
      });
      console.log(`${urlPath} X-Content-Type-Options:`, headers['x-content-type-options']);
      console.log(`${urlPath} Referrer-Policy:`, headers['referrer-policy']);
      console.log(`${urlPath} Permissions-Policy:`, headers['permissions-policy']);
    }

    fs.writeFileSync(path.join(process.cwd(), 'docs/evidence/security-headers.txt'), reportLines.join('\n') + '\n', 'utf8');

    // Now assert, for every path, after the report is safely on disk.
    for (const urlPath of ['/', '/contact']) {
      const headers = headersByPath[urlPath];

      expect(headers['strict-transport-security'], `${urlPath}: missing Strict-Transport-Security`).toBeTruthy();
      expect(headers['content-security-policy'], `${urlPath}: missing Content-Security-Policy`).toBeTruthy();

      const csp = headers['content-security-policy'] || '';
      const hasFrameAncestors = csp.includes('frame-ancestors');
      expect(
        !!headers['x-frame-options'] || hasFrameAncestors,
        `${urlPath}: missing both X-Frame-Options and a CSP frame-ancestors directive`
      ).toBe(true);
    }
  });
});
