# Bug Report: techdome.io

**Tested:** 21–22 October 2026 · Chromium via Playwright 1.64.1 (1280x720, 768x1024, 375x812) · Windows
**Method:** Every bug below was reproduced with evidence saved in `docs/evidence/`. No real lead was ever sent to the backend: `/api/leads` was always blocked (aborted) or mocked with a fixed response.

---

## BUG-001

**Severity:** Medium

**Summary:** The newsletter pop-up opens automatically a few seconds after page load and collapses any header dropdown menu the visitor has already opened; its full-screen backdrop then blocks the header until the pop-up is dismissed.

**Steps:**
1. Open https://techdome.io in a fresh context (no `td_nl_popup_until` key in localStorage)
2. Within the first couple of seconds, click "Services" in the header
3. Wait, without further interaction, for the newsletter pop-up to appear

**Expected:** A menu the visitor has already opened stays open; the pop-up should not interrupt an active interaction.

**Actual:** The pop-up became visible at 2095ms and 2951ms after load in two separate runs. In two further runs, clicking "Services" did flip `aria-expanded` to `"true"` (after 47ms and 45ms), but by the moment the pop-up became visible, `aria-expanded` had already reverted to `"false"` — and it stayed `"false"` 500ms after the pop-up appeared and 500ms after it was closed. A separate check of localStorage showed closing the pop-up writes `td_nl_popup_until` roughly 14 days into the future, and the pop-up did not reappear within 6s of a reload or of navigating to `/contact` — so this affects first-time visits only, which is why this is Medium rather than High.

**Evidence:** `docs/evidence/bug-001-investigation.txt`, `docs/evidence/bug-001-menu-with-dialog.png`, `docs/evidence/bug-001-newsletter-popup.png`. Covered by `tests/e2e/newsletter-popup.spec.ts` (`test.fail()`, annotation `BUG-001`).

---

## BUG-002

**Severity:** Medium

**Summary:** No Content-Security-Policy header is sent on `/` or `/contact`.

**Steps:**
1. Request https://techdome.io/ and https://techdome.io/contact
2. List every response header on both

**Expected:** A Content-Security-Policy header restricting script sources, particularly since the site collects lead data and loads third-party scripts (Google Tag Manager).

**Actual:** Content-Security-Policy is absent from both responses. Other security headers are present: Strict-Transport-Security (`max-age=63072000; includeSubDomains; preload`), X-Frame-Options (`SAMEORIGIN`), X-Content-Type-Options (`nosniff`), Referrer-Policy (`strict-origin-when-cross-origin`) and Permissions-Policy (`camera=(), microphone=(), geolocation=()`).

**Evidence:** `docs/evidence/security-headers.txt`. Covered by `tests/security/headers.spec.ts` (`test.fail()`, annotation `BUG-002: Content-Security-Policy missing on / and /contact`).

---

## BUG-003

**Severity:** Medium

**Summary:** When a contact form submission fails, the error banner is not exposed to assistive technology — it has no `role="alert"`, no `role="status"`, and no `aria-live` ancestor.

**Steps:**
1. Open https://techdome.io/contact, with `/api/leads` mocked to return a 500 response (no real lead sent)
2. Fill both steps of the form and click "Find a time"
3. List every element on the page with `role="alert"` or `role="status"`, and walk up the DOM from the visible error banner's text node to its nearest role-bearing ancestor

**Expected:** The failure message is exposed as an alert or live region so assistive technology announces it.

**Actual:** "We couldn't submit your request right now. Please try again." is shown visually (one match), but walking up from that text (`<p>` → six plain `<div>`s → `<section>` → `<div>` → `<main>` → `<body>` → `<html>`) found no `role` or `aria-live` at any level. The only element on the page with `role="alert"` is Next.js's own `#__next-route-announcer__`, which is empty (`text: ""`) and unrelated to the form.

**Evidence:** `docs/evidence/contact-banner-role.txt`, `docs/evidence/contact-submit-after-click.png`. Covered by `tests/e2e/contact-form.spec.ts` (failed-submission test).

---

## BUG-004

**Severity:** Low

**Summary:** Contact form "Required." errors are not linked to their inputs via `aria-describedby`.

**Steps:**
1. Open https://techdome.io/contact
2. Click "Next" with First name and Work email empty
3. Read `aria-invalid` and `aria-describedby` on both fields

**Expected:** Each "Required." message is referenced by its input's `aria-describedby`, so a screen reader announces the reason, not just "invalid".

**Actual:** Both First name and Work email get `aria-invalid="true"` and a visible "Required." message directly beneath them, but `aria-describedby` is not set on either field.

**Evidence:** `docs/evidence/contact-inspection.txt`, `docs/evidence/contact-empty-next.png`.

---

## BUG-005

**Severity:** Low

**Summary:** The post-submission confirmation greeting shows only the first word of the visitor's first name.

**Steps:**
1. Open https://techdome.io/contact, with `/api/leads` mocked to return the site's own success shape (`{ success: true, contactId: "x", bookingToken: "y" }`; no real lead sent)
2. Enter First name "Mary Ann", complete both steps, and click the final "Find a time"
3. Read the confirmation heading

**Expected:** "Thank you, Mary Ann!"

**Actual:** "Thank you, Mary!". The loaded bundle builds the confirmation name as `K.name.split(" ")[0]`, taking only the first space-delimited token of the full `"firstName lastName"` string.

**Evidence:** `docs/evidence/bug-005-greeting.png`, `docs/evidence/bug-005-greeting.txt`.

---

## BUG-006

**Severity:** Low

**Summary:** The `/contact` page's browser tab title and its Open Graph title don't match, so a link shared in chat or social media previews differently than what the page actually shows.

**Steps:**
1. Open https://techdome.io/contact
2. Read `document.title` and the `og:title` meta tag's `content`

**Expected:** Consistent titles, so a shared link's preview matches the page.

**Actual:** `document.title` is `"Contact Us | Techdome"`; `og:title` is `"Talk to an Architect: 30-Minute Scoping Call | Techdome"`.

**Evidence:** `docs/evidence/bug-006-title-mismatch.txt`.

---

## BUG-007

**Severity:** Low

**Summary:** Clicking "Find a time" once reveals four more fields and immediately shows "Required." on one of them, before the visitor has had any chance to type into it.

**Steps:**
1. Open https://techdome.io/contact, fill First name and Work email, click "Next"
2. Select "Engineering Pods / Staff Augmentation" and click "Find a time" exactly once (not clicked again)
3. Without typing anything, read the value and `aria-invalid` of "What are you looking to build or staff?", and whether "Required." is visible

**Expected:** Newly-revealed fields appear without errors until the visitor actually tries to submit them.

**Actual:** "What are you looking to build or staff?", Team size needed, Timeline and Budget range all appear, and "What are you looking to build or staff?" already shows `aria-invalid="true"` and a visible "Required." message, while its value is still `""` — it was validated as a side effect of being revealed, not because the visitor interacted with it.

**Evidence:** `docs/evidence/contact-find-a-time.png`, `docs/evidence/contact-find-a-time.txt`, `docs/evidence/bug-008-premature-error.png`, `docs/evidence/bug-008-premature-error.txt`.

---

## BUG-008

**Severity:** Low

**Summary:** Every blog/insights card on the homepage shows the same publish date.

**Steps:**
1. Open https://techdome.io/
2. Read the title and date of every blog/insights card

**Expected:** Distinct publish dates reflecting when each article was actually written.

**Actual:** All 8 cards show `Oct 15, 2026`:
| Date | Title |
|---|---|
| Oct 15, 2026 | API testing explained: types, what to automate, and tools |
| Oct 15, 2026 | "Automating mortgage back-office work with n8n" |
| Oct 15, 2026 | The DevOps lifecycle, from commit to production |
| Oct 15, 2026 | Fixed price vs time and materials for a software project |
| Oct 15, 2026 | A practical HIPAA checklist for app architecture |
| Oct 15, 2026 | How long does it take to build an MVP? A realistic timeline |
| Oct 15, 2026 | "Multi-tenant SaaS on PostgreSQL: schema or row-level isolation" |
| Oct 15, 2026 | "n8n vs Zapier vs Make: which one for business automation" |

**Evidence:** `docs/evidence/blog-dates.txt`, `docs/evidence/blog-dates.png`.

---

## Investigated and ruled out

These looked like bugs at first but weren't, once checked against evidence:

- **Header dropdown "race" (initial theory):** early repeated-run failures looked like a race condition in the dropdown toggle itself. `docs/evidence/bug-001-investigation.txt` shows the real mechanism: `aria-expanded` does flip to `"true"` on click, then reverts to `"false"` specifically around when the newsletter pop-up becomes visible — the actual cause is BUG-001, not an unrelated flaky toggle.
- **Mobile "Close navigation" blocked:** a test clicking the header's hamburger toggle (which the full-screen mobile nav dialog visually covers once open) could not close it. Checked the dialog's own separate close button instead — it closes the menu correctly at both 375px and 768px, confirmed via `docs/evidence/mobile-nav-close-button-blocked.png` and a working subsequent check against the dialog-scoped button. The header toggle itself being unreachable while covered is expected overlay behaviour, not a bug.
- **"Book call" vs "Contact Us" duplicate CTAs:** these were never shown together. "Book call" is the header's CTA label at the 375px viewport; "Contact Us" is the label at 768px and wider. Both point to the same `/contact` link — one responsive label, not two competing CTAs (`docs/evidence/bug-003-book.png`).
- **Second always-invalid email input on `/contact`:** investigation found a second `email`-type input beyond the visible contact form fields. It belongs to the newsletter pop-up component, not the contact form — an untouched, unrendered required field reporting itself as invalid is normal, not a leak or a form defect.
- **Emails found in page source:** `you@company.com` and `name@company.com` matched the email pattern in JS bundles, but both are confirmed input placeholder values (the newsletter pop-up's and the booking dialog's own email fields), not real or leaked addresses. Zero AWS/Google/Stripe/GitHub keys, JWTs, private-key headers or bearer tokens were found across 54 first-party responses (`docs/evidence/security-sensitive-scan.txt`).
- **Soft 404:** not present — a request for a non-existent page returns a genuine HTTP 404 status, not a 200 with a "not found"-looking page.
- **Once-flaky "Services" dropdown test:** a single failing run (out of many) showed the click landing only ~196ms after navigation ended, with no other recorded activity (no pop-up handler invocation, no hover event) in the trace at that point — consistent with the click arriving before the page had fully settled under parallel test-worker load, rather than a genuine, reliably-reproducible site defect. Not pursued further as its own bug.
