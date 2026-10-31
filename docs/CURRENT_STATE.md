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

Second B gate: Zod is not a direct dependency. Shared package.json/lockfile changes require owner coordination under AGENTS.md; approval requested, no shared config edits made. Resume only after model access is resolved and Zod addition approved. Requested live sale/debtors/ambiguity acceptance tests remain unrun.

## Design lane
Not started. Owns src/components/ and src/app/(app)/. No approved visual direction; neutral root placeholder only. Real shadcn init configuration/utils/themes exist, no component library copied by hand.

## Docs lane
Initial setup documents exist. Official rubric/submission requirements remain unverified.

## Next single action
Owner supplies the domain/subdomain and arranges the administrator activation step in docs/DEPLOYMENT.md. Do not start product features in this setup thread.
