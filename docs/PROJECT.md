# Kobo — project brief

## User and promise
Nigerian market traders need a low-friction way to record business activity without spreadsheets. Kobo is a **planned WhatsApp-first Pidgin/English bookkeeping agent**: voice note or text in → AI interprets stated facts → trader reviews and explicitly confirms → deterministic code calculates → append-only ledger records the result.

## Event / deadline
Meta Global AI Developer Hackathon. Owner-provided deadline: November 4, 9pm ET = November 5, 2am Lagos. Year and official rules/rubric have not been independently verified in this setup session. Do not change this supplied deadline based on assumptions.

## Approved setup scope
Next.js App Router / TypeScript / Tailwind / real shadcn initialization, better-sqlite3 with Drizzle, Vitest, channel-neutral TypeScript contracts, private GitHub repo, lane branches, VPS hosting scaffolding and an honest placeholder page. No product features in this thread.

## Planned minimum journey (not implemented)
A trader sends English/Pidgin text or voice. The system preserves uncertainty, asks about ambiguous amounts and presents a review summary. The trader chooses `1 save / 2 edit / 3 cancel`. Saving requires an authenticated, owner-bound pending ID. Code calculates integer-kobo amounts and appends immutable events. Corrections append reversals, with confirmation.

## Safety and evidence
The model never calculates balances. Missing or ambiguous amounts are never guessed. Secrets and audio remain server-side/private. Prior local voice evaluation found customer-name and monetary-shorthand errors; it is not a representative accuracy benchmark. Its recordings/results stay outside this repo and must never be pushed. No speech-accuracy, live-WhatsApp or ledger claims are established here.

## Hosting and non-goals
Run on this VPS, not Vercel: persistent SQLite storage, FFmpeg and HTTPS for future Android microphone use and WhatsApp webhook. Prefer installed Coolify; otherwise Caddy + systemd running `next start`. No payments, autonomous writes, accounting-suite scope, fabricated metrics, landing-page design or demo film in setup.

## Setup acceptance
Typecheck, lint, offline tests and production build pass; SQLite driver executes an in-memory query through Drizzle; private remote and main/core/design/docs exist; docs/contracts accurately distinguish planned from implemented. HTTPS requires a supplied domain, DNS and privileged host configuration, then actual external verification.
