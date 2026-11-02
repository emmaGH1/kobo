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
Not started. Owns src/core/, src/server/, src/app/api/, src/app/dev/, db/. Shared contract types exist; handlers, schema, arithmetic, authentication and integrations do not.

## Design lane
Landing v3 design preview and selected logo C are on `design`; the film and interactive chat currently use a scripted engine. Owner directed: retain a clearly labelled scripted film (including purchases, due dates and reminders), but connect Your turn to core's real API when available and then remove its scripted engine without breaking the film. The owner says core is adding these features; verify on integration. `src/app/og/` now renders a 1080×1350 sample summary PNG with next/og, including stock; `/og` serves sample data only, not private ledger data. Real-data aggregation, authorization and WhatsApp delivery remain unimplemented. The card currently uses bundled DejaVu Sans as an image-rendering font, not the landing Geist fonts. See HANDOVER.md for coordination.

## Docs lane
Initial setup documents exist. Official rubric/submission requirements remain unverified.

## Next single action
Owner supplies the domain/subdomain and arranges the administrator activation step in docs/DEPLOYMENT.md. Do not start product features in this setup thread.
