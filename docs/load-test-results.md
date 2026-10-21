# Load Test Results

**Date/time:** 2026-10-21T22:30:27.331Z
**Concurrent users:** 5
**Rounds per user:** 3
**Total requests:** 30 (5 users × 2 pages × 3 rounds)

**Note:** this measures HTML document response time only (the GET request/response for the page itself), not full page render or asset loading (CSS/JS/images).

## Timing (ms)

| Scope | Count | Min | Avg | p50 | p95 | Max |
|---|---|---|---|---|---|---|
| / | 15 | 341 | 527.3 | 410 | 775 | 775 |
| /contact | 15 | 537 | 713.7 | 704 | 971 | 971 |
| **Overall** | 30 | 341 | 620.5 | 621 | 893 | 971 |

## Status codes

| Status | Count |
|---|---|
| 200 | 30 |

## Verdict

- p95 < 3000ms: **PASS** (overall p95 = 893ms)
- Zero 5xx errors: **PASS** (status counts: {"200":30})
