# Kobo

Planned WhatsApp-first Pidgin/English bookkeeping for Nigerian market traders: text/voice → interpreted facts → trader confirmation → code calculations → append-only ledger.

**Status: setup only.** This repo contains an honest placeholder page, tooling, shared contracts and hosting templates. No transcription, AI extraction, arithmetic, ledger, authentication, mic recording or WhatsApp integration is implemented.

## Local setup
Node 22, pnpm 11.11.0 and FFmpeg/FFprobe on the VPS.
```sh
pnpm install --frozen-lockfile
pnpm dev
```
The placeholder needs no secrets. For future integrations, copy .env.example to .env.local and fill it privately; never commit values. shadcn/ui was initialized with the real CLI; no product components were added. Appearance is a neutral placeholder, not an approved visual direction.

## Checks
```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start --hostname 127.0.0.1
```
The single offline test executes an in-memory SQLite query through Drizzle/better-sqlite3. It is tooling evidence, not proof of bookkeeping correctness or model quality.

## Coordination
Read [AGENTS.md](AGENTS.md), [project brief](docs/PROJECT.md), [architecture](docs/ARCHITECTURE.md), [current state](docs/CURRENT_STATE.md) and [deployment](docs/DEPLOYMENT.md). Branches: main, core, design, docs. Folder ownership is mandatory. Commit at task checkpoints and update HANDOVER.md at session end.

Hosting is this VPS, never Vercel. HTTPS activation is blocked on an owner-supplied domain/DNS and administrator access. The sibling voice harness is private and outside this repository; never copy its recordings, results or secrets here.

## Synthetic live evaluation

See `docs/LIVE_EVAL_RESULTS.md` for the 25-case paid, opt-in evaluation, command, limitations and latest results. It uses synthetic data and does not confirm entries.
