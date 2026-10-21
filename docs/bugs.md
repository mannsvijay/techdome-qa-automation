# Bug Report: techdome.io

**Tested:** 21–22 October 2026 · Chromium via Playwright 1.64.1 (1280x720, 768x1024, 375x812) and Chrome [version] for manual checks · Windows
**Method:** Every bug below was reproduced at least once with evidence saved in `docs/evidence/`. Submissions were never sent to the real backend: `/api/leads` was always aborted or mocked.

---

## BUG-001
**Severity:** Medium
**Summary:** The newsletter pop-up opens automatically 2–3s after page load and collapses any header menu the visitor has already opened; its full-screen backdrop blocks the header until dismissed.
**Steps:**
 1. Open https://techdome.io in a fresh incognito window (or clear localStorage key `td_nl_popup_until`)
 2. Within 2 seconds of load, click "Services" in the header; the menu opens (`aria-expanded="true"`)
 3. Wait 1–2 seconds without moving the mouse
**Expected:** A menu the visitor has opened stays open; the pop-up waits until the visitor is idle, or does not interrupt an active interaction.
**Actual:** The pop-up appeared at 2095ms and 2951ms after load in two runs, and the Services menu closed at the moment it appeared (`aria-expanded="false"` before the pop-up was closed). Reproduced 3/3 in automation [and manually: yes/no].
**Impact note:** Closing the pop-up stores `td_nl_popup_until` in localStorage 14 days ahead, so this affects first visits only, which is why this is Medium, not High.
**Evidence:** `docs/evidence/bug-001-investigation.txt` (raw timings and aria-expanded values), `docs/evidence/bug-001-menu-with-dialog.png`, `docs/evidence/bug-001-newsletter-popup.png`. Covered by `tests/e2e/newsletter-popup.spec.ts` (marked `test.fail()` with annotation BUG-001).

---

## BUG-002
**Severity:** Medium
**Summary:** No Content-Security-Policy header is sent on `/` or `/contact`.
**Steps:**
 1. Request https://techdome.io/ and https://techdome.io/contact
 2. Inspect the response headers (DevTools > Network > document request > Headers)
**Expected:** A Content-Security-Policy header restricting script sources, especially since the site collects lead data and loads third-party scripts (Google Tag Manager).
**Actual:** Content-Security-Policy is absent on both pages. Other security headers are present and well configured: Strict-Transport-Security (`max-age=63072000; includeSubDomains; preload`), X-Frame-Options (`SAMEORIGIN`), X-Content-Type-Options (`nosniff`), Referrer-Policy (`strict-origin-when-cross-origin`) and Permissions-Policy. Script injection tests did not execute, so this is a missing defence-in-depth layer, not an open hole.
**Evidence:** `docs/evidence/security-headers.txt` (all response headers). Covered by `tests/security/headers.spec.ts` (marked `test.fail()` with annotation BUG-002).

---

## BUG-003
**Severity:** Medium
**Summary:** When a contact form submission fails, the error banner is not announced to screen reader users (no `role="alert"` or `aria-live`).
**Steps:**
 1. Open https://techdome.io/contact, open DevTools > Network and block the request URL `/api/leads` (so no real lead is sent)
 2. Fill all fields on both steps and click "Find a time"
 3. Inspect the error banner in DevTools > Accessibility
**Expected:** The failure message is exposed as an alert or live region so assistive technology announces it.
**Actual:** "We couldn't submit your request right now. Please try again." is shown visually, but neither the banner nor any ancestor has a role or `aria-live`. The only `role="alert"` on the page is Next.js's empty route announcer. A screen reader user gets no feedback that the main lead form failed.
**Evidence:** `docs/evidence/contact-banner-role.txt` (all alert/status elements and the banner's ancestor chain), `docs/evidence/contact-submit-after-click.png`. Covered by `tests/e2e/contact-form.spec.ts` (error-state test).

---

## BUG-004
**Severity:** Low
**Summary:** Contact form "Required." errors are not linked to their inputs, so screen readers announce "invalid" without the reason.
**Steps:**
 1. Open https://techdome.io/contact
 2. Click "Next" with all fields empty
 3. Inspect First name and Work email in DevTools
**Expected:** Each error message is referenced by its input's `aria-describedby`.
**Actual:** Both inputs get `aria-invalid="true"` and a visible "Required." message, but `aria-describedby` is not set on either.
**Evidence:** `docs/evidence/contact-inspection.txt`, `docs/evidence/contact-empty-next.png`.

---

## BUG-005
**Severity:** Low
**Summary:** The confirmation greeting shows only the first word of the visitor's first name.
**Steps:**
 1. Open https://techdome.io/contact
 2. Enter a two-word first name such as "Mary Ann", complete both steps and submit (reproduced with the `/api/leads` response mocked to the site's own success shape; no real lead sent)
 3. Read the confirmation heading
**Expected:** "Thank you, Mary Ann!"
**Actual:** [heading text from bug-005-greeting.txt, e.g. "Thank you, Mary!"]. The site builds the name with `firstName.split(' ')[0]`. This may be intentional, but it truncates legitimate two-part first names.
**Evidence:** `docs/evidence/bug-005-greeting.png`, `docs/evidence/bug-005-greeting.txt`.

---

## BUG-006 [KEEP ONLY IF VERIFIED]
**Severity:** Low
**Summary:** The `/contact` page's tab title and Open Graph title differ, so shared links preview differently from the page.
**Steps:**
 1. Open https://techdome.io/contact
 2. Compare the browser tab title with the `og:title` meta tag (DevTools > Elements > head)
**Expected:** Consistent titles, so a shared link's preview matches the page.
**Actual:** Tab title is "Contact Us | Techdome"; `og:title` is "Talk to an Architect: 30-Minute Scoping Call | Techdome". This may be an intentional marketing choice.
**Evidence:** `docs/evidence/bug-006-title-mismatch.png`.

---

## BUG-007 [KEEP ONLY IF VERIFIED]
**Severity:** Low
**Summary:** Work email keeps `aria-invalid="true"` after the visitor corrects it to a valid address.
**Steps:**
 1. Open https://techdome.io/contact
 2. Type "not-an-email" in Work email and press Tab
 3. Replace it with "qa-test@example.com" and press Tab
**Expected:** `aria-invalid` returns to false once the value is valid.
**Actual:** `aria-invalid` stays "true" after the valid value and blur [visible error: still shown / cleared], so assistive technology still reports the field as invalid.
**Evidence:** `docs/evidence/contact-inspection.txt`, `docs/evidence/bug-007-aria-invalid.png`.

---

## BUG-008 [KEEP ONLY IF VERIFIED]
**Severity:** Low
**Summary:** Clicking "Find a time" reveals four more fields and immediately shows a "Required." error on one the visitor has not seen yet.
**Steps:**
 1. Open https://techdome.io/contact, fill First name and Work email, click "Next"
 2. Select "Engineering Pods / Staff Augmentation" and click "Find a time"
**Expected:** New fields appear without errors until the visitor tries to submit them.
**Actual:** "What are you looking to build or staff?", Team size needed, Timeline and Budget range appear, and the textbox already shows "Required." [confirmed manually: yes/no].
**Evidence:** `docs/evidence/contact-find-a-time.png`, `docs/evidence/contact-find-a-time.txt`, `docs/evidence/bug-008-premature-error.png`.

---

## Investigated and ruled out

These looked like bugs at first but were not, after evidence:

- **Header dropdown "race" (initial Claude theory, High):** the 7/21 dropdown failures came from the test interacting while the pop-up appeared and from parallel load; the real site behaviour is BUG-001. Single-worker runs passed 21/21.
- **Mobile "Close navigation" blocked:** the test clicked the header toggle, which the full-screen menu covers while open. The menu's own close button works at 375px and 768px.
- **"Book call" and "Contact Us" duplicate CTAs:** never shown together. "Book call" is the 375px header label for the same `/contact` link that desktop labels "Contact Us".
- **Second always-invalid email input on /contact:** the newsletter pop-up's own field; an untouched required field reporting invalid is normal HTML.
- **Emails in page source:** `you@company.com` and `name@company.com` are input placeholders, not leaked data. No API keys, tokens or private keys were found in 54 first-party responses.
- **Soft 404:** not present; a non-existent page returns HTTP 404.
- **Flaky Services dropdown test (1/21, once):** the click landed 196ms after load with no other activity in the trace; likely before the page was interactive. Not reproducible on demand, so documented as a known flaky test rather than a bug.