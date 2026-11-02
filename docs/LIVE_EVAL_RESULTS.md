# Synthetic live extraction evaluation

2026-11-02 (UTC): full 25 cases in `src/server/live-eval.test.ts`, in-memory database, no confirmations. Run with `KOBO_LIVE_EVAL=1 node --env-file=.env.local ./node_modules/vitest/vitest.mjs run src/server/live-eval.test.ts --disableConsoleIntercept`. This makes paid model calls. Never use real customer data.

Result: **23 passed, 0 failed, 2 provider or processing errors** (cases 5 and 18). Errors were not classified; the test catches them without logging sensitive provider data. The test asserts all cases were accounted for, not that all passed. This is not a safety or production accuracy benchmark; results can vary by model and run. A previous run is documented in `HANDOVER.md`.
