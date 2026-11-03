import { expect, it } from 'vitest';
import { createModelProvider } from './model-provider';
import { runEvaluation } from './eval-runner';

// Explicit opt-in: synthetic names only, in-memory DB, paid provider calls, no confirmations.
// Results are written to KOBO_LIVE_RESULTS_PATH (default src/server/live-eval-results.json) and stderr,
// because a passing Vitest test can hide console and stdout output.
it.skipIf(process.env.KOBO_LIVE_EVAL !== '1')('evaluates 25 synthetic messages against the live configured provider', async () => {
  const selected = process.env.KOBO_LIVE_CASES?.split(',').map(value => Number(value.trim()));
  const summary = await runEvaluation({ provider: createModelProvider(), selected, outPath: process.env.KOBO_LIVE_RESULTS_PATH || 'src/server/live-eval-results.json' });
  // Accounting only: this deliberately does not assert that every case passed. Read passRate in the results file.
  expect(summary.passed + summary.failed + summary.errors).toBe(selected ? new Set(selected).size : 25);
}, 900000);
