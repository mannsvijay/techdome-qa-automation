## Prompt #1
**What I asked**: Read CLAUDE.md and docs/QA-Playwright-Assignment.pdf. Then update playwright.config.ts: set baseURL to    
  https://techdome.io, workers to 4, screenshot and trace on failure, and keep only the chromium project    
  for now. Do not write any tests yet. Show me the diff before applying it.

**What Claude did**: Showed a diff for playwright.config.ts: baseURL, workers 4, trace retain-on-failure, screenshot only-on-failure, removed firefox/webkit.
**What I changed / accepted / rejected**: Accepted all of it. Added retries: 1 myself because the target is a live site. Verified workers is under the 5-user limit.

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


## Prompt #5
**What I asked:** Do not change any test or page object code in this batch. Investigation only, then wait for my approval.

PART A - Diagnose the 7 dropdown failures before calling them a site bug
1. Show me the current dropdown test code from tests/e2e/homepage.spec.ts.
2. Open the trace for one failure of each shape ("Expected false, Received ''" and "Expected true, Received false") using the files in test-results. Give me a timeline in ms: when the dialog appeared, when the locator handler clicked "Close newsletter pop-up", when the test clicked the menu button, and the aria-expanded value at each point.
3. Test this hypothesis with a scratch script outside the repo: open "Services", wait until aria-expanded is "true", then wait for the newsletter dialog and close it with its close button. Report whether aria-expanded becomes "false" after the close click. Repeat once.
4. In a fresh context, close the dialog with its button, then list any cookie or localStorage/sessionStorage key that was added. Reload and wait 6 seconds: does the dialog come back?
5. Based on evidence only, tell me: site bug, test bug, or test-induced side effect. Then propose (do not apply) the most deterministic fix.

PART B - Contact form follow-up (read-only, same rules: abort every non-GET request and log it)
1. Click "Next" with empty fields and report any visible error text near First name and Work email (text content, not just aria-invalid).
2. Type "not-an-email" in Work email, then the valid "qa-test@example.com", press Tab to blur, and report aria-invalid after blur.
3. Find which container owns the "Enter your work email" input: is it inside the newsletter dialog, a chat widget, or the footer? Report its closest landmark or dialog ancestor.
4. On step 2, list all options of the "What do you need?" combobox. Pick the first non-placeholder option, click "Find a time", and report what appears (fields, iframes and their src domains) and every request logged or aborted. Do NOT select a time slot or submit anything beyond that.
5. Delete scratch scripts, then stop and wait.

**What Claude did:** Inspected the newsletter dialog before writing code and found its accessible name is "One engineering note, every other Monday." (via aria-labelledby), not "Techdome newsletter" as I had specified; the close button is role=button "Close newsletter pop-up". Replaced the manual dismissal with page.addLocatorHandler() in HomePage.goto(). Ran the homepage spec with --repeat-each=3 --retries=0: 14 passed, 7 failed, all in the four dropdown tests. Claude labelled these a site bug. Measured popup appearance at 2149, 2236 and 2170 ms after load and saved docs/evidence/bug-001-newsletter-popup.png. Inspected /contact with non-GET requests aborted: only two GA beacons were aborted, no form request fired on "Next", step 2 shows a "What do you need?" combobox, "Back" and "Find a time".

**What I changed / accepted / rejected:**
Accepted Claude's correction of the dialog name; my name came from the visible label, which is not the ARIA name, and would have matched zero elements. Rejected the "site bug" verdict for now: Claude called the failures unpredictable, but its own timings are consistent (~2.2s), and the old dismissal waited for the popup before interacting while the new handler does not. My hypothesis is that the handler's click on the close button acts as an outside click that closes the open dropdown, so the flakiness may be caused by my own change. I asked for trace evidence before logging anything in bugs.md. Also did not accept two unverified claims: that the extra "Enter your work email" input belongs to a chat widget, and the aria-invalid result after a valid email (no blur was done). Corrected BUG-001: the timing is consistent, not random. 

