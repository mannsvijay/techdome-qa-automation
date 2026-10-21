# Load Test Results

**Date/time:** 2026-10-21T23:07:34.317Z
**Concurrent users:** 5
**Rounds per user:** 3
**Total requests:** 30 (5 users × 2 pages × 3 rounds)

**Note:** this measures HTML document response time only (the GET request/response for the page itself), not full page render or asset loading (CSS/JS/images).

## Timing (ms)

| Scope | Count | Min | Avg | p50 | p95 | Max |
|---|---|---|---|---|---|---|
| / | 15 | 376 | 588.1 | 479 | 925 | 925 |
| /contact | 15 | 538 | 678.7 | 612 | 1066 | 1066 |
| **Overall** | 30 | 376 | 633.4 | 597 | 925 | 1066 |

## Status codes

| Status | Count |
|---|---|
| 200 | 30 |

## Verdict

- p95 < 3000ms: **PASS** (overall p95 = 925ms)
- Zero 5xx errors: **PASS** (status counts: {"200":30})
