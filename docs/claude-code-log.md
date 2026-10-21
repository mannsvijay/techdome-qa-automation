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
Accepted the story map as written at this point — my notes were thin, so I let Claude work directly from them rather than second-guessing stories I hadn't tested yet. I did come back to several of these later once real test evidence existed (US-001's header items turned out to be dropdowns, not links; US-004/US-009's "Next" turned out to trigger no request at all; see Prompt #24 for the full correction pass).


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
This experiment separated the two explanations I had for the dropdown failures. My own hypothesis (the locator handler's close click acting as an outside click) was wrong: the pop-up collapses the open menu as soon as it appears, so this is a real site bug and I rewrote BUG-001 with these steps. Claude's original "site bug" label was partly right, but it had no evidence at the time and also blamed failure shape 1, which did not reproduce in sequential runs. I worked out that td_nl_popup_until is set 14 days ahead, so dismissal is remembered; I lowered BUG-001 to Medium because only first visits are affected, and used this key to suppress the pop-up in tests instead of racing it. B1 decision: no element named "Book call" was found at the 1280px viewport this check used, so I did not drop BUG-003 yet — flagged it as unconfirmed pending a check at other viewports rather than conclude it doesn't exist (resolved later in Prompt #16: it does exist, but only at the 375px header, as the mobile label for the same /contact link — not a duplicate).



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
Accepted the fixture approach, which uses the site's own dismissal key so the pop-up never appears in unrelated tests. Rejected the explanation for the BUG-001 test: it failed on its precondition (the pop-up appeared before the Services click, because goto resolved after ~2s under load), so it never tested the collapse behaviour. A timeout is also not an expected failure for test.fail(), which is why these runs counted as failures. A test.fail() test that can fail for any reason would also hide a future fix, so I am making its timing deterministic with page.clock instead of accepting it. Did not accept the CPU-starvation explanation without a --workers=1 comparison. Not yet — I noted the count-of-all-links assertion only proves "something changed", not that the right panel opened, but held off changing it until I had real trace data showing it was also slow; that data and the actual swap to a panel-specific link happened in Prompt #10.





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
Accepted the panel-link assertions because they prove the specific panel opened, not just that some link appeared, and they avoid the slow page-wide count(). Kept the exact full link names Claude found (e.g. "MVP development for startups", "View Our products overview") instead of switching to short regex fragments: a short fragment like "Venture Studio" also appears in the logo's accessible name ("Techdome Venture Studio — home"), so a loose regex would have reintroduced the exact ambiguity the panel-specific check was meant to remove. Did not accept "site bug" for a 1-in-21 failure without a trace: a click landing before the page's JavaScript is ready, or a hover-opens/click-toggles menu, would produce the same symptom. Because of the time budget I time-boxed this to one read-only trace check and will document it as a known flaky test instead of running more investigation loops. Result of the stabilisation work: 21/27 to 26/27 with retries disabled.


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
The trace ruled out the hover theory for the flaky Services test; a click 196ms after load suggests the page was not yet interactive, but this is not proven. I time-boxed it and documented it as a known flaky test instead of adding a click-retry, because a retry would hide a dead click that real users might also hit. The step 5 timeout was a bug in Claude's script, not the site: the combobox looks like a native select, which needs selectOption, not clicks on options. Confirmed that dropping BUG-004 was right, since the extra email input only exists with the pop-up. Logged two accessibility findings to verify: error text not linked via aria-describedby, and aria-invalid staying "true" after a valid email — the first held up under later checking (BUG-004), the second did not reproduce once I actually tested it with a blur in between (see Prompt #22: it correctly returned to "false"). Noticed my tests were sending fake GA events to Techdome's real analytics, so I decided to block collect beacons in the shared fixture.




## Prompt #12
**What I asked:** Read CLAUDE.md, utils/fixtures.ts, utils/pages/HomePage.ts and docs/evidence/contact-inspection.txt. Do only this batch. You may create or edit only: utils/fixtures.ts, utils/pages/ContactPage.ts, tests/e2e/contact-form.spec.ts, docs/evidence/contact-find-a-time.png, docs/evidence/contact-find-a-time.txt. Do not edit any other docs.

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

**What Claude did:** Finished the /contact inspection: confirmed "What do you need?" is a native select (selectOption works); "Back" keeps First name and Work email values; "Find a time" does not submit or call the network, but reveals four more fields on the same panel ("What are you looking to build or staff?" with an immediate "Required." error, plus Team size needed, Timeline and Budget range selects). Added GA collect-beacon blocking to the shared fixture, created ContactPage.ts and contact-form.spec.ts with three tests. Run: 6/9 passed; test c failed 3/3 because the select has a "Select…" placeholder not in my expected list. Claude identified this as a test bug.

**What I changed / accepted / rejected:**
Accepted Claude's diagnosis: the placeholder is normal, and the "six options" fact I gave came from an inspection that read the accessibility tree, which did not show it. Lesson: "use only recorded facts" is only as good as how the facts were recorded. Instead of removing the placeholder from the assertion, I asked for it to be asserted as the first, default-selected option, which is a stronger check. Rejected the exact:false label locators because "Work email" could also match the newsletter input "Enter your work email"; asked for anchored regexes. Noted that "Find a time" is not the final submit, so the real submission request is still unknown, and that showing "Required." on a field the user has not touched yet is a UX bug candidate I wanted verified manually before logging it — confirmed later in Prompt #22 as BUG-008: the message really does appear immediately after one "Find a time" click, before the field is ever typed into.




## Prompt #13
**What I asked:** 
Read CLAUDE.md, utils/pages/ContactPage.ts, tests/e2e/contact-form.spec.ts and docs/evidence/contact-find-a-time.txt. Do only this batch. You may edit only utils/pages/ContactPage.ts and tests/e2e/contact-form.spec.ts, and create only docs/evidence/contact-submit-inspection.txt and docs/evidence/contact-submit-*.png. Do not edit any other docs.

PART A - Fix my test and locators
1. Test c: the select has a "Select…" placeholder. Assert that "Select…" is the first option and is the selected value by default, then assert the remaining options are exactly the six listed, in order. Do not drop the placeholder from the assertion.
2. ContactPage: replace exact:false label locators with anchored regexes (for example /^Work email/, /^First name/, /^Company/) so they cannot match the newsletter input "Enter your work email" or other labels. Add locators for "What are you looking to build or staff?", "Team size needed", "Timeline" and "Budget range".
3. Run: npx playwright test tests/e2e/contact-form.spec.ts --project=chromium --repeat-each=3 --retries=0 and show the output. Do not change assertions if something fails; explain.

PART B - Find the real submission request (scratch script outside the repo; abort EVERY non-GET request and log method, URL, headers content-type and full post body; also log every GET with a query string)
1. Fill step 1 with "QA Test" / "qa-test@example.com", Next, select "Engineering Pods / Staff Augmentation", click "Find a time".
2. Fill "What are you looking to build or staff?" with "QA automation test - please ignore", pick the first non-placeholder option in Team size needed, Timeline and Budget range, then click whatever button appears next. Report what happens, every request logged or aborted, and take a screenshot to docs/evidence/contact-submit-after-click.png.
3. If a calendar, iframe or booking screen appears, stop there and report its domain. Do NOT pick a time slot or click anything that books or submits outside the aborted request.
Save raw output to docs/evidence/contact-submit-inspection.txt. Delete the scratch script, then stop.


**What Claude did:** Fixed test c to assert "Select…" as the first, default-selected option followed by the six real options, and switched ContactPage label locators to anchored regexes, adding locators for the four step-2 fields. Contact spec run: 6/9; test d failed 3/3 because its check, url.includes('techdome.io'), also matched GA beacon URLs whose dl= parameter contains the page URL. Claude identified this as its own test bug and left the assertion unchanged as instructed. With all fields filled, "Find a time" sent POST https://techdome.io/api/leads with a JSON body (service, contact, answers, utm, attribution, landingPage, website). The request was aborted, and the page showed "We couldn't submit your request right now. Please try again." No calendar or iframe appeared.

**What I changed / accepted / rejected:**
Accepted the diagnosis of test d; the fix is to compare the request hostname, not substring-match the whole URL. This was a bug in code Claude wrote in Prompt #14 that I had not caught in review. The key outcome is that "Find a time", which my notes assumed opened a calendar, is actually the final submit. Because I aborted every non-GET request instead of blocking only known endpoints, no fake lead reached Techdome's sales team. I added a permanent /api/leads abort in the shared fixture so this cannot happen by accident later. Recorded the error banner as a positive finding and planned a mocked-500 test for it. Noted that "website": "" may be a honeypot field, but did not assert it. Decided security tests will only cover client-side behaviour for injection, since testing server-side sanitisation would mean sending real leads; this scope limit goes in the README.



## Prompt #14
**What I asked:** Read CLAUDE.md, utils/fixtures.ts, utils/pages/ContactPage.ts, tests/e2e/contact-form.spec.ts and docs/evidence/contact-submit-inspection.txt. Do only this batch. You may edit or create only: utils/fixtures.ts, utils/pages/ContactPage.ts, tests/e2e/contact-form.spec.ts, tests/integration/contact-submission.spec.ts, tests/integration/third-party-scripts.spec.ts, tests/integration/http-status.spec.ts. Do not edit docs.

SAFETY FIRST
1. In utils/fixtures.ts, add a default route that aborts every request to "**/api/leads", with a comment: this guarantees no real lead is ever sent, even if a test forgets to mock it. Tests that need the endpoint register their own route afterwards, which takes precedence.
2. Add a ContactPage method fillFullLead(data) that fills step 1, clicks Next, selects "What do you need?", clicks "Find a time" to reveal step 2 fields, and fills the requirement and the three selects. It must not click the final "Find a time".

E2E (tests/e2e/contact-form.spec.ts)
3. Fix test d: compare new URL(request.url()).hostname against techdome.io instead of substring-matching the full URL. Keep the assertion otherwise the same.
4. Add test e (error state): mock "**/api/leads" to return status 500, fill the full lead, click "Find a time", expect the alert or banner "We couldn't submit your request right now. Please try again." to be visible and the form to stay on the same step. Use a role locator for the banner if it has one (alert/status); if it has none, tell me before falling back to text.

INTEGRATION (use test from utils/fixtures.ts)
5. contact-submission.spec.ts (US-009): mock "**/api/leads" with status 200 and an empty JSON body, fill the full lead with fake data, click "Find a time", capture the request, and assert method POST, content-type application/json, and the body structure: service, contact.firstName/lastName/email/company, answers.requirement/teamSize/timeline/budget, utm, attribution, landingPage, website, with the values I filled. Before writing any assertion about what the UI shows after a successful response, run it once and tell me what appeared.
6. third-party-scripts.spec.ts (US-010): delay every request to googletagmanager.com by 5 seconds using page.route, load the homepage, and assert the hero heading is visible within 3 seconds of navigation start. Also report whether the GTM/gtag script tags have async or defer.
7. http-status.spec.ts: use the request fixture (no browser) to GET "/" and "/contact" and expect 200, and GET "/qa-test-page-that-does-not-exist" and expect 404. Do not call /api/leads directly.

8. Run: npx playwright test tests/e2e/contact-form.spec.ts tests/integration --project=chromium --repeat-each=2 --retries=0
   Show the code, then the output. If anything fails, do not change assertions; explain whether evidence points to the site or the test.

**What Claude did:** Added a default abort route for **/api/leads in the shared fixture, a ContactPage.fillFullLead() helper, the hostname fix for test d, an error-state test (mocked 500), and three integration specs: request payload for /api/leads (US-009), GTM delayed by 5s while the hero still renders within 3s (US-010), and HTTP status checks (/ and /contact return 200, a non-existent page returns 404). Before writing assertions it checked that a mocked 200 with "{}" shows the same error banner as a 500, and that GTM scripts are injected dynamically with async. Run: 14/18 passed. Two failures, both in its own locators: getByLabel(/^Company/) also matched the footer nav with aria-label "Company", and getByRole('alert') matched the empty Next.js route announcer instead of the error banner.

**What I changed / accepted / rejected:**
Accepted both diagnoses. The Company failure came from my own suggestion to use anchored regexes with getByLabel: I did not realise getByLabel also matches elements named by aria-label, like a nav landmark, so I switched inputs to getByRole('textbox'). For the alert, I questioned Claude's earlier pre-check: its "1 alert" was probably the route announcer, so it is still unknown whether the banner itself is announced to screen readers; I asked for that to be checked before fixing the test, since a missing role would be an accessibility bug. I did not treat "200 with {} shows the error banner" as a site bug: my mock probably did not match the response shape the site expects, so I asked Claude to read the site's JavaScript for the real success condition rather than guess. Positive findings recorded: no soft-404, and third-party scripts do not block the hero.



## Prompt #15
**What I asked:**  Read CLAUDE.md, utils/pages/ContactPage.ts, tests/e2e/contact-form.spec.ts and tests/integration/contact-submission.spec.ts. Do only this batch. You may edit only these three files and create only docs/evidence/contact-banner-role.txt. Do not edit other docs.

PART A - Fix my locators
1. ContactPage: use getByRole('textbox', { name: /^First name/ }) and the same pattern for Last name, Work email, Company and "What are you looking to build or staff?", so they cannot match landmarks like the footer nav "Company".
2. Before fixing test e, check (scratch script, mocked 500 on /api/leads, the fixture's GA and /api/leads blocking in place): list every element with role alert or status after the failed submission, with its id, aria-live and text. Tell me whether the visible error banner itself has role alert/status, or whether only the Next.js route announcer does. Save the raw output to docs/evidence/contact-banner-role.txt.
3. Fix test e based on that: if the banner has role alert, use getByRole('alert').filter({ hasText: "We couldn't submit" }). If it has no role, use a text locator scoped to the form with a comment explaining the exception, and tell me.

PART B - How does the site decide success? (read-only, no request to /api/leads)
4. Load /contact once and search the loaded first-party JavaScript for the code that handles the /api/leads response. Report the exact condition it uses to show success vs the error banner (for example res.ok plus a JSON field), quoting only the minimal relevant snippet. If you cannot find it, say "not found". Do not guess.
5. Only if the condition was found: add a test to contact-submission.spec.ts that mocks a response matching that condition and asserts what the UI shows after success (inspect what appears first, then assert it).

6. Run: npx playwright test tests/e2e/contact-form.spec.ts tests/integration --project=chromium --repeat-each=2 --retries=0
   Show the output. If anything fails, do not change assertions; explain.



**What Claude did:** Switched all ContactPage field locators to getByRole('textbox', { name: /^.../ }). Listed every role=alert/status element after a mocked 500 submission: the only alert was the empty Next.js route announcer; the visible error banner has no ARIA role or aria-live, and no form or landmark ancestor (saved to docs/evidence/contact-banner-role.txt). Fixed test e with a page-level text locator and a comment explaining the exception. Searched the site's loaded JavaScript and found the success condition: the response must be ok AND the JSON must have success: true; on success the form shows "Thank you, {first name}!" and opens a booking dialog. Added a mocked-success test asserting the "Thank you, QA!" heading. Run: 20/20 passed.

**What I changed / accepted / rejected:**
Questioning Claude's earlier "1 alert" pre-check turned a locator fix into a real accessibility finding: a failed submission is not announced to screen reader users. I logged it as a bug (Medium, because it is the failure path of the main lead form). Asking Claude to read the site's code instead of guessing a mock shape gave a verified success test, so valid submission is now covered without sending a real lead. From the result I noticed that "QA Test" was greeted as "Thank you, QA!", so the greeting keeps only the first word of the first name; logged as a Low candidate that may be intentional. I dropped my earlier bug idea that "Find a time" is a misleading label, because a booking dialog does open on success.
  





## Prompt #16
**What I asked:** Read CLAUDE.md, utils/fixtures.ts, utils/helpers.ts, utils/pages/HomePage.ts and docs/user-story-map.md (US-002, US-005, US-006, US-007, US-008). Do only this batch. You may edit or create only: utils/pages/HomePage.ts, tests/e2e/mobile-responsiveness.spec.ts, tests/e2e/footer-navigation.spec.ts, tests/e2e/ctas-and-external-links.spec.ts, tests/e2e/performance.spec.ts, and screenshots named docs/evidence/mobile-*.png. Do not edit other docs. Use test from utils/fixtures.ts everywhere.

RULE: first inspect the live site for each part and list what you observed, then write assertions only for what you observed. Never invent element names. If something looks broken (overflow, hidden nav, broken link), do not adjust the test to pass; keep the assertion, take a screenshot to docs/evidence/mobile-*.png where relevant, and report it.

1. Mobile (US-007, US-008), test.use viewport 375x812 and 768x1024 in separate describes:
   - homepage: no horizontal overflow (use assertNoHorizontalOverflow), hero heading visible
   - header: report whether Services/Portfolio/Insights/Company are hidden and a menu toggle button appears; report its role and accessible name. Then assert: the toggle is visible, opening it shows the nav items, closing it hides them (only if that is what you observed)
   - /contact: no horizontal overflow, First name field visible

2. Footer (US-002): scoped to contentinfo. Assert each footer section/nav landmark you find is present with at least one link. Collect all unique internal footer hrefs and check each with the request fixture SEQUENTIALLY (no parallel requests), expecting status < 400. Report the list and count. Social icons: report each one's accessible name and href; assert each has a non-empty accessible name and an href to the expected domain. Never request third-party URLs.

3. CTAs and external links (US-005, US-006, US-016): read hrefs only, do not navigate to any third-party site. Assert the header "Contact Us" link points to /contact. For every external link on the homepage, report text/name, href domain, target and rel; assert links with target="_blank" have rel containing "noopener". Report where any "Book call" link or button exists (any page section, any viewport); if none exists, say so.

4. Performance: on the homepage, record Largest Contentful Paint with a PerformanceObserver, attach the value to the test report, and log it. Do not assert a threshold.

5. Run: npx playwright test tests/e2e/mobile-responsiveness.spec.ts tests/e2e/footer-navigation.spec.ts tests/e2e/ctas-and-external-links.spec.ts tests/e2e/performance.spec.ts --project=chromium --repeat-each=2 --retries=0
   Show the observations list first, then the code, then the output. If anything fails, do not change assertions; tell me the test, the error and whether evidence points to the site or the test.



**What Claude did:** Inspected the live site before writing assertions. At 375x812 and 768x1024: no horizontal overflow on the homepage or /contact; header menu buttons are replaced by an "Open navigation" toggle that opens a full-screen "Site Navigation" dialog. Footer: four nav landmarks (Services 9, Industries 8, Products 8, Company 9 links); 39 unique internal hrefs checked sequentially; five named social links. All 15 external homepage links use target="_blank" with rel="noopener noreferrer" or are mailto/tel. "Book call" exists only at 375px, in the header, pointing to /contact. LCP was about 1.3–1.5s. Wrote four spec files and HomePage mobile locators. Run: 32/36; the "closing the menu hides the nav items" test failed at both widths because an SVG inside the mobile-nav dialog intercepted the click. Claude called this a site bug.

**What I changed / accepted / rejected:**
Did not accept the site-bug verdict. The error says the interceptor belongs to the dialog, and the inspection showed the dialog has its own "Close navigation" button; the test was clicking the header toggle, which the full-screen dialog covers. A real user taps the visible X inside the dialog, so I asked for the test to target that button, and checked it manually at 375px myself: the dialog's own X does close it cleanly. Resolved the "Book call" question with evidence: it is the mobile label for the same /contact link that desktop shows as "Contact Us" (confirmed "Contact Us" takes over at 768px and wider), never shown together, so I removed BUG-003 and kept it as an observation; my original note that both appear in the header was wrong. Recorded positive findings for the README: no mobile overflow, no broken footer links, noopener on all external links, LCP well under 2.5s.







## Prompt #17
**What I asked:**  Read CLAUDE.md, utils/fixtures.ts, utils/pages/HomePage.ts, utils/pages/ContactPage.ts and tests/e2e/mobile-responsiveness.spec.ts. Do only this batch. You may edit or create only: utils/pages/HomePage.ts, tests/e2e/mobile-responsiveness.spec.ts, tests/security/headers.spec.ts, tests/security/injection.spec.ts, tests/security/sensitive-data.spec.ts, and docs/evidence/security-*.txt. Do not edit other docs. Use test from utils/fixtures.ts.

PART A - Mobile close test
1. The interceptor in the failure is inside the mobile-nav dialog, and the dialog has its own "Close navigation" button. Check whether clicking the dialog's own button (scoped to the "Site Navigation" dialog) closes it at 375 and 768. Report the result. If it works, change only which button the test clicks and add a comment why; keep the "nav items hidden after close" assertion. If it also fails, do not work around it; report it.

PART B - Security (inspect and report first, then assert; do not weaken assertions to make them pass)
2. headers.spec.ts: with the request fixture, GET "/" and "/contact". Report all response headers to docs/evidence/security-headers.txt. Assert presence of Strict-Transport-Security, Content-Security-Policy, and either X-Frame-Options or a CSP frame-ancestors directive. Attach X-Content-Type-Options, Referrer-Policy and Permissions-Policy values to the report for information, without asserting them.
3. injection.spec.ts: the /api/leads fixture abort stays in place. Test two payloads in First name, one at a time: <script>alert(1)</script> and <img src=x onerror=alert(1)>. Mock /api/leads with the site's real success shape ({ success: true, contactId, bookingToken }), fill the full lead, click "Find a time". Assert: no page dialog event fires, no injected <script> or <img> element with that content exists in the DOM, and the confirmation heading shows the payload as literal text if it appears. Capture the request body and report whether the client sends the raw payload or sanitises it. Add a comment that server-side sanitisation is out of scope because it would require sending real leads.
4. sensitive-data.spec.ts: load "/" and "/contact" in the browser, collect the HTML and the bodies of all first-party responses (techdome.io, JSON and JS). Scan for: email addresses, AWS keys (AKIA...), Google API keys (AIza...), Stripe keys (sk_live_/pk_live_), GitHub tokens (ghp_), JWTs (eyJ... with two dots), private key headers (-----BEGIN), and "Bearer " tokens. Save all matches with source URL to docs/evidence/security-sensitive-scan.txt. Assert zero matches for the secret patterns. For emails: assert every email found also appears as a visible mailto link or visible text on the page; an email only present in source or network data must fail. Treat the GA (G-...) and GTM (GTM-...) IDs as public and do not flag them.

5. Run: npx playwright test tests/e2e/mobile-responsiveness.spec.ts tests/security --project=chromium --repeat-each=2 --retries=0
   Show the findings first, then the code, then the output. If anything fails, do not change assertions; tell me the test, the error, and whether evidence points to the site or the test.

**What Claude did:** Confirmed the mobile-nav dialog has its own "Close navigation" button and that clicking it closes the dialog at 375px and 768px; switched the test to that button. Inspected security before asserting: HSTS, X-Frame-Options (SAMEORIGIN), X-Content-Type-Options, Referrer-Policy and Permissions-Policy are present on / and /contact, but Content-Security-Policy is missing on both. Neither injection payload executed or was injected into the DOM; the client sends the raw payload to /api/leads, and the "Thank you" heading showed "<img" because the site uses firstName.split(' ')[0]. Sensitive-data scan: zero secret-pattern matches across 54 first-party responses; one visible email; "you@company.com" found only in a JS bundle. Moved the evidence write before the assertions after noticing the headers file was not saved when the test failed. Run: 24/28; failures were the missing CSP and the you@company.com rule.

**What I changed / accepted / rejected:**
Accepted the dialog-button fix, but corrected Claude's code comment calling the header toggle "confirmed broken": it is simply covered by the full-screen dialog while open, which is normal modal behaviour, not a bug. Accepted missing CSP as a real finding (BUG-002, Medium: the site collects lead data and loads third-party scripts, though its other headers are good). The you@company.com failure was a gap in my own rule ("emails only in source must fail"), which did not consider placeholder text; I asked for that single address to be allowlisted only after confirming in the bundle that it is a placeholder, instead of loosening the rule. The injection result also confirmed BUG-005 (greeting uses only the first word of the first name) from the site's own code. Accepted the change to write evidence before asserting.







## Prompt #18
**What I asked:** Read CLAUDE.md, playwright.config.ts, utils/fixtures.ts, tests/security/headers.spec.ts and tests/security/sensitive-data.spec.ts. Do only this batch. You may edit or create only: playwright.config.ts, tests/security/headers.spec.ts, tests/security/sensitive-data.spec.ts, tests/load/load.spec.ts, docs/load-test-results.md. Do not edit other docs.

PART A - Small fixes
1. sensitive-data.spec.ts: first confirm in the JS bundle that "you@company.com" is used as an input placeholder (quote the minimal snippet). If confirmed, add an explicit allowlist containing only that address, with a comment explaining it is the newsletter input's placeholder text, not a leaked address. Do not loosen the rule for any other email. If not confirmed, leave the test unchanged and tell me.
2. headers.spec.ts: mark the test with test.fail() and the annotation { type: 'bug', description: 'BUG-002: Content-Security-Policy missing on / and /contact' }. Keep all assertions and the report-before-assert order.

PART B - Load test (US-014). Hard rule: never more than 5 concurrent users.
3. playwright.config.ts: add a second project "load" that matches only tests/load/**, uses retries: 0, and has dependencies: ['chromium'], so it runs only after all other tests have finished and never alongside them. Make the chromium project ignore tests/load/**. Tell me what happens to the load project if a chromium test fails, and confirm the installed Playwright version supports this.
4. tests/load/load.spec.ts: one test. const USERS = 5 with expect(USERS).toBeLessThanOrEqual(5) as the first line. Create exactly 5 request contexts (request.newContext with the baseURL) and run them with Promise.all. Each user does 3 rounds of GET "/" then GET "/contact", sequentially within that user (5 users x 2 pages x 3 rounds = 30 requests total). Record each request's duration in ms and status. Compute min, avg, p50, p95, max per page and overall, and the count of each status code.
5. Write docs/load-test-results.md from the test BEFORE any assertion: date/time, users, rounds, total requests, a per-page and overall timing table, status counts, that this measures HTML document response time (not full page render or assets), and PASS/FAIL against p95 < 3000 ms and zero 5xx. Then assert p95 < 3000 and zero 5xx. Dispose all contexts.

6. Run: npx playwright test tests/security --project=chromium --retries=0, then npx playwright test --project=load
   Show the code, the config diff, the output, and the generated docs/load-test-results.md. If anything fails, do not change assertions; explain.

**What Claude did:** Confirmed in the JS bundle that you@company.com is the placeholder of the newsletter input and allowlisted only that address. Marked the headers test with test.fail() and a BUG-002 annotation. Added a "load" project (tests/load only, retries 0, dependencies: ['chromium']) and made chromium ignore tests/load, on Playwright 1.64.1. Wrote the load test: 5 request contexts via Promise.all, each doing 3 rounds of GET / then GET /contact (30 requests), writing docs/load-test-results.md before asserting. The security run found a new placeholder, name@company.com (booking dialog guest field), in a chunk that had not loaded before, so the sensitive-data test failed. Running --project=load triggered the chromium project first; because of that failure the load test was skipped. Claude then ran it with --no-deps: 30/30 status 200, overall p95 899ms, PASS. A GTM-delay test was flaky (13.6s on the first attempt, passed on retry).

**What I changed / accepted / rejected:**
I reviewed load.spec.ts line by line for the hard limit: USERS is fixed at 5, exactly 5 contexts run in parallel, and each user's requests are sequential — confirmed after reading: the inner loop awaits each request before starting the next, so a single user never has two requests in flight at once, and Promise.all only ever runs across the 5 users, never more. I kept the dependency on the chromium project even though a functional failure skips the load test, because it guarantees the load test never runs alongside other tests and pushes concurrency above 5; I documented --no-deps for running it alone. The name@company.com failure showed that a per-address allowlist is fragile when chunks load non-deterministically, so I replaced it with a rule: emails used only as placeholder values are UI hints, not data, while every other email must still be visible. I rewrote the flaky third-party test to assert ordering (hero visible before any delayed GTM response is released) instead of a 3-second wall-clock limit that depends on my machine. Noted that 30 requests is a small sample for p95, chosen deliberately to respect the 5-user limit.





// 19 
## Prompt #19
**What I asked:** Read CLAUDE.md, playwright.config.ts, tests/security/sensitive-data.spec.ts and tests/integration/third-party-scripts.spec.ts. Do only this batch. You may edit only these two spec files. Do not edit docs or any other file.

1. sensitive-data.spec.ts: replace the per-address allowlist with a context rule. An email is skipped from the visibility assertion only if every occurrence in source is the value of a placeholder attribute (placeholder:"..." or placeholder="..."). Keep listing skipped emails in docs/evidence/security-sensitive-scan.txt marked "PLACEHOLDER (not asserted)". Any email that appears anywhere outside a placeholder must still be visible on the page or the test fails. Add a comment explaining the rule.

2. third-party-scripts.spec.ts: remove the 3-second wall-clock assertion. Instead, delay every googletagmanager.com request by 5 seconds, record when the first delayed response is released, and assert that the hero heading is visible BEFORE any delayed GTM response has been released. Keep the async/defer note in the comment.

3. Run the suite exactly as a reviewer would, with the default config: npx playwright test
   Report: total tests per project, passed, failed, flaky, skipped, expected failures (test.fail) with their bug annotations, whether the load project ran, and total duration. If anything fails, do not change assertions; tell me the test, the error and whether evidence points to the site or the test.

**What Claude did:** Replaced the per-address email allowlist with a context rule: an email is skipped only if every occurrence in source is a placeholder attribute value; both you@company.com and name@company.com are now reported as "PLACEHOLDER (not asserted)". Rewrote the third-party test to delay GTM by 5s and assert the hero is visible before the first delayed GTM response is released, instead of a 3-second wall-clock limit. Ran the suite with the default config (npx playwright test): 44 passed (43 chromium + 1 load), 0 failed, 0 flaky, 0 skipped; the BUG-001 and BUG-002 tests failed as expected; the load project ran after chromium; 2.0 minutes. Load p95 was 893ms with all 200s.

**What I changed / accepted / rejected:**
Accepted both changes after reading them: the placeholder rule still fails any email that appears outside a placeholder, so it fixes the false positive without loosening the check, and the ordering assertion tests what "non-blocking" actually means rather than how fast my laptop is. Noted one edge case I chose not to fix: if GTM ever stops loading, the third-party test would time out instead of failing with a clear message. Also noted that the load and security tests rewrite files under docs/ on every run, which I will explain in the README. This is the first fully green run as a reviewer would execute it, so my next step is a fresh-clone check outside my working folder.



## Prompt #20
**What I asked:** Do not edit any test, page object, spec or docs file. You may edit only package.json and .gitignore, and only if a step below requires it; show me the diff.

1. Check .gitignore covers node_modules, test-results, playwright-report and blob-report. Report what is missing.
2. In package.json, add "postinstall": "playwright install chromium" so a reviewer's npm install also installs the browser. Add a "test" script "playwright test". Show the diff.
3. Commit nothing yourself. Tell me when step 2 is done and wait for me to push.

After I push, do this:
4. Clone https://github.com/mannsvijay/techdome-qa-automation into C:\dev\techdome-fresh (outside OneDrive). In that folder run: npm ci, then npx playwright test. Report every command's result, total tests per project, passed, failed, flaky, expected failures, and duration.
5. Run npx tsc --noEmit in the fresh clone and report any type errors (do not fix them).
6. Read .github/workflows/playwright.yml and tell me what it does: when it triggers, which browsers it installs, and whether it would run the load test on every push against the live site. Do not change it.
7. Delete C:\dev\techdome-fresh at the end.

**What Claude did:** Checked .gitignore: node_modules, test-results, playwright-report and blob-report were already covered, so no change was needed. Added two scripts to package.json: "test": "playwright test" and "postinstall": "playwright install chromium". Stopped without committing, as instructed, until I pushed — steps 4 to 7 (fresh clone, npm ci, npx playwright test, npx tsc --noEmit, reading the CI workflow, cleanup) were left for the next prompt once I'd actually pushed, rather than guessed at results it couldn't have yet.

**What I changed / accepted / rejected:**
I asked for the postinstall script because the assignment says the reviewer will run npx playwright test from a fresh clone, and without a browser installed that command fails even when the tests are correct; this way npm install prepares everything. I kept commits in my own hands so I could review the diff before it reached GitHub. I ran the check outside my OneDrive folder to rule out "works on my machine" issues from local state such as cached browsers or unignored files. I deferred both the type-error decision and the CI-workflow decision until the fresh-clone results actually came back in the next prompt, rather than guess now — see Prompt #21 for what I decided once I had real numbers to react to.


## Prompt #21
**What I asked:** Pushed. Continue with steps 4 to 7 exactly as written. Do not edit any file in the fresh clone or in my working folder.

**What Claude did:** Confirmed .gitignore already covered node_modules, test-results, playwright-report and blob-report, and added "test" and "postinstall": "playwright install chromium" scripts to package.json. After I pushed, it cloned the repo into C:\dev\techdome-fresh outside OneDrive: npm ci installed 5 packages with 0 vulnerabilities and the postinstall installed Chromium; npx playwright test passed 44/44 (43 chromium + 1 load) with BUG-001 and BUG-002 failing as expected, 0 flaky, in 1.8 minutes, the same as locally. npx tsc --noEmit did not type-check anything because the repo has no tsconfig.json and no typescript dependency. The CI workflow runs on every push and pull request to main, installs all browsers, and runs the full suite including the load test against the live site. It also found three stray screenshot files with mangled path names in the repo root, left over from one of its own earlier scripts. Deleted the fresh clone.

**What I changed / accepted / rejected:**
The fresh-clone run proves the reviewer's single command works, which was the main goal. I removed the stray screenshots myself; they came from a path mistake in a Claude script that I had committed without checking the file list, so I now review git status before each commit. I changed the CI workflow to manual trigger only and Chromium only: running the full suite and load test against Techdome's production site on every push was unnecessary load, even within the 5-user limit, and I had not noticed my earlier pushes were triggering it. Type-check: skipped and documented in README (there's no tsconfig.json in this repo, so Playwright compiles the TypeScript without ever type-checking it, and adding a real project-wide check was outside this assignment's time budget).



## Prompt #22
**What I asked:** Do not edit any test, page object, config, or docs file except creating the evidence files named below. Read-only against the site: abort every non-GET request; never send anything to /api/leads except through a mocked route. Report raw findings; write "not confirmed" when the evidence does not show the issue. (1) BUG-005: mock /api/leads with a success response, submit with First name "Mary Ann", screenshot the greeting and save the heading text and JS snippet. (2) BUG-006: save document.title and og:title for /contact. (3) BUG-007: screenshots and aria-invalid/visible error before and after correcting the Work email. (4) BUG-008: screenshot after one "Find a time" click and record whether "Required." shows before typing. (5) Blog dates: list every card's title and date and screenshot the section. Delete scratch scripts and report each item as confirmed or not confirmed.

**What Claude did:** Created evidence files for five open bug candidates without sending any real lead. BUG-005: heading read "Thank you, Mary!" for First name "Mary Ann": **confirmed**. BUG-006: tab title "Contact Us | Techdome" vs og:title "Talk to an Architect: 30-Minute Scoping Call | Techdome": **confirmed**. BUG-007: after a valid email and blur, aria-invalid was "false" and no visible error remained: **not confirmed** (this reproduction didn't show the sticky-true behaviour I'd seen before). BUG-008: "Required." was visible before typing: **confirmed**. Blog dates: all 8 cards showed the identical date "Oct 15, 2026": **confirmed**.

**What I changed / accepted / rejected:**
I opened every screenshot myself before using it. Kept: BUG-005 (greeting truncation), BUG-006 (title mismatch), BUG-008 (premature "Required."), and the blog-dates finding — all four had evidence that actually showed the issue. Dropped: the "aria-invalid stays true" claim — under this exact reproduction (type invalid, blur, retype valid, blur) it correctly returned to "false"; it had only stayed "true" in an earlier session under a different precondition (an empty-submit click first), and without a test asserting that exact precondition I wasn't willing to log it as confirmed. I did not do a separate manual BUG-001 check in Chrome this round — Prompts #9–#11 had already reproduced that one 3/3 in automation with trace evidence, so a manual repeat wouldn't have added anything new.

---

## Prompt #23
**What I asked:** Read docs/evidence/ (all files) and the current docs/bugs.md. You may edit only docs/bugs.md. Rewrite it with Severity, Summary, numbered Steps, Expected, Actual and Evidence (existing paths only) for every entry. Include only bugs confirmed by evidence files; keep BUG-001 and BUG-002 numbers fixed because tests reference them; use only facts present in the evidence; steps must never require sending a real lead; add an "Investigated and ruled out" section covering the dropdown race theory, the mobile close button, "Book call" vs "Contact Us", the second email input, placeholder emails, no soft 404 and the once-flaky Services test. Show me the full file.

**What Claude did:** Replaced the old four-entry draft from Prompt #7 (which contained the unverified race theory, the "Book call" bug and the second email input) with 8 evidence-backed bugs: BUG-001 (newsletter pop-up collapses an open header menu, Medium), BUG-002 (Content-Security-Policy missing, Medium), BUG-003 (failed-submission error banner has no role/aria-live, Medium), BUG-004 ("Required." not linked via aria-describedby, Low), BUG-005 (greeting uses only the first word of the first name, Low), BUG-006 (title vs og:title mismatch, Low), BUG-007 (premature "Required." before the field is touched, Low), BUG-008 (identical blog dates, Low). Added the "Investigated and ruled out" section.

**What I changed / accepted / rejected:**
Checked every number and quote in the file against its cited evidence file: confirmed BUG-001's 2095ms/2951ms timings and the ~14-day localStorage figure both trace back to bug-001-investigation.txt, and confirmed the aria-invalid-stays-true claim was correctly left out of this version, since bug-007-aria-invalid.txt itself records "NOT CONFIRMED" for that exact check. Changed BUG-001's "reproduced 3/3" line from the earlier draft to "2/2 runs", since bug-001-investigation.txt only contains two runs of that specific check — the draft's 3/3 figure wasn't actually backed by that file. Kept BUG-003 at Medium, since it's the failure path of the main lead form for screen reader users.

---

## Prompt #24
**What I asked:** Read docs/user-story-map.md, every file in tests/ and docs/evidence/. You may edit only docs/user-story-map.md. Keep the exact PDF template. (1) Update stories to match what was observed: header items are dropdown buttons, mobile uses an "Open navigation" toggle and "Site Navigation" dialog, the contact form is two steps and "Find a time" submits to POST /api/leads, the pop-up appears 2–3s after load and is suppressed for 14 days via td_nl_popup_until. (2) Add US-018 if missing. (3) Tick acceptance checkboxes only if a test asserts them; add "Automated in" or "Not automated: reason" under each story; US-017 is not automated. (4) Remove resolved [TO VERIFY] markers using only facts from tests and evidence. Show a summary table and the full diff.

**What Claude did:** Rewrote 6 stories (US-001, US-004, US-007, US-008, US-009, US-010) to match observed behaviour, added US-018, ticked 36 acceptance checkboxes across the map that a test actually asserts, marked all 18 stories with their test file or a one-line reason they're not automated, and resolved the one hedged phrase the file actually contained (US-004's "or shows the expected next-step UI" — there were no literal [TO VERIFY] brackets anywhere in the file).

**What I changed / accepted / rejected:**
Spot-checked US-002, US-009 and US-014 against their tests: confirmed footer-navigation.spec.ts really does check status<400 for all 39 internal hrefs (matching every US-002 bullet), contact-submission.spec.ts really does assert the full /api/leads body shape (matching all 4 US-009 bullets), and load.spec.ts really does assert p95<3000 and zero 5xx with results written to docs/load-test-results.md (matching all 4 US-014 bullets) — nothing needed unticking. Personas already varied across the map (visitor, prospect, recruiter), so I left the "So that" lines as Claude wrote them rather than rewrite ones that already matched what I'd actually seen.

---

## Prompt #25
**What I asked:** Read the whole repo. You may create or edit only README.md. Write a concise README with: what this is; quick start (npm install with postinstall, npx playwright test, show-report); test structure with real counts per folder; key design decisions (selectors and the two text-locator exceptions, pop-up suppression and fallback, GA beacons blocked, /api/leads always aborted or mocked, workers, isolated load project and --no-deps); known failing tests by design; known flaky history and limitations; results summary with links to the docs. Use only facts present in the repo. Show me the file.

**What Claude did:** Drafted README.md with quick start, a test structure table (E2E 31 tests across 7 files, integration 6 across 3, security 4 across 3, load 1), design decisions, the two test.fail() tests with BUG-001 and BUG-002, limitations, and links to the docs.

**What I changed / accepted / rejected:**
Ran `npm install`, `npx playwright test` and `npx playwright show-report` exactly as written — all three work as documented, consistent with the fresh-clone check back in Prompt #21. Didn't add a separate "Trade-offs I made" section to README.md itself this session, since today's edits were scoped to docs/claude-code-log.md only — recording the trade-offs here instead, in my own words: chose to root-cause the flaky dropdown tests (Prompts #9–#11) rather than paper over them with retries or looser timeouts; kept the load project's dependency on chromium even though a functional failure skips the load test, because it guarantees load never runs alongside anything else; switched CI to manual trigger so routine pushes don't load the live production site; and tested injection only client-side, since proving server-side sanitisation would mean sending real leads, which CLAUDE.md forbids.

---

## Prompt #26
**What I asked:** Do not edit any file. Run git status and list untracked or modified files. Then run npx playwright test and report totals per project, passed, failed, flaky, expected failures with bug IDs, and duration. Confirm that every evidence path mentioned in docs/bugs.md exists.

**What Claude did:** git status showed a clean working tree (nothing to commit). npx playwright test: 44 tests (43 chromium + 1 load) — 43 passed, 1 flaky (a "Portfolio" dropdown test failed its first attempt with the same aria-expanded symptom as the known once-flaky case, then passed on retry), 0 failed outright, 0 skipped, in 1.9 minutes; BUG-001 and BUG-002 failed as expected. All 19 evidence paths referenced in docs/bugs.md exist on disk — none missing.

**What I changed / accepted / rejected:**
No changes needed; this was my final check before submission. The one flaky "Portfolio" run is the same class of issue as the already-documented once-flaky "Services" test (not a new bug), and everything else — clean git status, all evidence present, both expected failures behaving correctly — confirmed the repo was ready to hand over as-is.