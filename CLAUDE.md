# Project: Techdome QA Assignment
Site under test: https://techdome.io
Tool: Playwright + TypeScript

## Hard rules
- NEVER more than 5 concurrent users in any load test (workers <= 5).
- `npx playwright test` must run from the repo root on a fresh clone.
- Prefer getByRole / getByLabel / data-testid. Avoid text-based selectors.
- Do not submit real enquiries to the live contact form. Intercept with page.route().
- Do not hit the site aggressively. Keep requests low.
- Full assignment details are in docs/QA-Playwright-Assignment.pdf

## Folder structure
tests/e2e, tests/integration, tests/security, tests/load, utils, docs