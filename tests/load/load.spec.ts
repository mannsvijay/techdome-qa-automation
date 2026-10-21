import { test, expect, request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * US-014: Load test. Hard rule (CLAUDE.md): never more than 5 concurrent users.
 * This project ("load" in playwright.config.ts) runs in its own project, after
 * every other project has finished, so this is the only concurrent load against
 * techdome.io the suite ever produces.
 *
 * Measures HTML document response time only (the GET request/response itself) —
 * not full page render, nor any CSS/JS/image asset loading a browser would also do.
 */

const ROUNDS = 3;
const PAGES = ['/', '/contact'] as const;

interface Timing {
  page: string;
  durationMs: number;
  status: number;
}

function computeStats(durations: number[]) {
  const sorted = [...durations].sort((a, b) => a - b);
  const n = sorted.length;
  const percentile = (p: number) => sorted[Math.min(n - 1, Math.ceil((p / 100) * n) - 1)];
  return {
    count: n,
    min: sorted[0],
    max: sorted[n - 1],
    avg: durations.reduce((a, b) => a + b, 0) / n,
    p50: percentile(50),
    p95: percentile(95),
  };
}

test('5 concurrent users, 3 rounds of / then /contact each', async () => {
  const USERS = 5;
  expect(USERS).toBeLessThanOrEqual(5);

  const contexts = await Promise.all(
    Array.from({ length: USERS }, () => request.newContext({ baseURL: 'https://techdome.io' }))
  );

  const allTimings: Timing[] = [];

  try {
    const perUserTimings = await Promise.all(
      contexts.map(async (ctx) => {
        const timings: Timing[] = [];
        for (let round = 0; round < ROUNDS; round++) {
          for (const pagePath of PAGES) {
            const start = Date.now();
            const response = await ctx.get(pagePath);
            const durationMs = Date.now() - start;
            timings.push({ page: pagePath, durationMs, status: response.status() });
          }
        }
        return timings;
      })
    );

    for (const timings of perUserTimings) allTimings.push(...timings);
  } finally {
    await Promise.all(contexts.map((ctx) => ctx.dispose()));
  }

  const overallStats = computeStats(allTimings.map((t) => t.durationMs));
  const perPageStats: Record<string, ReturnType<typeof computeStats>> = {};
  for (const pagePath of PAGES) {
    perPageStats[pagePath] = computeStats(allTimings.filter((t) => t.page === pagePath).map((t) => t.durationMs));
  }

  const statusCounts: Record<number, number> = {};
  for (const t of allTimings) {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  }

  const zero5xx = allTimings.every((t) => t.status < 500);
  const p95Pass = overallStats.p95 < 3000;

  // --- Write the report BEFORE any assertion below can throw ---
  const now = new Date();
  const lines: string[] = [];
  lines.push('# Load Test Results');
  lines.push('');
  lines.push(`**Date/time:** ${now.toISOString()}`);
  lines.push(`**Concurrent users:** ${USERS}`);
  lines.push(`**Rounds per user:** ${ROUNDS}`);
  lines.push(`**Total requests:** ${allTimings.length} (${USERS} users × ${PAGES.length} pages × ${ROUNDS} rounds)`);
  lines.push('');
  lines.push(
    '**Note:** this measures HTML document response time only (the GET request/response for the page itself), not full page render or asset loading (CSS/JS/images).'
  );
  lines.push('');
  lines.push('## Timing (ms)');
  lines.push('');
  lines.push('| Scope | Count | Min | Avg | p50 | p95 | Max |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const pagePath of PAGES) {
    const s = perPageStats[pagePath];
    lines.push(`| ${pagePath} | ${s.count} | ${s.min} | ${s.avg.toFixed(1)} | ${s.p50} | ${s.p95} | ${s.max} |`);
  }
  lines.push(
    `| **Overall** | ${overallStats.count} | ${overallStats.min} | ${overallStats.avg.toFixed(1)} | ${overallStats.p50} | ${overallStats.p95} | ${overallStats.max} |`
  );
  lines.push('');
  lines.push('## Status codes');
  lines.push('');
  lines.push('| Status | Count |');
  lines.push('|---|---|');
  for (const [status, count] of Object.entries(statusCounts).sort(([a], [b]) => Number(a) - Number(b))) {
    lines.push(`| ${status} | ${count} |`);
  }
  lines.push('');
  lines.push('## Verdict');
  lines.push('');
  lines.push(`- p95 < 3000ms: **${p95Pass ? 'PASS' : 'FAIL'}** (overall p95 = ${overallStats.p95}ms)`);
  lines.push(`- Zero 5xx errors: **${zero5xx ? 'PASS' : 'FAIL'}** (status counts: ${JSON.stringify(statusCounts)})`);
  lines.push('');

  fs.writeFileSync(path.join(process.cwd(), 'docs/load-test-results.md'), lines.join('\n'), 'utf8');

  // --- Assertions, after the report is safely on disk ---
  expect(overallStats.p95, `overall p95 was ${overallStats.p95}ms`).toBeLessThan(3000);
  expect(zero5xx, `status counts: ${JSON.stringify(statusCounts)}`).toBe(true);
});
