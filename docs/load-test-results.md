# Load Test Results

**Date/time:** 2026-10-22T19:27:17.944Z
**Concurrent users:** 5
**Rounds per user:** 3
**Total requests:** 30 (5 users × 2 pages × 3 rounds)

**Note:** this measures HTML document response time only (the GET request/response for the page itself), not full page render or asset loading (CSS/JS/images).

## Timing (ms)

| Scope | Count | Min | Avg | p50 | p95 | Max |
|---|---|---|---|---|---|---|
| / | 15 | 393 | 817.4 | 497 | 1547 | 1547 |
| /contact | 15 | 533 | 1260.2 | 587 | 2955 | 2955 |
| **Overall** | 30 | 393 | 1038.8 | 578 | 2623 | 2955 |

## Status codes

| Status | Count |
|---|---|
| 200 | 30 |

## Verdict

- p95 < 3000ms: **PASS** (overall p95 = 2623ms)
- Zero 5xx errors: **PASS** (status counts: {"200":30})
