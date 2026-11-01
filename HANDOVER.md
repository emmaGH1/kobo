# Session handover

## Session / lane / branch
Core lane, branch `core`. Sprint execution of owner-approved checkpoints A/B. No voice or WhatsApp.

## Bounded task and checkpoints
A: append-only ledger, integer-kobo projections, transactionally idempotent confirmation and tests. B: real Muse tool-call proof before extraction, auth/routes/dev exercise.

## Changes and commits
Checkpoint A commit `d65296f`: `db/schema.sql`, `src/core/ledger.ts`, `src/core/ledger.test.ts`, `src/server/ledger-store.ts`. Required state/handover coordination exceptions only; no design/root/config edits. Follow-up records blocked integration proof in `src/server/MUSE-PROOF.md`. Billing-fix retry session adds approved Zod dependency, `src/server/model-provider.ts` with provider interface/env-configured Responses transport, 9 mocked tests, and public URL/model placeholders in `.env.example`. No merge or deployment.

## Verification evidence
23 tests passed (14 existing + 9 mocked provider cases); typecheck, lint and production build passed. In-memory SQLite tests include transaction rollback, duplicate confirmation, reversals, evidence, ownership, expiry, exact totals and stale edit/cancel safety. Provider mocks cover env configuration, empty/malformed catalogs, flat request format, error/redaction behavior and no automatic retries; these are not live proof. No real customer data or private harness content copied.

## Blockers / unresolved decisions
B live-proof gate failed: first POST /v1/responses HTTP 400; revised documented flat-function request HTTP 404 `model_not_found` for muse-spark-1.3. Diagnostic GET /v1/models HTTP 200 with empty model list. Successful tool-call response format is NOT verified. No fallback model used.

After owner reported billing/card fix: GET /v1/models HTTP 200 with `data: []`; waited 300 seconds and retried once, still HTTP 200 with `data: []`. No muse-spark-1.3 listed; no further POST performed because catalog-first gate was not met. No new HTTP error; prior POST error is recorded above. Stopped at access gate.

Zod approval resolved and dependency installed. ModelProvider interface and env-configured Responses transport implemented; no live response parser/extraction before proof. MODEL_BASE_URL/MODEL_ID/MODEL_API_KEY stay server-side. Env-only swaps work for Responses-compatible APIs; incompatible protocols need an adapter. No auth, message service/routes, extraction or /dev page built because proof is a pre-build gate. Three requested live acceptance messages remain unrun.

Dedicated credential follow-up: owner saved key in ignored Kobo .env.local; both new catalog checks explicitly used that file instead of the harness. HTTP 200 with model IDs [] before and after one 300-second wait. No POST attempted; model still absent. Credential-source change did not resolve the issue. Docs-only follow-up; no code or tests changed, prior suite not rerun. Evidence added to MUSE-PROOF.md.

Owner supplied working playground screenshot and authorized bypassing catalog gate for one minimal Responses call with dedicated Kobo credential. Result HTTP 404 `model_not_found`, `The requested model was not found.`; request ID `faa9e48e-9115-497d-907e-f55d04b1e435`. No tools sent, no follow-up or retry. Docs-only update; no runtime changes/tests rerun. Dedicated-key inference now independently fails despite working playground.

## Next single action
Compare non-secret playground generated code and verify key belongs to same team/project. If endpoint/model/auth match, contact Meta support with request ID; resolve API-key access discrepancy. Then verify muse-spark-1.3 is listed and prove one real tool call before implementing B. Zod approval no longer blocks. Do not claim checkpoint B complete or use the ledger with real customer data; authentication, backup/recovery and HTTP API boundaries are not implemented.
