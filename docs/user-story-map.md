# User Story Map: techdome.io

Source: `docs/exploration-notes.md` only. No pages, buttons, or behaviours beyond what was observed and noted there.

## Coverage summary

| Area | Test Type | Stories | IDs |
|---|---|---|---|
| Navigation & page load | E2E | 2 | US-001, US-002 |
| Contact / enquiry form | E2E | 2 | US-003, US-004 |
| CTAs & external links | E2E | 2 | US-005, US-006 |
| Mobile responsiveness | E2E | 2 | US-007, US-008 |
| API / form integration | Integration | 3 | US-009, US-010, US-011 |
| Security headers & injection | Security | 2 | US-012, US-013 |
| Load (≤5 users) | Load | 1 | US-014 |
| Extra (beyond minimum) | E2E | 4 | US-015, US-016, US-017, US-018 |

---

## US-001

**Title:** Header navigation resolves without broken or blank pages

**As a:** visitor

**I want to:** click the logo and each primary header item (Services, Portfolio, Insights, Company)

**So that:** I can explore Techdome's site without hitting a 404, a blank page, or a header control that silently does nothing

**Acceptance:**
- [x] Logo link navigates back to the homepage (`/`)
- [x] Services, Portfolio, Insights, and Company are dropdown buttons (`role=button`, `aria-haspopup="true"`) that toggle a panel open and closed (`aria-expanded` `"true"`/`"false"`) — confirmed they do not navigate anywhere or produce a 404/blank page
- [x] Homepage browser tab title reads exactly "Techdome: Custom Software Development & Venture Studio"
- [ ] No console errors are thrown while opening each header item (console errors are collected and attached to the test report for visibility, but not asserted)

**Test Type:** E2E
**Priority:** P0
**Automated in:** `tests/e2e/homepage.spec.ts`

---

## US-002

**Title:** Footer navigation links resolve across all listed sections

**As a:** visitor

**I want to:** click through the footer's Services, Industries, Products, and Company links

**So that:** every path Techdome advertises in the footer actually leads somewhere valid

**Acceptance:**
- [x] Footer Services links (`/studio`, `/studio#mvp`, `/staff-augmentation`, `/staff-augmentation#role-react-nextjs`, `/staff-augmentation#role-nodejs-backend`, `/automation`, `/gcc`, `/automation#ai-voice-agents`) each resolve without a 404
- [x] Footer Industries links (`/work?domain=...` for Healthcare, Enterprise & ERP, AI & Automation, FinTech, Consumer & Marketplace, Public Sector, EdTech & Education) each resolve without a 404
- [x] Footer Products links (`/products/sparrow`, justinterview-ai, saral-funding, geolytics, aether-voice, catalyst, arc) each resolve without a 404
- [x] Footer Company links (`/about`, `/work`, `/insights`, `/topics`, `/glossary`, `/newsletter`, `/life-at-techdome`, `/careers`, `/faq`) each resolve without a 404
- [x] `/privacy`, `/terms`, and `/sitemap.xml` each resolve without a 404

**Test Type:** E2E
**Priority:** P1
**Automated in:** `tests/e2e/footer-navigation.spec.ts`

---

## US-003

**Title:** Contact form blocks submission when required fields are empty

**As a:** prospect

**I want to:** click "Next" on the `/contact` form without filling in First name or Work email

**So that:** I get clear, immediate feedback instead of the form silently failing or losing my place

**Acceptance:**
- [x] Clicking "Next" with First name empty shows a validation error for that field
- [x] Clicking "Next" with Work email empty shows a validation error for that field
- [x] Clicking "Next" with an invalid Work email (e.g. not containing `@`) shows a validation error
- [x] The form does not advance to the next step while any required field is invalid

**Test Type:** E2E
**Priority:** P0
**Automated in:** `tests/e2e/contact-form.spec.ts`

---

## US-004

**Title:** Contact form advances with valid required fields, without hitting the live backend

**As a:** prospect

**I want to:** fill in First name and Work email and click "Next"

**So that:** I can proceed toward booking a scoping call, while my test run never sends a real enquiry to Techdome

**Acceptance:**
- [x] With First name and Work email filled in, clicking "Next" advances the form to step 2, revealing the "What do you need?" select
- [x] No network request (GET or otherwise) is sent to techdome.io during the step 1 → step 2 transition — it is confirmed to be purely client-side
- [ ] The "Existing client" (`/contact?for=client`) and "Student or learner" (`/contact?for=student`) links each load the contact page with the expected query parameter (not exercised by any test)

**Test Type:** E2E
**Priority:** P0
**Automated in:** `tests/e2e/contact-form.spec.ts`

---

## US-005

**Title:** Homepage primary CTAs route to their correct internal destinations

**As a:** prospect

**I want to:** click the homepage's main calls to action

**So that:** each CTA takes me to the page it claims to, with no mismatched or dead links

**Acceptance:**
- [ ] "Book a product teardown" navigates to `/contact`
- [ ] "See what we've built" navigates to `/work`
- [ ] "How we build new products" navigates to `/studio`
- [ ] "Start a conversation" and "Book a 30-minute scoping call" navigate to `/contact`
- [ ] "Explore All Blogs" navigates to `/insights`
- [ ] "See GCC services" navigates to `/gcc`
- [ ] "Meet the studio" navigates to `/about`
- [ ] "Explore automation" navigates to `/automation`
- [ ] "Scale your pod" navigates to `/staff-augmentation`

**Test Type:** E2E
**Priority:** P0
**Not automated:** `tests/e2e/ctas-and-external-links.spec.ts` checks the header "Contact Us" link and the generic external-link `target`/`rel` rule, but no test asserts any of these specific internal CTA hrefs.

---

## US-006

**Title:** Homepage external links open the correct external destinations

**As a:** recruiter

**I want to:** click the external links referenced from the homepage (Upwork profile, Product Hunt listing for Sparrow, Clutch, the n8n.io creator page, WhatsApp)

**So that:** I land on Techdome's real external profiles instead of a dead, wrong, or internal-only link

**Acceptance:**
- [ ] The Upwork profile link opens an `upwork.com` URL
- [ ] The Product Hunt link for Sparrow opens a `producthunt.com` URL
- [ ] The Clutch link opens a `clutch.co` URL
- [ ] The n8n.io creator page link (Rahul Joshi) opens an `n8n.io` URL
- [ ] The WhatsApp link (`/go/whatsapp`) redirects to a `wa.me` (or equivalent WhatsApp) URL referencing +91 9652049922

**Test Type:** E2E
**Priority:** P1
**Automated in:** `tests/e2e/ctas-and-external-links.spec.ts` — but only as a blanket rule across all 15 external links found (every `target="_blank"` link must have `rel` containing `noopener`); none of the five specific domains/destinations above is individually asserted.

---

## US-007

**Title:** Homepage is usable at a 375px mobile viewport

**As a:** visitor

**I want to:** open the homepage on a 375px-wide screen

**So that:** I can read the content and reach navigation without pinch-zooming or scrolling sideways

**Acceptance:**
- [x] No horizontal overflow/scroll is present at 375px
- [x] Header navigation collapses behind a single "Open navigation" toggle button (`aria-controls="mobile-nav"`), which opens a full-screen `role="dialog"` ("Site Navigation") containing its own Services/Portfolio/Insights/Company buttons — confirmed to open and close correctly at 375px
- [x] Hero heading remains visible at 375px
- [ ] Hero stats (7+/40+/100%) remain visible and legible at 375px (visibility of the heading is asserted; the stats specifically are not)

**Test Type:** E2E
**Priority:** P1
**Automated in:** `tests/e2e/mobile-responsiveness.spec.ts`

---

## US-008

**Title:** Homepage is usable at a 768px tablet viewport

**As a:** visitor

**I want to:** open the homepage on a 768px-wide screen

**So that:** the layout reflows correctly between mobile and desktop breakpoints

**Acceptance:**
- [x] No horizontal overflow/scroll is present at 768px
- [x] Header navigation renders the same "Open navigation" toggle / "Site Navigation" dialog pattern as 375px, confirmed to open and close correctly at 768px too
- [ ] Hero section and CTA buttons remain visible and usable without overlap at 768px (only the hero heading's visibility is asserted)

**Test Type:** E2E
**Priority:** P2
**Automated in:** `tests/e2e/mobile-responsiveness.spec.ts`

---

## US-009

**Title:** Contact form submission sends the expected request payload to `/api/leads`

**As a:** prospect

**I want to:** complete both steps of the contact form and submit

**So that:** I can trust the right data reaches the backend, without a real enquiry ever reaching Techdome during testing

**Acceptance:**
- [x] Clicking "Next" after step 1 (First name/Work email) triggers no network request — the step 1 → step 2 transition is entirely client-side
- [x] The final "Find a time" click sends exactly one `POST` request to `/api/leads` with `Content-Type: application/json`
- [x] The request body contains `service`, `contact.{firstName,lastName,email,company}`, `answers.{requirement,teamSize,timeline,budget}`, `utm`, `attribution`, `landingPage`, and `website`, matching the values entered
- [x] No real request ever reaches the live `/api/leads` endpoint during any test — it is always mocked

**Test Type:** Integration
**Priority:** P0
**Automated in:** `tests/integration/contact-submission.spec.ts`

---

## US-010

**Title:** Third-party script requests do not block homepage render

**As a:** visitor

**I want to:** load the homepage

**So that:** third-party resources (Google Tag Manager/gtag) don't delay the content I came for

**Acceptance:**
- [x] The gtm.js/gtag.js `<script>` tags are loaded with `async: true` and no `defer` attribute — consistent with non-blocking loading
- [x] When every `googletagmanager.com` request is deliberately delayed by 5 seconds, the hero heading still becomes visible strictly before the first delayed GTM response is released back to the page
- [ ] Page finishes rendering hero content even if a third-party request fails outright (only a slow/delayed request was tested, not an aborted or failed one)

**Test Type:** Integration
**Priority:** P1
**Automated in:** `tests/integration/third-party-scripts.spec.ts`

---

## US-011

**Title:** Newsletter "Subscribe" submission is validated and intercepted

**As a:** visitor

**I want to:** enter an email into the homepage "Subscribe" field and submit it

**So that:** I get correct validation feedback, and no real subscription request fires during testing

**Acceptance:**
- [ ] Submitting a syntactically invalid email shows an inline validation error before any network request fires
- [ ] Submitting a valid email triggers exactly one intercepted network request (via `page.route()`), never a live subscription call
- [ ] The intercepted request payload contains the submitted email address

**Test Type:** Integration
**Priority:** P2
**Not automated:** every spec file other than `tests/e2e/newsletter-popup.spec.ts` suppresses the newsletter pop-up via `utils/fixtures.ts`, and that one file only tests the dropdown-collapse bug (BUG-001) and close/suppression persistence — no test fills or submits the "Subscribe" form itself.

---

## US-012

**Title:** Key security response headers are present

**As a:** visitor

**I want to:** load the homepage and `/contact`

**So that:** I can trust Techdome is following baseline web security practices before I submit any information

**Acceptance:**
- [x] Response headers for `/` are checked for `X-Frame-Options`, `Content-Security-Policy`, and `Strict-Transport-Security`
- [x] Response headers for `/contact` are checked for the same three headers
- [ ] Any of the three headers found missing on either page is recorded as a finding in `docs/bugs.md` (done manually as BUG-002; not something the test itself asserts)

**Test Type:** Security
**Priority:** P0
**Automated in:** `tests/security/headers.spec.ts` (marked `test.fail()` — `Content-Security-Policy` is confirmed missing on both pages; see BUG-002)

---

## US-013

**Title:** Contact form rejects or sanitises script injection in the name field

**As a:** prospect

**I want to:** submit `<script>alert(1)</script>` in the First name field

**So that:** a malicious input can't execute in my browser or get stored/reflected unescaped

**Acceptance:**
- [x] Submitting the script payload in First name does not trigger a JS alert or execute in the DOM
- [x] The intercepted request payload is inspected to confirm the raw `<script>` string is not reflected unescaped anywhere on the resulting page
- [x] No request reaches the live backend (per CLAUDE.md, submission is intercepted via `page.route()`)

**Test Type:** Security
**Priority:** P0
**Automated in:** `tests/security/injection.spec.ts` (also covers a second payload, `<img src=x onerror=alert(1)>`, beyond the minimum)

---

## US-014

**Title:** Homepage and contact page hold up under 5 concurrent users

**As a:** visitor

**I want to:** load `/` and `/contact` at the same time as 4 other visitors

**So that:** the site stays responsive and error-free under light concurrent load

**Acceptance:**
- [x] Exactly 5 concurrent virtual users hit `/` and `/contact` simultaneously — never more, per CLAUDE.md's hard limit
- [x] p95 response time across the run is under 3,000 ms
- [x] Zero HTTP 5xx responses occur during the run
- [x] Results are captured and saved to `docs/load-test-results.md`

**Test Type:** Load
**Priority:** P0
**Automated in:** `tests/load/load.spec.ts` (runs in its own Playwright project, dependent on `chromium`, so it never runs concurrently with any other test)

---

## US-015

**Title:** `/contact` page title and shared-link preview title are consistent

**As a:** prospect

**I want to:** share a link to `/contact` in chat or social media

**So that:** the preview title matches what I see in the browser tab, instead of looking like a broken or unrelated link

**Acceptance:**
- [ ] Browser tab `<title>` on `/contact` is captured (observed: "Contact Us | Techdome")
- [ ] `og:title` meta tag value on `/contact` is captured (observed: "Talk to an Architect: 30-Minute Scoping Call | Techdome")
- [ ] A mismatch between the two is flagged as a defect in `docs/bugs.md` rather than silently ignored

**Test Type:** E2E
**Priority:** P2
**Not automated:** investigated via a one-off script, with results saved to `docs/evidence/bug-006-title-mismatch.txt` and logged as BUG-006 in `docs/bugs.md`; no automated test asserts this.

---

## US-016

**Title:** Duplicate header CTAs ("Book call" and "Contact Us") behave consistently

**As a:** visitor

**I want to:** click either "Book call" or "Contact Us" in the header

**So that:** I don't get confused by two differently-labelled buttons that may or may not lead to the same place

**Acceptance:**
- [x] "Book call" navigates to `/contact` (confirmed as the header's CTA label at the 375px viewport)
- [x] "Contact Us" navigates to `/contact` (confirmed as the header's CTA label at 768px and wider — the two labels are never shown together, they're the same link at different breakpoints)
- [ ] Both buttons land on an identical page state (no difference in query params or pre-filled fields between the two) — not separately tested

**Test Type:** E2E
**Priority:** P2
**Automated in:** `tests/e2e/ctas-and-external-links.spec.ts`

---

## US-017

**Title:** Anchor-linked role/case-study sections scroll to the correct target

**As a:** recruiter

**I want to:** follow a link that points to an anchor like `/staff-augmentation#role-react-nextjs`

**So that:** I land directly on the relevant role section instead of the top of a long page

**Acceptance:**
- [ ] Navigating directly to `/staff-augmentation#role-react-nextjs` scrolls the viewport so the `role-react-nextjs` section is visible
- [ ] Navigating directly to `/staff-augmentation#role-nodejs-backend` scrolls the viewport so the `role-nodejs-backend` section is visible
- [ ] The same check passes for one `#case-studies` anchor under an Industries footer link (e.g. Healthcare)

**Test Type:** E2E
**Priority:** P2
**Not automated:** no test file navigates to or asserts scroll position for any of these anchors.

---

## US-018

**Title:** Newsletter pop-up does not collapse an already-open header dropdown

**As a:** visitor

**I want to:** have a header dropdown I've already opened stay open

**So that:** an unrelated, automatically-appearing newsletter pop-up doesn't interrupt the menu I'm actively using

**Acceptance:**
- [ ] Opening a header dropdown (e.g. Services) and leaving it open while the newsletter pop-up appears (2–3s after load) does not collapse the dropdown — `aria-expanded` stays `"true"`
- [ ] Closing the newsletter pop-up persists suppression via the `td_nl_popup_until` localStorage key, set roughly 14 days into the future, so it does not reappear on reload or on `/contact` within that window

**Test Type:** E2E
**Priority:** P2
**Automated in:** `tests/e2e/newsletter-popup.spec.ts` — the first acceptance item is actively asserted but currently fails (`test.fail()`, annotation BUG-001): the dropdown does *not* stay open, confirming this story is not yet met. The second item's suppression-persistence behaviour is confirmed working.
