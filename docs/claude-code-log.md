Prompt #1
What I asked: Read CLAUDE.md and docs/QA-Playwright-Assignment.pdf. Then update playwright.config.ts: set baseURL to    
  https://techdome.io, workers to 4, screenshot and trace on failure, and keep only the chromium project    
  for now. Do not write any tests yet. Show me the diff before applying it.

What Claude did: Showed a diff for playwright.config.ts: baseURL, workers 4, trace retain-on-failure, screenshot only-on-failure, removed firefox/webkit.
What I changed / accepted / rejected: Accepted all of it. Added retries: 1 myself because the target is a live site. Verified workers is under the 5-user limit.