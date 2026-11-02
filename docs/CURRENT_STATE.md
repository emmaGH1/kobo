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

### Ordered continuation checkpoint 5
After 0–4: exact-command stock in/out with integer-unit reviews, explicit confirmation/idempotency, nonnegative/safe totals, owner isolation and append-only movements; stock-left/low-threshold reads. Rolling seven-Lagos-day insights compute money totals and customer net collections, not fabricated item rankings/profit/visits. No automatic quantity adjustment from sale/purchase prose. 112 offline tests passed, 1 live skipped; typecheck/lint/build passed. No UI/protected-path changes or model calls. Details and command grammar in HANDOVER.

### Ordered continuation checkpoint 4
Notebook PNG/JPEG import now has private authenticated and quota-bound demo routes, inline configured Responses image transport, bounded/metadata-stripped in-memory images, opening-debt row parsing, ambiguity/name/repeated-row blocks, full explicit review and digest idempotency. 109 offline tests passed, 1 live skipped; typecheck/lint/build passed. Image payload tested with mocked transport only: no live Muse-image/handwriting accuracy proof or real customer image; no photo UI added. See HANDOVER for payload, limits and safety boundaries.

### Ordered continuation checkpoint 3
Due-day 08:00 Lagos persistent outbox, opt-in/out, stable reminder IDs, unsent drafts, amount-first Already paid review and one-day snooze implemented. Same-batch partial payments allocated before FIFO payments; settled/reversed debts suppressed. Token-authenticated `/api/reminders/tick` queues jobs only: external scheduler, approved utility template and WhatsApp delivery are NOT configured or live-tested. Demo `/api/demo/skip-friday` simulates next due-day notice without advancing global time or model calls. 103 offline tests passed, 1 live skipped; typecheck/lint/build passed. See HANDOVER for delivery limits and configuration.

### Ordered continuation checkpoint 2
Recorded Lagos civil-day debt age and last-paid memory now appear in customer history/debtor list rows. Partial payment keeps age, clearing/reborrowing resets; no inferred overdue claims. Numeric Pidgin payment clauses create explicit reviews without model calls; close names remain blocked for choice. 98 offline tests passed, 1 live skipped; typecheck/lint/build passed. No paid calls/native-speaker validation.

### Ordered continuation checkpoint 1
Core `/api/demo/*` adapter implemented: seeded isolated 30-minute sessions; same Service messages and ID-bound actions; ReplyView render hints; actual-provider-call session/daily limits; reset revocation without quota refill; samples and authenticated PNG summary. No consented voice clip exists: voice-sample honestly returns 503. Design backend not switched (separate lane). 96 offline tests passed, 1 live skipped; typecheck/lint/build passed. Production-loopback synthetic session/review/save/PNG exercised without model calls; not external HTTPS proof. See HANDOVER for exact action envelope, IP trust configuration, limitations.

### Ordered continuation checkpoint 0
Verified already-pushed 8ac3f3b history/summary work. Two failed English credit-sale phrases now produce deterministic owner-bound reviews, with no model dependency and no writes before confirmation. Removed automatic paid retry; larger output cap retained without claiming live remediation. 91 offline tests passed, 1 live skipped; typecheck/lint/build passed. No paid calls. See HANDOVER.

### Latest continuation (interactive clarification, copy, language, eval)
Review-ID-bound clarification is wired to an interactive adapter (`interactive` reply blocks, `handleInteractive`, `/api/dev` `interactive` action) over an ordered multi-question queue (amounts, then dates, then customers); design section 4 English/Pidgin copy and section 3 naira formatting are implemented for the supported flows; English/Pidgin choice is remembered and an unsure message keeps the thread language; a 100× error in the `three eight` candidate amounts was fixed. The eval runner now persists sanitized results (pass rate, per-case outcomes, tokens). The one authorized 25-case live run: **23/25 passed, 2 failed (cases 5, 25), 0 errors; 49,360 total tokens**. 81 offline tests passed (1 live skipped); typecheck, lint, production build passed. Not implemented: customer history, daily-summary template, undo/reversal flow, voice, WhatsApp transport; Pidgin needs native-speaker review. See `HANDOVER.md`.

### Previous partial continuation
Per-entry amount options and a review-ID-bound clarification API were added, with fresh reviews and stale/cross-owner tests. Full structured clarification, interactive adapter wiring, design section 4 exact copy and remembered Pidgin/English selection remain incomplete. An authorized live 25-case run completed once; its test passed only the 25-classifications accounting assertion, and aggregate results and provider token totals were suppressed by Vitest and are unavailable. No accuracy result can be claimed for that run and it was not repeated. Typecheck, lint, 67 offline tests (one live test skipped), and production build passed; see HANDOVER for limitations.

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

### Core implementation follow-up (supersedes parser-only status above)
A constrained end-to-end text service, authenticated owner/demo web route, bare `/dev`, safe numeric token usage logging, exact-grammar confirmation, validated sale due date, immutable stock purchase/spent summary, and unsent owner-checked reminder draft link are implemented. Synthetic live gateway flows passed for sale/due-date review and save, debtors, ambiguous amount blocking, and (after replacing a failed model-routed purchase probe with exact deterministic parsing) purchase/save and daily spent summary. Reminder link was checked with a fictional number; nothing was sent. 37 offline tests, typecheck, lint and build passed. `/dev` was visually inspected; preview dev HMR websocket errors occurred. No real customer data used. See `HANDOVER.md` for precise grammar, evidence and limitations. This is not ready for production, natural-language autonomous writes, real customer data, or public exposure. The owner passcode is currently unset; HTTPS/proxy, backups, retention, security and cost controls remain unverified.

### Natural-language rebuild — partial checkpoint
The parser is connected to a source-checked `record_entries` model tool, review/confirmation, atomic customer creation, labelled calculated partial payments, blocking clarification metadata and Lagos daily boundaries. Single ambiguous amounts offer numbered options or a fresh numeric amount, creating a new review that requires confirmation; other clarification types still require a complete replacement via edit. Similar customer names block for manual correction. Quoted ISO dates, today/tomorrow and named weekdays resolve in Lagos, with weekdays always in the future. Some vague promises are flagged, but model omission remains possible. The model still determines meaning; source quotes and user review do not independently prove semantics. Section 4 design copy/language integration, general clarification and broader Pidgin remain incomplete. See `docs/LIVE_EVAL_RESULTS.md` for the latest synthetic live run.

A paid 25-message synthetic live extraction run returned 23 expected reviews, one mismatch (`20 thousand`, parser support subsequently added), and one provider/processing error. A separate live retry of those two cases passed; the complete set was not rerun. No ledger confirmations or real data were used. This small sample is not an accuracy benchmark. Offline: 61 tests passed, one opt-in live test skipped, typecheck/lint passed and build passed. See `HANDOVER.md` for limitations. Existing unrelated `AGENTS.md` change was not touched.

## Design lane
Not started. Owns src/components/ and src/app/(app)/. No approved visual direction; neutral root placeholder only. Real shadcn init configuration/utils/themes exist, no component library copied by hand.

## Docs lane
Initial setup documents exist. Official rubric/submission requirements remain unverified.

## Next single action
Owner supplies the domain/subdomain and arranges the administrator activation step in docs/DEPLOYMENT.md. Do not start product features in this setup thread.
