Prompt #1
What I asked: Read CLAUDE.md and docs/QA-Playwright-Assignment.pdf. Then update playwright.config.ts: set baseURL to    
  https://techdome.io, workers to 4, screenshot and trace on failure, and keep only the chromium project    
  for now. Do not write any tests yet. Show me the diff before applying it.

What Claude did: Showed a diff for playwright.config.ts: baseURL, workers 4, trace retain-on-failure, screenshot only-on-failure, removed firefox/webkit.
What I changed / accepted / rejected: Accepted all of it. Added retries: 1 myself because the target is a live site. Verified workers is under the 5-user limit.

---

## Prompt #2
**What I asked:** Read docs/exploration-notes.md and write docs/user-story-map.md from it only, using the exact template from the PDF. Cover: Navigation 2, Contact form 2, CTAs and external links 2, Mobile 2, API/form integration 3, Security 2, Load 1, plus 2 to 3 extra stories. Do not invent anything that is not in the notes.

**What Claude did:** Wrote 17 stories (US-001 to US-017) covering all minimum areas plus 3 extras. It kept unverified items as "to confirm when tests run" instead of asserting outcomes.

**What I changed / accepted / rejected:**
[Write your real edits, for example: rewrote US-00X acceptance criteria to match the real error text I saw; changed priority of US-0XX from P0 to P2; deleted criterion ... because it was not on the site.]


## Prompt #3
**What I asked:** Read CLAUDE.md, docs/user-story-map.md and playwright.config.ts. Do NOT write tests yet. First give me a short plan (a table) of the files you will create under utils/ and tests/e2e/, which story IDs each test covers, and which selector strategy you will use. Rules: use getByRole/getByLabel/data-testid, no text-based selectors, never submit a real contact form, keep requests low. Wait for my approval.

**What Claude did:** Produced a plan of 4 util files and 5 spec files mapped to story IDs, using getByRole/getByLabel, reading hrefs instead of navigating to external domains, and intercepting form submissions.

**What I changed / accepted / rejected:**
Accepted: role/label selectors, never navigating to third-party sites, never submitting the live form.
Changed: (1) the plan assumed the contact form sends a POST, which I had not verified, so I deferred the intercept fixture until I observe the real request. (2) Reading hrefs alone cannot catch a 404, so I will status-check every unique internal footer link sequentially (about 35 requests) instead of clicking 4 samples. (3) Scoped header and footer locators with banner and contentinfo roles to avoid duplicate-name strict-mode errors. (4) Asked for one spec file at a time instead of all 5, so I can review and run each



## Prompt #4
**What I asked:** Approved with changes. Create utils/helpers.ts and utils/pages/HomePage.ts with header locators scoped to getByRole('banner') and footer to getByRole('contentinfo'). Do not create ContactPage or the intercept fixture yet because we have not observed the contact request. Write tests/e2e/homepage.spec.ts for US-001 only, but first inspect how Services, Portfolio, Insights and Company behave and tell me before asserting. Collect console errors and attach them without failing on third-party errors. If a test fails, do not change the assertion; tell me if it is a site bug or a test bug.

**What Claude did:** Inspected the live site with scratch scripts first. Found that the four header items are dropdown buttons (aria-haspopup), not links, and that a delayed newsletter modal with a full-screen backdrop blocks header clicks. Then wrote helpers.ts, HomePage.ts and 7 tests (title and meta description, hero heading, logo href, 4 dropdown open/close tests). All 7 passed.

**What I changed / accepted / rejected:**
Accepted the inspect-before-assert approach: my own notes and US-001 assumed these were links, and Claude's inspection proved that wrong, so I rewrote US-001 to describe dropdown behaviour. I did not accept the manual popup-dismiss helper as final: because the popup timing is inconsistent (it did not appear in one inspection run), I asked for page.addLocatorHandler instead and re-ran the spec with --repeat-each=3 to check for flakiness.