# Techdome QA Take-Home

Automated QA suite for [techdome.io](https://techdome.io), built with **Playwright + TypeScript**. Every test runs against the live production site, on **Chromium only** (desktop Chrome; mobile/tablet coverage uses `test.use({ viewport })` overrides on the same engine, not separate browser projects).

## Quick start

```bash
npm install            # postinstall runs `playwright install chromium`
npx playwright test    # runs every project (chromium, then load)
npx playwright show-report
```

## Test structure

| Folder | Spec files | Tests | Files |
|---|---|---|---|
| `tests/e2e` | `contact-form`, `ctas-and-external-links`, `footer-navigation`, `homepage`, `mobile-responsiveness`, `newsletter-popup`, `performance` | 31 | 7 |
| `tests/integration` | `contact-submission`, `http-status`, `third-party-scripts` | 6 | 3 |
| `tests/security` | `headers`, `injection`, `sensitive-data` | 4 | 3 |
| `tests/load` | `load` | 1 | 1 |

`tests/example.spec.ts` (2 tests) is the default Playwright scaffold file left over from `npm init playwright@latest` — unrelated to this assignment, not listed above.

## Key design decisions

- **Selectors:** role/label locators throughout, via `utils/pages/HomePage.ts` and `utils/pages/ContactPage.ts`. Two deliberate exceptions to the no-text-selector rule exist, both in `tests/e2e/contact-form.spec.ts` and both commented inline: the "Required." validation message (no `aria-describedby` link to its field) and the failed-submission error banner (no ARIA role, no `aria-live`, and no landmark/`<form>` ancestor to scope to).
- **Newsletter pop-up suppression:** `utils/fixtures.ts` seeds the `td_nl_popup_until` localStorage key (the same key the site itself writes when a visitor closes the pop-up) via an init script scoped to the `techdome.io` origin, before any test's first navigation. `utils/pages/HomePage.ts` additionally keeps a `page.addLocatorHandler()` fallback on the pop-up regardless of which `test` import a spec uses — needed by `tests/e2e/newsletter-popup.spec.ts`, which deliberately imports the plain `@playwright/test` to exercise the pop-up itself.
- **Analytics blocked:** `utils/fixtures.ts` unconditionally aborts every request matching `**/g/collect**` (GA4 beacons), so no test run reports fake traffic or events into Techdome's real GA property.
- **No real leads, ever:** `utils/fixtures.ts` unconditionally aborts every request to `**/api/leads**` (the real lead-submission endpoint) by default. A test that needs the endpoint registers its own `page.route('**/api/leads', ...)` afterward, which takes precedence (Playwright runs the most-recently-registered matching route first) — so a real enquiry is never sent even if a test forgets to mock it.
- **Concurrency:** `workers: process.env.CI ? 1 : 2` in `playwright.config.ts` — always well under CLAUDE.md's hard limit of 5. `retries: process.env.CI ? 2 : 1`.
- **Load test isolation:** `tests/load/**` is excluded from the `chromium` project (`testIgnore`) and lives in its own `load` project (`testDir: './tests/load'`, `retries: 0`, `dependencies: ['chromium']`). Playwright project dependencies guarantee it only starts after every `chromium` test has finished — never alongside them — and if any `chromium` test fails, the `load` project is skipped entirely rather than run. To execute just the load test on its own: `npx playwright test --project=load --no-deps`.

## Known failing tests, by design

| Test | File | Annotation |
|---|---|---|
| "Services dropdown stays open once the newsletter pop-up appears" | `tests/e2e/newsletter-popup.spec.ts` | `test.fail()`, `{ type: 'bug', description: 'BUG-001' }` |
| "/ and /contact send the expected baseline security headers" | `tests/security/headers.spec.ts` | `test.fail()`, `{ type: 'bug', description: 'BUG-002: Content-Security-Policy missing on / and /contact' }` |

Both are expected to fail and are counted as **passing** in the suite summary when they do (that's what `test.fail()` means) — a pass for either would be a regression, not an improvement.

## Known flaky history and limitations

- **Once-flaky "Services" dropdown test:** a single run (out of many repeats) failed with the click landing only ~196ms after navigation ended, no other recorded activity in the trace at that point. Not reliably reproducible on demand, so it's documented in `docs/bugs.md`'s "Investigated and ruled out" section rather than tracked as its own bug.
- **Small load sample:** the load test sends 30 total requests (5 users × 2 pages × 3 rounds). The p50/p95 figures it reports should be read as indicative, not statistically rigorous, at that sample size.
- **Server-side injection sanitisation is not tested:** `tests/security/injection.spec.ts` only confirms the client sends payloads raw and that nothing executes client-side. Verifying what the real backend does with them would require sending an actual lead, which CLAUDE.md forbids.
- **Some tests rewrite files under `docs/` on every run:** `tests/load/load.spec.ts` overwrites `docs/load-test-results.md`; `tests/security/headers.spec.ts` and `tests/security/sensitive-data.spec.ts` overwrite `docs/evidence/security-headers.txt` and `docs/evidence/security-sensitive-scan.txt` each time they execute.
- **No TypeScript type-checking runs anywhere:** there is no `tsconfig.json` in this repo. `npx tsc --noEmit` does not perform a real compile here — without a local `typescript` dependency it resolves to an unrelated npm package named `tsc`, and even forced via the real compiler it has no project to check, so it only prints usage help.
- **CI is manual-trigger only:** `.github/workflows/playwright.yml` runs on `workflow_dispatch` only — it does not run automatically on push or pull request. When triggered, it installs Chromium only (`npx playwright install --with-deps chromium`) and runs `npx playwright test` with no `--project` filter, which includes the `load` project every time.

## Results summary

Last full run (`npx playwright test`, all projects, default config): **44 tests — 44 passed, 0 failed, 0 flaky, 0 skipped** (2.0m), including the two `test.fail()` tests above behaving as expected.

Load test: **p95 893ms** overall (pass threshold: < 3000ms), **zero 5xx** (30/30 requests returned 200).

- Bug tracker: [`docs/bugs.md`](docs/bugs.md) (8 documented bugs, BUG-001–BUG-008)
- Load test report: [`docs/load-test-results.md`](docs/load-test-results.md)
- User story map: [`docs/user-story-map.md`](docs/user-story-map.md) (18 stories, US-001–US-018)
- Claude Code usage log: [`docs/claude-code-log.md`](docs/claude-code-log.md)
