# Current state

## Setup lane
- [x] Scaffold Next.js App Router, TypeScript, Tailwind and real shadcn/ui initialization (no product components).
- [x] Install pnpm tooling, better-sqlite3, Drizzle, drizzle-kit and Vitest; permit only necessary native builds explicitly.
- [x] Commit scaffold checkpoint: 2195a62.
- [x] Define channel-neutral message/confirm/edit/cancel types and plain-text choices; document invariants and lane ownership. Contracts/docs checkpoint: c1b861c.
- [x] Prepare Caddy + systemd VPS templates; not installed/activated.
- [x] Typecheck, lint, 1 offline in-memory SQLite/Drizzle test and production build passed; no peer dependency issues.
- [x] Private GitHub repo verified: https://github.com/emmaGH1/kobo; main/core/design/docs created and pushed.
- [x] Production placeholder visually inspected at http://127.0.0.1:3000: HTTP 200, expected honest setup copy, assets loaded, no console entries. This is loopback HTTP only, not public HTTPS.
- [x] Git ignore checks passed for env files, SQLite and journals, recordings, results and voice-harness paths. Git contains only the new app scaffold; no private harness assets were copied.
- [ ] External HTTPS: blocked by missing domain/DNS and privileged Caddy/systemd activation. No live HTTPS URL established.

No features implemented. No API calls were made and no voice harness files changed. HANDOVER.md intentionally starts as a blank template at the owner's request; this file records initial setup evidence.

## Core lane
Checkpoint A implemented on `core`: owner/customer/alias, pending action, append-only event and evidence schema; pure integer-kobo balances, debtors and daily summaries; transactional, idempotent confirmation; owner/conversation scoping, expiry, cancellation and replacement review IDs. Confirmation retries acknowledge the same committed result without appending. No UI, AI, authentication or HTTP routes yet.

Verification: 14 Vitest tests passed (13 ledger cases + setup smoke); typecheck, lint and production build passed. Tests cover paid/partial sales, opening debt/repayment, reversal/re-entry, duplicate keys/confirms, missing amount/customer, exact integers/overflow rollback, owner isolation, expiry, edit/cancel and append-only triggers.

Checkpoint A commit: `d65296f`.

Checkpoint B blocked at required real Muse proof: first synthetic tool-call request HTTP 400; documentation-informed revised request HTTP 404 `model_not_found` for `muse-spark-1.3`; diagnostic GET /v1/models HTTP 200 with empty model list. No successful model response or B implementation claimed. Official request/output schema inspected directly but not live-verified; evidence in `src/server/MUSE-PROOF.md`. No voice/WhatsApp work or private harness content copied.

Billing-fix follow-up: owner approved Zod and bounded catalog retries. GET /v1/models returned HTTP 200 with an empty `data` list both before and after the requested 300-second wait. `muse-spark-1.3` was not listed, so no subsequent POST/tool-call attempt was made. No HTTP error from these catalog checks; previous POST error remains `model_not_found`. Stop condition reached; model access unresolved. Requested live sale/debtors/ambiguity acceptance tests remain unrun.

Installed Zod (approved package.json/lockfile changes). Added server-side ModelProvider interface and ResponsesModelProvider transport, configured only by MODEL_BASE_URL/MODEL_ID/MODEL_API_KEY, with public defaults in .env.example. No automatic retries, timeout/redirect safeguards, credential-redacted errors, Zod configuration/catalog/request validation. Raw successful Responses payload remains unknown until real proof; no extraction/parser or ledger execution added. Env-only model swapping supports Responses-compatible providers; other protocols require an adapter. 9 new mocked provider tests; total 23 tests passed, plus typecheck, lint and production build. Evidence/limitations in src/server/MUSE-PROOF.md. No credentials copied or committed.

Dedicated Kobo credential follow-up: owner saved key in ignored .env.local. Both catalog checks explicitly loaded that file (not the harness), separated by 300 seconds, returned HTTP 200 with an empty model list; configured model absent. No further POST attempted and no code changed. Credential-source change did not resolve access; account entitlement/provisioning remains unverified. Owner should test dashboard/playground on billing-fixed account and contact Meta support if access remains empty. No secrets displayed or tracked. This follow-up is docs-only; prior 23-test/typecheck/lint/build evidence above was not rerun.

Owner-approved catalog bypass: after screenshot showed working Muse playground, owner authorized one minimal Responses call with dedicated Kobo key (`model: muse-spark-1.3`, `input: Reply with OK.`). Actual result HTTP 404, code `model_not_found`, message `The requested model was not found.`, request ID `faa9e48e-9115-497d-907e-f55d04b1e435`. No tool schema supplied, no follow-up call or retry. Thus dedicated-key inference independently fails, not merely catalog enumeration. Official base URL/model/auth and local credential loading/format checks match docs; account/project/key entitlement not verified. Next action: compare non-secret playground generated code and same team/project key scope, then Meta support with request ID if matching. Docs-only evidence update; no runtime changes or suite rerun.

Gateway follow-up: `src/server/MUSE-PROOF.md` records a successful synthetic Vercel AI Gateway `meta/muse-spark-open` tool-call response. This supersedes the earlier claim that no successful tool-call shape was verified; it does not establish a working bookkeeping journey or direct Meta API access.

Latest core work adds an isolated, tested Responses function-call parser and preliminary deterministic fact checks in `src/server/tool-calls.ts`. It is **not connected** to a service, provider request, routes or ledger. Text occurrence alone does not establish the meaning of an amount or authorize a write. Checkpoint B is incomplete: no handleMessage, tool execution, authentication, owner-checked routes, /dev page or token logging. Due dates, purchase events, spent summary and reminders are also not implemented. The three live acceptance tests were not run because the required authenticated flow is absent. This is not ready for real customer data.

Verification: 27 offline tests passed; TypeScript, lint and production build passed. No live API calls in this session. No voice/WhatsApp integration.

## Design lane
Not started. Owns src/components/ and src/app/(app)/. No approved visual direction; neutral root placeholder only. Real shadcn init configuration/utils/themes exist, no component library copied by hand.

## Docs lane
Initial setup documents exist. Official rubric/submission requirements remain unverified.

## Next single action
Owner supplies the domain/subdomain and arranges the administrator activation step in docs/DEPLOYMENT.md. Do not start product features in this setup thread.
