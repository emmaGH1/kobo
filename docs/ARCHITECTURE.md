# Architecture (contracts only; product implementation pending)

## Flow and boundaries
Web and WhatsApp adapters → authenticated/verified sender identity → channel-neutral core service → optional server-side transcription and fact extraction → clarification/review pending state → explicit owner confirmation → deterministic integer-kobo calculations → SQLite append-only ledger via Drizzle.

`src/core/contract.ts` is the shared public contract, with no runtime service implementation. Future adapters must call the same core; never put ledger logic in a webhook handler or React component. Next.js routes using better-sqlite3/FFmpeg must use the Node.js runtime, never Edge.

## Channel-neutral API
`handleMessage({ channel: 'web' | 'whatsapp', senderId, text?, audioPath? })` resolves to `{ replyText, pending?: { id, summary, flags: string[] } }`.
At least one nonblank text or trusted audio reference is required (runtime validation pending). Channel and senderId are derived by a trusted adapter, not accepted as authorization merely because a client sends them. audioPath must reference a server-owned private upload, never arbitrary user paths or URLs. No transcription/model calls exist in setup.

`confirm({ channel, senderId, pendingId })`, `edit({ channel, senderId, pendingId, text?, audioPath? })` and `cancel({ channel, senderId, pendingId })` return the same reply shape. `edit` creates a newly reviewable pending ID/version; it must never silently save. `cancel` cancels a draft, not ledger history. `confirm` fails closed while ambiguity flags remain unresolved.

## Plain-text confirmation protocol
Review replies include exactly the choices **1 save / 2 edit / 3 cancel**. handleMessage routes plain `1`, `1 save`, `2`, `2 edit`, `3`, `3 cancel` to the corresponding action using the authenticated conversation's single current pending ID. Numbers only count as actions while awaiting a choice, not during ordinary transaction input. Never choose an arbitrary pending ID when none or multiple exist: ask for clarification. `2 edit` asks for replacement details; replacement details create a new review, requiring a fresh explicit save. Old IDs cannot authorize a replacement. No button-only dependency: WhatsApp text replies reuse the same service. Button payloads must also carry the pending ID and pass ownership/version checks.

## Planned persistence invariants
Pending proposals are mutable workflow state, distinct from immutable ledger events. Scope pending IDs by authenticated tenant/owner and conversation; expire them. Ledger events are append-only; corrections append confirmed reversal events linked to originals. Final validation, pending consumption and append happen in one SQLite transaction. Enforce unique source message IDs/idempotency keys and unique confirmation consumption; webhook redelivery must not duplicate transactions. The production message envelope/deduplication schema remains a core-lane design task before webhooks are enabled. Validate integer safe range and currency rules; no float money. Database schema/migrations and arithmetic are intentionally NOT created by setup.

## Security / failure behavior (requirements, not implemented)
Validate owner passcode server-side with throttling and secure sessions before exposing financial data. Verify Meta webhook signatures against the raw body and server-side app secret; keep verification token separate. Check media size/type/duration, use bounded FFmpeg subprocesses, avoid shell interpolation and define audio retention. Never serve recordings from public/. Transcription failure, uncertainty, invalid drafts or model errors must never create ledger events. Network uncertainty is not proof of failed submission; avoid blind paid retries. No secrets, transcripts, raw provider bodies or financial data in public logs.

## VPS deployment
No Coolify installation was detected at setup. Fallback templates in deploy/: Caddy terminates publicly trusted HTTPS and proxies to Next on 127.0.0.1:3000; systemd runs `next start` as builder. Root/admin installs Caddy and activates services. Persistent data will live in ignored private/ (outside .next); no DB is created on build/import. Backups and restore procedures require a later core task before real trader data. Keep ffmpeg/ffprobe available. Domain, DNS, firewall reachability on 80/443 and sudo/admin activation are prerequisites. HTTPS alone does not prove microphone permissions or WhatsApp webhook integration.
