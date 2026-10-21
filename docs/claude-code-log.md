Prompt #1
What I asked: (paste your exact prompt)
What Claude did: Showed a diff for playwright.config.ts: baseURL, workers 4, trace retain-on-failure, screenshot only-on-failure, removed firefox/webkit.
What I changed / accepted / rejected: Accepted all of it. Added retries: 1 myself because the target is a live site. Verified workers is under the 5-user limit.