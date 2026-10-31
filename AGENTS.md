# Kobo agent rules

## Scope and stack
Next.js App Router, TypeScript (strict), Tailwind CSS v4, real shadcn/ui (initialized only), pnpm, better-sqlite3 + Drizzle, Vitest. Node.js 22 on the VPS; never Vercel for this app. FFmpeg/FFprobe stay server-side. Setup is not a product implementation.

## Start / finish each session
Read this file, docs/PROJECT.md, docs/ARCHITECTURE.md, docs/JUDGING.md and docs/CURRENT_STATE.md. Restate the bounded task, acceptance criteria and smallest file set. Commit at every task-list checkpoint. Run typecheck, lint, tests and build; inspect rendered UI when relevant. Report actual evidence and blockers. Update docs/CURRENT_STATE.md and HANDOVER.md at the end of every session, then commit. Never put secrets or private customer data in either file. HANDOVER.md begins as a blank template; fill it on subsequent sessions.

## Lane ownership (one branch per lane)
- `core`: src/core/, src/server/, src/app/api/, src/app/dev/, db/.
- `design`: src/components/, src/app/(app)/.
- `docs`: docs/.
Never touch another lane's folders. Shared root/config files, src/lib/, src/app/layout.tsx, src/app/globals.css, route placement, dependency changes and this file require explicit human coordination, one lane at a time. Session updates to HANDOVER.md and your own CURRENT_STATE section are required coordination exceptions. This initial setup session establishes shared scaffolding only.

## Non-negotiable money / security rules
- Money is integer kobo, never floating-point naira. Validate safe integer bounds at runtime.
- The model extracts stated facts only; it NEVER does arithmetic or decides balances. Deterministic, tested code calculates totals and balances.
- Ledger is append-only. Corrections are new reversal events referencing original events, never updates/deletes of historical entries.
- Every money-changing action, including reversals, requires explicit confirmation of the current pending version by its owner. Reject stale, expired, cross-owner or already-consumed pending IDs; retries must not duplicate events.
- Ambiguous amounts are asked about, NEVER guessed or expanded (e.g. “three eight” is not automatically 3800). Missing facts remain unknown; a promise to pay is not an explicitly stated debt amount.
- Secrets are server-side only. Never expose them through NEXT_PUBLIC_ variables, client bundles, logs or tracked files. Authenticate owner access; verify WhatsApp webhook signatures before trusting sender IDs.
- Audio paths are trusted server-created references, never arbitrary client-provided filesystem access. Store private media outside public/ and delete on a defined retention schedule.
- Never read .env values into chat. Never copy voice-harness recordings, results, raw transcripts or personal facts into this repo, tests, screenshots or Git. ../kobo-voice-test is read-only and separate from this repository. No API calls or costs without approval.

## UI guardrails (hackathon playbook)
Real shadcn/ui primitives only; initialization does not constitute a design system. No substantial product UI before human approval of a design probe. Use intentional typography (at most two families), hierarchy, contrast, spacing and accessible mobile behavior. No default blue/purple gradients, glow, glassmorphism, blobs, decorative motion, meaningless live/status dots or AI badges, fabricated metrics/users/results/logs/testimonials, endless identical cards, emoji icons or generic hero filler. A chat UI is justified only by genuine conversation needs. Never claim integration, microphone, accuracy or deployment works without testing it. A build passing is not proof the rendered UI works.

## Delivery
GitHub is source of truth. Branches: main (stable), core, design, docs. Do not merge or deploy feature work without approval. Stop at scope/architecture/design gates; no silent feature expansion. Local private files and databases must never be pushed.
