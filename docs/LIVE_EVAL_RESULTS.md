# Synthetic live extraction evaluation

## Latest run (authoritative; supersedes the sections below)
2026-11-02 (UTC), `src/server/live-eval-results.json`: 25 synthetic cases, in-memory databases, no confirmations, one run only. **23/25 passed (92.0%), 2 failed (cases 5 and 25), 0 errors.** Provider-reported tokens: 36,316 input, 13,044 output, 49,360 total across 25 responses (all 25 reported usage). Failure reason recorded for both: "unexpected number of entries or no review"; the underlying cause was not captured. Case 5: `Ada bought goods on credit for 12,000 naira`; case 25: `Ada bought on credit for 6,000`. Earlier runs had different failures, so results vary between runs. The runner was repaired in this change (results file, pass rate, token logging, boundary error classification); run with `KOBO_LIVE_EVAL=1 node --env-file=.env.local ./node_modules/vitest/vitest.mjs run src/server/live-eval.test.ts`. This is a small synthetic extraction check, not an accuracy or safety benchmark.

## Earlier run

2026-11-02 (UTC): full 25 cases in `src/server/live-eval.test.ts`, in-memory database, no confirmations. Run with `KOBO_LIVE_EVAL=1 node --env-file=.env.local ./node_modules/vitest/vitest.mjs run src/server/live-eval.test.ts --disableConsoleIntercept`. This makes paid model calls. Never use real customer data.

Result: **23 passed, 0 failed, 2 provider or processing errors** (cases 5 and 18). Errors were not classified; the test catches them without logging sensitive provider data. The test asserts all cases were accounted for, not that all passed. This is not a safety or production accuracy benchmark; results can vary by model and run. A previous run is documented in `HANDOVER.md`.
