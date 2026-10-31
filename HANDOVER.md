# Session handover

## Session / lane / branch
Core lane, branch `core`. Sprint execution of owner-approved checkpoints A/B. No voice or WhatsApp.

## Bounded task and checkpoints
A: append-only ledger, integer-kobo projections, transactionally idempotent confirmation and tests. B: real Muse tool-call proof before extraction, auth/routes/dev exercise.

## Changes and commits
Checkpoint A commit `d65296f`: `db/schema.sql`, `src/core/ledger.ts`, `src/core/ledger.test.ts`, `src/server/ledger-store.ts`. Required state/handover coordination exceptions only; no design/root/config edits. Follow-up records blocked integration proof in `src/server/MUSE-PROOF.md`. No merge or deployment.

## Verification evidence
14 tests passed; typecheck, lint and production build passed. In-memory SQLite tests include transaction rollback, duplicate confirmation, reversals, evidence, ownership, expiry, exact totals and stale edit/cancel safety. No real customer data or private harness content copied.

## Blockers / unresolved decisions
B live-proof gate failed: first POST /v1/responses HTTP 400; revised documented flat-function request HTTP 404 `model_not_found` for muse-spark-1.3. Diagnostic GET /v1/models HTTP 200 with empty model list. Successful tool-call response format is NOT verified. No fallback model used.

B also requires Zod, absent from direct dependencies; shared dependency/lockfile changes need explicit owner coordination (requested, pending). No auth, message service/routes, extraction or /dev page built because proof is a pre-build gate. Three requested live acceptance messages remain unrun.

## Next single action
Owner resolves Muse model/account access and approves Zod dependency changes. Then prove one real tool call before implementing B. Do not claim checkpoint B complete or use the ledger with real customer data; authentication, backup/recovery and API boundaries are not implemented.
