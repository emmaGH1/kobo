# Session handover

## Session / lane / branch
Core lane, branch `core`. Checkpoint B remains incomplete; no merge or deployment.

## Changes
Added `src/server/tool-calls.ts` and tests: strict single completed Responses function-call parsing for four known tools, bounded Zod argument schemas, integer-only conversion of explicitly present numeric amount text and preliminary deterministic flags. These helpers are not wired into the provider or ledger. Occurrence of text alone does not prove its semantic meaning; the helpers must not be used as authorization to save. No dependency, shared config or design lane edits.

## Evidence
`src/server/MUSE-PROOF.md` records a prior successful synthetic gateway tool call, superseding earlier unsuccessful direct-Meta-only proof state. This session made no paid API calls. 27 offline tests passed; `pnpm exec tsc --noEmit`, `pnpm lint` and `pnpm build` passed. The build only contains the existing placeholder route. No rendered product UI to inspect.

## Remaining work / safety
Checkpoint B is **not complete**: implement and test channel-neutral handleMessage, safe facts-to-draft processing, complete tool definitions and read operations, separately authenticated fictional demo and passcode-protected owner with throttling and secure sessions, owner-checked API routes, unstyled /dev and safe token-usage logging. The requested three live acceptance flows were not run because no authenticated message flow exists; no live bookkeeping claim is supported. Afterwards implement due dates on credit sales, purchase stock events and spent summary, and draft reminders with wa.me links, with tests. Do not send WhatsApp messages or integrate voice. Continue enforcing explicit confirmation, append-only ledger and ownership isolation. Do not use real customer data before completing security, backup and recovery.
