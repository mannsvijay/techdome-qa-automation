# Bug Report: techdome.io

## BUG-001

**Severity:** High

**Summary:** A timed newsletter pop-up races with the header's dropdown menus — clicking a header nav button around the same time the pop-up appears can leave its `aria-expanded` state stuck or cause the click to be silently swallowed.

**Steps:**
1. Go to https://techdome.io
2. Within the first few seconds of page load (while or right after the "Techdome newsletter" pop-up appears), click a header menu button — Services, Portfolio, Insights, or Company
3. Observe the button's `aria-expanded` attribute and whether the dropdown panel actually opens

**Expected:** Clicking a header menu button always toggles its dropdown open (`aria-expanded="true"`, panel visible with its links), regardless of timing relative to the pop-up.

**Actual:** Running `tests/e2e/homepage.spec.ts` with `--repeat-each=3 --retries=0` (21 runs total), 7/21 failed with one of:
- `aria-expanded` read as `""` instead of `"false"` immediately after the pop-up was auto-dismissed, or
- after `click()`, `aria-expanded` stayed `"false"` instead of flipping to `"true"` (the click had no effect).

All four menu buttons were affected across different runs (not one specific button), which points to a shared overlay/state race on the site rather than a problem with one control. A real visitor who opens a header menu in roughly the same window the pop-up appears (~2.1–2.2s after load, see evidence) could have the same experience: a menu that silently fails to open.

**Evidence:**
- `docs/evidence/bug-001-newsletter-popup.png` — screenshot showing the pop-up's full-viewport backdrop dimming the header nav underneath it
- Pop-up appearance timing across 3 sequential loads: 2149 ms, 2236 ms, 2170 ms after the page's `load` event
- Playwright trace/screenshot artifacts from the 7 failing runs under `test-results/` (e.g. `expect(locator).toHaveAttribute(expected) failed — Expected: "true" Received: "false"`)

---

## BUG-002

**Severity:** Low

**Summary:** The `/contact` page's browser tab title and its Open Graph title don't match, so a link shared in chat or social media previews differently than what the page actually shows.

**Steps:**
1. Go to https://techdome.io/contact
2. Read the browser tab title
3. Inspect the `og:title` meta tag

**Expected:** Tab title and `og:title` are consistent, so a shared link's preview matches the page.

**Actual:** Tab title is `"Contact Us | Techdome"`; `og:title` is `"Talk to an Architect: 30-Minute Scoping Call | Techdome"`.

**Evidence:** `docs/exploration-notes.md` ("Odd things" section); tracked as acceptance criteria in `docs/user-story-map.md` US-015.

---

## BUG-003

**Severity:** Low

**Summary:** The header has two separate buttons/links — "Book call" and "Contact Us" — that both resolve to the same `/contact` page, which is redundant and could read as a mistake rather than an intentional choice.

**Steps:**
1. Go to https://techdome.io
2. Note both "Book call" and "Contact Us" are present in the header
3. Click each separately

**Expected:** Either a single clear header CTA to `/contact`, or two CTAs that are differentiated (e.g. one leads to a specific `/contact` variant).

**Actual:** Both "Book call" and "Contact Us" navigate to the exact same `/contact` page with no distinguishing parameters.

**Evidence:** `docs/exploration-notes.md` ("Odd things" section); tracked in `docs/user-story-map.md` US-016.

---
<!-- 
## BUG-004

**Severity:** Medium

**Summary:** `/contact` contains a second, separate `email` input (accessible name "Enter your work email", native `required`) that is distinct from the real contact form's "Work email" field, is always empty, and always reports itself as invalid — present on both step 1 and step 2 of the contact wizard.

**Steps:**
1. Go to https://techdome.io/contact
2. In a page script, read `document.querySelectorAll('input[type=email]')` validity state without touching anything
3. Compare against the visible "Work email *" field in the contact form

**Expected:** Only the contact form's own "Work email" field should exist with email-type validation; any other input on the page should not perpetually report a native `"Please fill out this field."` validation failure unrelated to user action.

**Actual:** A second `email`-type input (likely belonging to the floating "Open Pod chat" widget, not the visible contact form) is present, native-`required`, always empty, and always reports `validationMessage: "Please fill out this field."` / `validity.valid: false` — on both step 1 and step 2 of `/contact` — regardless of what was filled into the actual contact form fields.

**Note:** Not yet visually confirmed whether this field is genuinely hidden/off-canvas (and so harmless) or reachable via keyboard/tab order (a real accessibility concern). Flagging for follow-up visual/keyboard verification before raising severity further.

**Evidence:** Captured via a read-only Playwright inspection script against `/contact` (DOM validity dump); reproducible on every page load. -->
