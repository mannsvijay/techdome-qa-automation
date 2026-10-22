# Load Test Results

**Date/time:** 2026-10-22T21:36:24.305Z
**Concurrent users:** 5
**Rounds per user:** 3
**Total requests:** 30 (5 users × 2 pages × 3 rounds)

**Note:** this measures HTML document response time only (the GET request/response for the page itself), not full page render or asset loading (CSS/JS/images).

## Timing (ms)

| Scope | Count | Min | Avg | p50 | p95 | Max |
|---|---|---|---|---|---|---|
| / | 15 | 381 | 631.0 | 436 | 1038 | 1038 |
| /contact | 15 | 535 | 755.9 | 687 | 1445 | 1445 |
| **Overall** | 30 | 381 | 693.5 | 566 | 1240 | 1445 |

## Status codes

| Status | Count |
|---|---|
| 200 | 30 |

## Verdict

- p95 < 3000ms: **PASS** (overall p95 = 1240ms)
- Zero 5xx errors: **PASS** (status counts: {"200":30})
