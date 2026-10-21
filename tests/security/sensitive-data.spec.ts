import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../../utils/fixtures';

/**
 * Scans "/" and "/contact" (HTML plus first-party JSON/JS response bodies) for
 * hardcoded secrets and for email addresses that aren't actually shown to visitors.
 *
 * Observed live before writing any assertion:
 * - 0 matches for every secret pattern (AWS/Google/Stripe/GitHub keys, JWTs, private
 *   key headers, "Bearer " tokens) across 54 captured first-party response bodies.
 * - Exactly one real email, "rahul.joshi@techdome.net.in", appears repeatedly (HTML
 *   and several JS chunks) — confirmed visible on both pages (a mailto link, visible
 *   on screen) via `document.body.innerText`, which only reflects actually-rendered
 *   text.
 * - Two strings also match the email pattern but are only ever used as input
 *   placeholder values, not real data: "you@company.com" (the newsletter pop-up's
 *   email input) and "name@company.com" (the booking dialog's guest-email input).
 *   These are skipped from the visibility assertion by a context rule, not a hardcoded
 *   per-address allowlist — see PLACEHOLDER_CONTEXT below.
 */

// Context rule (not a per-address allowlist): an email is only skipped from the
// visibility assertion if EVERY occurrence of it anywhere in the captured source is
// immediately preceded by `placeholder:"` or `placeholder="` — i.e. it is only ever
// used as a placeholder attribute value, never as real output. If the same email also
// shows up anywhere else (a prop value, a mailto href, plain text, etc.), at least one
// of its occurrences won't match this prefix, so it still has to pass the normal
// visible-on-page check like any other email.
const PLACEHOLDER_PREFIXES = ['placeholder:"', 'placeholder="'];

const SECRET_PATTERNS: Record<string, RegExp> = {
  awsKey: /AKIA[0-9A-Z]{16}/g,
  googleApiKey: /AIza[0-9A-Za-z_-]{35}/g,
  stripeKey: /(sk|pk)_live_[0-9a-zA-Z]+/g,
  githubToken: /ghp_[0-9A-Za-z]{36}/g,
  jwt: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  privateKey: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  bearer: /Bearer [A-Za-z0-9._-]+/g,
};

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// GA (G-...) and GTM (GTM-...) IDs are public identifiers, not secrets — excluded.
function isPublicAnalyticsId(_match: string): boolean {
  return false; // the patterns above never match G-/GTM- ids in the first place; kept for clarity.
}

test.describe('Sensitive data scan', () => {
  test('no hardcoded secrets, and every found email is actually visible on the page', async ({ page }) => {
    const bodies: { url: string; text: string }[] = [];

    page.on('response', async (response) => {
      try {
        const url = response.url();
        const u = new URL(url);
        if (u.hostname !== 'techdome.io' && u.hostname !== 'www.techdome.io') return;
        const contentType = response.headers()['content-type'] || '';
        if (!/html|json|javascript/i.test(contentType)) return;
        const text = await response.text();
        bodies.push({ url, text });
      } catch {
        // unreadable body (e.g. opaque redirect) — skip
      }
    });

    const visibleTextByPage: Record<string, string> = {};
    for (const urlPath of ['/', '/contact']) {
      await page.goto(urlPath);
      await page.waitForTimeout(1000);
      visibleTextByPage[urlPath] = await page.evaluate(() => document.body.innerText);
    }

    const reportLines: string[] = [];
    reportLines.push(`Captured first-party response bodies: ${bodies.length}`);
    reportLines.push('');

    const secretFindings: { pattern: string; url: string; match: string }[] = [];
    for (const { url, text } of bodies) {
      for (const [patternName, re] of Object.entries(SECRET_PATTERNS)) {
        const matches = text.match(re) || [];
        for (const m of matches) {
          if (isPublicAnalyticsId(m)) continue;
          secretFindings.push({ pattern: patternName, url, match: m });
        }
      }
    }

    reportLines.push(`=== Secret pattern matches (count=${secretFindings.length}) ===`);
    for (const f of secretFindings) reportLines.push(`${f.pattern} | ${f.url} | ${f.match}`);
    reportLines.push('');

    // email -> every occurrence found, each tagged with whether it was a placeholder use
    const emailOccurrences = new Map<string, { url: string; isPlaceholder: boolean }[]>();
    for (const { url, text } of bodies) {
      for (const match of text.matchAll(EMAIL_PATTERN)) {
        const email = match[0];
        const idx = match.index ?? -1;
        const isPlaceholder = PLACEHOLDER_PREFIXES.some((prefix) => text.slice(Math.max(0, idx - prefix.length), idx) === prefix);
        if (!emailOccurrences.has(email)) emailOccurrences.set(email, []);
        emailOccurrences.get(email)!.push({ url, isPlaceholder });
      }
    }

    reportLines.push(`=== Email addresses found (unique count=${emailOccurrences.size}) ===`);
    const emailVisibility: { email: string; visibleOn: string[]; skipAssertion: boolean }[] = [];
    for (const [email, occurrences] of emailOccurrences) {
      const sources = [...new Set(occurrences.map((o) => o.url))];
      const skipAssertion = occurrences.every((o) => o.isPlaceholder);
      const visibleOn = Object.entries(visibleTextByPage)
        .filter(([, visibleText]) => visibleText.includes(email))
        .map(([urlPath]) => urlPath);
      emailVisibility.push({ email, visibleOn, skipAssertion });
      const note = skipAssertion ? ' | PLACEHOLDER (not asserted)' : '';
      reportLines.push(
        `${email} | visible on: ${JSON.stringify(visibleOn)} | found in: ${JSON.stringify(sources)} | occurrences: ${occurrences.length} (placeholder: ${occurrences.filter((o) => o.isPlaceholder).length})${note}`
      );
    }

    fs.writeFileSync(path.join(process.cwd(), 'docs/evidence/security-sensitive-scan.txt'), reportLines.join('\n') + '\n', 'utf8');

    expect(secretFindings, 'secret pattern matches found — see docs/evidence/security-sensitive-scan.txt').toEqual([]);

    for (const { email, visibleOn, skipAssertion } of emailVisibility) {
      if (skipAssertion) continue;
      expect(visibleOn.length > 0, `${email} is not visible as text/mailto link on "/" or "/contact" — only found in source/network data`).toBe(true);
    }
  });
});
