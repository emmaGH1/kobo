# Session handover

## Session / lane / branch
Design lane, branch `design`. Logo and design probe step (playbook 4.5). At the owner's request, the docs are written on `design`.

## Bounded task and checkpoints
Write docs/DESIGN.md (direction, tokens, naira rules, WhatsApp message formats, summary card, landing layout, logo direction, core endpoints the landing chat needs), then stop for owner approval.

## Changes and commits
Added docs/DESIGN.md, docs/design/logo-review-r1.png (3 logo concepts), docs/design/type-specimen.png. After approval: the logo B export set is in docs/design/logo/ (outlined SVGs, icon/favicon/apple-touch/og) and DESIGN.md is marked approved. No UI code, no shared or config files, no core files.

## Verification evidence
Fonts were checked with fontTools for the ₦ glyph and tnum: Familjen Grotesk passes, Schibsted, Instrument, Geist and others fail. Palette contrast was computed (WCAG): all text tokens are ≥5.5:1 except ink-3, which is 3.5:1 and reserved for meta text. The logo sheet was rendered in headless Chromium and inspected.

## Probe build (2026-11-01)
Landing page built: hero + scripted chat, how it works, safety example, footer. Files: src/app/{page,layout,globals.css,fonts,icons}, src/components/{ui,kobo,chat,landing}. Verified: typecheck, eslint, 11 vitest, production build pass; rendered at 390 and 1366 widths with no horizontal overflow and no console output; chat flow clicked through (amount question, review, save, debtor list, sample voice). See DESIGN.md section 10.

## v2 redesign (2026-11-01)
The owner rated v1 1/10. The landing was rebuilt with the Walos layout, the Lavender/Graphite theme, Geist Serif and an interactive WhatsApp-on-iPhone hero; logo round 2 used concept C provisionally. Verified: typecheck, eslint, 11 vitest, build pass; rendered at 390 and 1440 with no overflow; phone flow clicked through (amount question, review, save, debtors list sheet, history, sample voice). Screens are in docs/design/probe-v2/.

## Blockers / unresolved decisions
Direction approved and logo B picked (2026-11-01). Core must decide on the ReplyView contract extension and the /api/demo/* endpoints. Shared-file coordination is needed for page.tsx, layout.tsx, globals.css and a PNG renderer dependency. The Pidgin copy needs a native-speaker check.

## Next single action
Logo C picked and exported (docs/design/logo/). Next: core builds /api/demo/* and ReplyView, then swap the scripted engine for the real client; record the sample voice note; build the summary card. On approval: core builds /api/demo/* and ReplyView, then swap the scripted engine for the real client.
