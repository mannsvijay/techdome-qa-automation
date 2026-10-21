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



## Prompt #6
**What I asked:** Do not edit any file. Do not rerun tests, reload pages, or repeat browser interactions to fill gaps. Inspect existing traces, logs, screenshots, and available scratch-script output. Report only raw findings from steps actually performed. If a step was not run or evidence is unavailable, report "not run" or "not recorded". Do not infer missing results or state root-cause conclusions.

Part A — Newsletter dialog and header dropdowns: Report trace timelines for both failure shapes; whether Services aria-expanded became "false" after closing the dialog while the menu was open in both attempts; any cookie or storage keys added or changed; and whether the dialog reappeared after reload.

Part B — Contact form: Report visible error text after empty Next; Work email aria-invalid after blur; the closest dialog or landmark ancestor of the separate "Enter your work email" input; all "What do you need?" options; what appeared after Find a time, including fields and iframe domains; and every recorded network request with method, URL, and whether it was allowed or aborted.

Do not modify files, create tests, change assertions, or make recommendations. Return only findings under Part A and Part B. 

**What Claude did:** Read the existing Playwright traces and earlier script output without re-running anything. Shape 1: the baseline check failed before any click, aria-expanded was "" (empty) for about 5s after navigation. Shape 2: the test clicked Services, the locator handler closed the dialog about 400ms later, and every recorded value after that was "false"; no "true" was ever recorded. Marked storage, reload, visible error text, blur, ancestor, combobox options and "Find a time" as not run or not recorded. Listed the only logged requests: two aborted GA collect beacons and three GTM GETs; first-party GETs were never logged.

**What I changed / accepted / rejected:**
I wrote this prompt myself on top of the suggested one, adding rules not to re-run anything and to write "not run" instead of inferring. Accepted the findings as the real state of evidence. They rule out my earlier hypothesis for shape 1 (the handler did not cause it, since there was no click), and leave two explanations for shape 2: the handler's close click acting as an outside click (test-induced) or the dialog closing the menu when it opens (a real site issue). I designed the next experiment to separate these two instead of picking one, and asked for raw output to be saved in docs/evidence/ so the bug report has verifiable evidence.


## Prompt #7
**What I asked:** Do not edit any test, page object or docs file except the evidence files named below. Run every step; if a step fails or cannot be done, write "not run" with the reason. Do not state root causes. Use sequential fresh browser contexts, viewport 1280x720, no form submissions. Print raw results AND save the full raw output to docs/evidence/bug-001-investigation.txt.

PART A - Header dropdown vs newsletter dialog (2 fresh loads each)
A1. No interaction: from domcontentloaded until 6s, poll the "Services" header button every 200ms. Log each change of aria-expanded with timestamp, and the timestamp the newsletter dialog became visible.
A2. Wait until aria-expanded on "Services" is "false". Click "Services" and confirm aria-expanded is "true" (record if it never becomes "true"). Do NOT close the dialog. Wait until the dialog is visible, then record aria-expanded immediately and 500ms later. Then click "Close newsletter pop-up" and record aria-expanded 500ms later. Save one screenshot at the moment the dialog is visible to docs/evidence/bug-001-menu-with-dialog.png.
A3. Fresh context: record cookies, localStorage and sessionStorage, wait for the dialog, close it with its button, record them again and print the difference. Then reload, wait 6s and record whether the dialog appears. Then go to /contact, wait 6s and record whether it appears.

PART B - "Book call" location (no clicks)
B1. On the homepage, list every link or button named "Book call" or "Contact Us": href, closest landmark (banner, main, contentinfo) and nearest heading. Screenshot the "Book call" one to docs/evidence/bug-003-book-call-location.png.

Delete the scratch script, then stop.


**What Claude did:** Ran the investigation sequentially and saved raw output to docs/evidence/bug-001-investigation.txt plus a screenshot. A1: with no interaction, Services aria-expanded stayed "false" for 6s in both runs; the dialog appeared at 2095ms and 2951ms. A2: after clicking Services, aria-expanded became "true", and when the dialog became visible it was already "false", before any close click (2/2 runs). A3: closing the dialog added localStorage key td_nl_popup_until and GA cookies; the dialog did not reappear after reload or on /contact. B1: no element named "Book call" was found on the homepage; only "Contact Us" in the banner.

**What I changed / accepted / rejected:**
This experiment separated the two explanations I had for the dropdown failures. My own hypothesis (the locator handler's close click acting as an outside click) was wrong: the pop-up collapses the open menu as soon as it appears, so this is a real site bug and I rewrote BUG-001 with these steps. Claude's original "site bug" label was partly right, but it had no evidence at the time and also blamed failure shape 1, which did not reproduce in sequential runs. I worked out that td_nl_popup_until is set 14 days ahead, so dismissal is remembered; I lowered BUG-001 to Medium because only first visits are affected, and used this key to suppress the pop-up in tests instead of racing it. [B1 decision: BUG-003 corrected with location X / removed because "Book call" could not be found.]



## Prompt #8
**What I asked:** Read CLAUDE.md, utils/pages/HomePage.ts, tests/e2e/homepage.spec.ts and docs/evidence/bug-001-investigation.txt. Do only this batch. Do not edit any docs file.

  1. In utils/fixtures.ts, export a test (extending @playwright/test) whose page fixture adds an init script that sets localStorage "td_nl_popup_until" to a timestamp 1 day in the
  future, only when the page origin is techdome.io. This prevents the newsletter pop-up in tests that are not about it. Keep the addLocatorHandler in HomePage as a fallback, with a
  comment explaining why both exist.
  2. Update tests/e2e/homepage.spec.ts to import test and expect from utils/fixtures.ts. Do not change any assertion.
  3. Create tests/e2e/newsletter-popup.spec.ts using the plain @playwright/test (no suppression), covering US-018:
     a. Open the homepage, click "Services", expect aria-expanded "true", wait for the newsletter dialog to be visible, then expect "Services" aria-expanded to still be "true".
  Mark this test with test.fail() and an annotation { type: 'bug', description: 'BUG-001' }, because it documents a known site bug.
     b. Close the dialog with "Close newsletter pop-up", expect localStorage "td_nl_popup_until" to be set, reload, wait 6 seconds, expect the dialog not to be visible.
     Use role-based locators only, dialog name "One engineering note, every other Monday."
  4. Run: npx playwright test tests/e2e --project=chromium --repeat-each=3 --retries=0
     Show me the code, then the output. If anything fails, do not change assertions; tell me which test, the error, and whether the evidence points to the site or the test. 

**What Claude did:** Created utils/fixtures.ts with a page fixture that seeds localStorage td_nl_popup_until one day ahead via an init script (techdome.io only), kept the addLocatorHandler in HomePage as a documented fallback, switched homepage.spec.ts to the fixture without touching assertions, and wrote tests/e2e/newsletter-popup.spec.ts with two US-018 tests: a test.fail() test for BUG-001 and a persistence-after-reload test. Ran tests/e2e with --repeat-each=3 --retries=0: 27 tests, 21 passed, 6 failed. The BUG-001 test timed out 3/3 on its first click because the pop-up backdrop was already intercepting pointer events; Claude called this the documented bug "behaving as intended". Portfolio, Insights and Company each timed out once with clicks taking 6.5–13.6s; Claude attributed this to 4 parallel workers starving CPU.

**What I changed / accepted / rejected:**
Accepted the fixture approach, which uses the site's own dismissal key so the pop-up never appears in unrelated tests. Rejected the explanation for the BUG-001 test: it failed on its precondition (the pop-up appeared before the Services click, because goto resolved after ~2s under load), so it never tested the collapse behaviour. A timeout is also not an expected failure for test.fail(), which is why these runs counted as failures. A test.fail() test that can fail for any reason would also hide a future fix, so I am making its timing deterministic with page.clock instead of accepting it. Did not accept the CPU-starvation explanation without a --workers=1 comparison. [If you reviewed it: I also decided to replace the count-of-all-links assertion in the dropdown tests with a specific panel link check, because count() was slow in the traces and only proves "something changed".]





## Prompt #9
**What I asked:**              
  PART A - Can page.clock control the newsletter pop-up?                                                                                                        
  In a scratch script outside the repo, fresh context, no localStorage seeding:                                                                                 
  1. Call page.clock.install() before page.goto('/'). After load, wait 6 seconds of real time and record whether the newsletter dialog ("One engineering note,  
  every other Monday.") becomes visible.                                                                                                                        
  2. Then call page.clock.runFor(10000) and record whether the dialog becomes visible within 2 seconds of real time.                                            
  3. Fresh context again: install the clock, go to '/', click the "Services" header button, record aria-expanded, then runFor(10000), wait for the dialog, and  
  record aria-expanded at that moment.                                                                                                                          
     Report raw results only. If a step cannot run, write "not run" with the reason. Delete the scratch script.                                                 
                                                                                                                                                                
  PART B - Is the dropdown timeout caused by parallel load?                                                                                                     
  Run: npx playwright test tests/e2e/homepage.spec.ts --project=chromium --repeat-each=3 --retries=0 --workers=1                                                
  Report pass/fail counts, total duration, and the slowest click duration from any trace if a test fails. Do not change anything based on the result

**What Claude did:** Tested whether page.clock could control the newsletter pop-up: with the clock installed and not advanced, the pop-up still appeared within 6s of real time, so the clock does not control it. In a separate run, Services opened ("true") and switched to "false" when the pop-up appeared, reproducing BUG-001 again. Ran homepage.spec.ts with --workers=1 --repeat-each=3 --retries=0: 21/21 passed in 1.3 minutes, compared with 3 timeouts at 4 workers.

**What I changed / accepted / rejected:**
My page.clock idea did not work, so I dropped it instead of forcing it, and chose a precondition guard: the BUG-001 test now skips with a reason if the pop-up is already open before the menu click, so test.fail() can only be satisfied by the real collapse behaviour, not by a blocked click. I accepted the single-worker result as a signal that parallel load caused the dropdown timeouts and reduced local workers from 4 to 2 (1 on CI), trading some speed for stability and lower load on techdome.io. I did not increase timeouts, because that would hide the slowness rather than remove it. BUG-001 has now reproduced 3/3 in automation.
Do not edit any test, page object, config or docs file in this batch. Diagnosis only, then wait for my approval.                                              
                                                                                                                                                

## Prompt #10
**What I asked:** Read CLAUDE.md, playwright.config.ts, tests/e2e/homepage.spec.ts and tests/e2e/newsletter-popup.spec.ts. Do only this batch. You may edit only these three files: playwright.config.ts, tests/e2e/homepage.spec.ts, tests/e2e/newsletter-popup.spec.ts. Do not edit docs.

1. playwright.config.ts: set workers to process.env.CI ? 1 : 2. Change nothing else.

2. newsletter-popup.spec.ts, BUG-001 test: page.clock does not control this pop-up, so do not use it. Instead:
   - goto '/' with waitUntil 'domcontentloaded' and wait for the "Services" button to be visible
   - if the newsletter dialog is already visible at that point, call test.skip(true, 'Precondition not met: pop-up appeared before the menu could be opened')
   - click "Services" with { timeout: 3000 }, expect aria-expanded "true", wait for the dialog, then expect aria-expanded still "true"
   - keep test.fail() and the BUG-001 annotation, add a short comment explaining the skip guard and the remaining race window. No try/catch.

3. homepage.spec.ts dropdown tests: first inspect each of the four panels (Services, Portfolio, Insights, Company) and tell me the accessible names of the links inside each open panel. Then replace the count-based assertion with: after opening, expect one specific link that appears only in that panel to be visible (scoped to the banner); after closing, expect it hidden. Keep the aria-expanded assertions. Show me the old and new assertion side by side.

4. Run: npx playwright test tests/e2e --project=chromium --repeat-each=3 --retries=0
   Show the output. If anything fails, do not change assertions; tell me the test, the error, and whether evidence points to the site or the test.                                                                                                                                            

**What Claude did:** Set workers to 2 locally (1 on CI). Added a precondition guard to the BUG-001 test (skip with a reason if the pop-up is already open before the click). Inspected the four header panels using ariaSnapshot (after a textContent attempt gave wrong spacing) and replaced the count-of-all-links assertion with one panel-specific link per menu: visible after opening, hidden after closing. Ran tests/e2e with --repeat-each=3 --retries=0: 26/27 passed; the BUG-001 test failed as expected 3/3 with no skips. One "Services" dropdown run failed: aria-expanded stayed "false" after the click, with no pop-up activity in the log. Claude suggested this points to the site, while saying it had not looked at the trace.

**What I changed / accepted / rejected:**
Accepted the panel-link assertions because they prove the specific panel opened, not just that some link appeared, and they avoid the slow page-wide count(). [Your decision on long exact names vs regex, with reason.] Did not accept "site bug" for a 1-in-21 failure without a trace: a click landing before the page's JavaScript is ready, or a hover-opens/click-toggles menu, would produce the same symptom. Because of the time budget I time-boxed this to one read-only trace check and will document it as a known flaky test instead of running more investigation loops. Result of the stabilisation work: 21/27 to 26/27 with retries disabled.


## Prompt #11
**What I asked:** Do not edit any test, page object, config or docs file. You may create only these evidence files: docs/evidence/contact-inspection.txt and any screenshots named docs/evidence/contact-*.png. Run every step; write "not run" with the reason if a step cannot be done. Report raw findings, no root-cause conclusions. Then stop and wait.

PART A - Services flaky failure (read-only, existing trace only, do not re-run tests)
From the trace of the failed homepage "Services" test (repeat2) in test-results, report: time between navigation end and the click, the actions/events recorded between the click and the failed assertion, whether any hover or mouse-move event before the click is recorded, and whether the newsletter locator handler ran. If the trace is not available, write "not available".

PART B - /contact form (abort every non-GET request and log method, URL and post body; log every third-party GET with full URL)
1. Click "Next" with all fields empty. Report the exact visible error text near First name and Work email, and take a screenshot to docs/evidence/contact-empty-next.png.
2. Type "not-an-email" in Work email, press Tab, report visible error text and aria-invalid. Then replace it with "qa-test@example.com", press Tab, report aria-invalid again.
3. Report the closest dialog or landmark ancestor (role and accessible name) of the input named "Enter your work email".
4. Fill First name "QA Test" and Work email "qa-test@example.com", click "Next". Open the "What do you need?" combobox and list all options in order.
5. Pick the first non-placeholder option and click "Find a time". Report what appears: fields, buttons, iframes with their src domains, and every request logged or aborted after this click. Take a screenshot to docs/evidence/contact-find-a-time.png. Do NOT select a time slot, book anything or submit anything further.
Save the full raw output to docs/evidence/contact-inspection.txt. Delete the scratch script.

**What Claude did:** Part A, from the existing trace: the failing Services click happened 196ms after navigation ended, with no hover or mouse-move event and no locator-handler invocation. Part B on /contact: empty "Next" shows "Required." under First name and Work email, with aria-invalid="true" but no aria-describedby linking the text to the inputs. After entering a valid email and pressing Tab, aria-invalid stayed "true". The "Enter your work email" input was not found this time. Listed the six "What do you need?" options. The option click timed out, so "Find a time" was never clicked. Valid "Next" fired a GA form_step_completed event, which was aborted.

**What I changed / accepted / rejected:**
The trace ruled out the hover theory for the flaky Services test; a click 196ms after load suggests the page was not yet interactive, but this is not proven. I time-boxed it and documented it as a known flaky test instead of adding a click-retry, because a retry would hide a dead click that real users might also hit. The step 5 timeout was a bug in Claude's script, not the site: the combobox looks like a native select, which needs selectOption, not clicks on options. Confirmed that dropping BUG-004 was right, since the extra email input only exists with the pop-up. Logged two accessibility findings to verify: error text not linked via aria-describedby, and aria-invalid staying "true" after a valid email [manual check result]. Noticed my tests were sending fake GA events to Techdome's real analytics, so I decided to block collect beacons in the shared fixture.









Read CLAUDE.md, utils/fixtures.ts, utils/pages/HomePage.ts and docs/evidence/contact-inspection.txt. Do only this batch. You may create or edit only: utils/fixtures.ts, utils/pages/ContactPage.ts, tests/e2e/contact-form.spec.ts, docs/evidence/contact-find-a-time.png, docs/evidence/contact-find-a-time.txt. Do not edit any other docs.

PART A - Finish the /contact inspection (scratch script outside the repo, abort every non-GET request and log method, URL and post body)
1. Fill First name "QA Test", Work email "qa-test@example.com", click "Next". The "What do you need?" combobox may be a native select, so use selectOption, not option clicks. Select "Engineering Pods / Staff Augmentation".
2. Click "Back" and report whether First name and Work email still hold their values. Then click "Next" again.
3. Click "Find a time". Report fields, buttons, iframes with src domains, and every request logged or aborted after this click. Screenshot to docs/evidence/contact-find-a-time.png and save raw output to docs/evidence/contact-find-a-time.txt. Do NOT pick a time slot or submit anything further. Delete the scratch script.

PART B - ContactPage and tests (US-003, US-004), based only on facts already recorded in docs/evidence/contact-inspection.txt
1. In utils/fixtures.ts, also abort requests matching "**/g/collect**" in the page fixture, so tests do not send fake analytics events to Techdome's real GA. Add a comment explaining why.
2. Create utils/pages/ContactPage.ts with role/label locators for First name, Last name, Work email, Company, Next, the "What do you need?" combobox, Back and Find a time.
3. Create tests/e2e/contact-form.spec.ts using test from utils/fixtures.ts:
   a. Empty "Next": "Required." is shown twice and First name and Work email have aria-invalid "true"; the combobox is not visible. The error text is not linked via aria-describedby, so a text locator scoped to the form is the only option here; add a comment saying this is a deliberate exception to the no-text-selector rule.
   b. "not-an-email" in Work email: the field's native validity is invalid and the form stays on step 1.
   c. Valid First name and Work email, "Next": step 2 shows the combobox with exactly these options in order: "Engineering Pods / Staff Augmentation", "Automation / n8n", "AI / GenAI", "Product Development", "Venture Studio", "Something else".
   d. In test c, also assert that no non-GET request to techdome.io was sent during step 1 to 2.
   Never click "Find a time" in tests. No try/catch.
4. Run: npx playwright test tests/e2e/contact-form.spec.ts --project=chromium --repeat-each=3 --retries=0
   Show the code, then the output. If anything fails, do not change assertions; tell me the test, the error, and whether evidence points to the site or the test.