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

## v3 redesign (2026-11-02)
The owner found v2 generic. The landing was rebuilt around a self-playing film (phone conversation plus a book that writes itself, generated from the tested engine) under the philosophy "show the transformation, not the interface". Verified: 15 vitest, eslint, typecheck, build; 1440 and 390 with no overflow; film recorded to docs/design/probe-v3/kobo-film.mp4.

## v3.1: the film shows the whole day (2026-11-02)
At the owner's request the film now covers six chapters: stock bought, credit sale with due date, unclear amount, who owes me, day summary, Friday reminder with a drafted customer message. The demo engine gained purchases, due dates (code resolves weekdays), dueReminders, reminderDraft and the summary; 21 tests. **Core must build purchases, due dates, reminders and the summary changes** (DESIGN.md, "Core lane: needed before the landing page's claims are true").

## Blockers / unresolved decisions
Direction approved and logo B picked (2026-11-01). Core must decide on the ReplyView contract extension and the /api/demo/* endpoints. Shared-file coordination is needed for page.tsx, layout.tsx, globals.css and a PNG renderer dependency. The Pidgin copy needs a native-speaker check.

## Summary card and owner decisions (2026-11-02)
The owner authorized pushing `design` and a summary image card in `src/app/og/`. The card renderer uses next/og, pre-calculated integer-kobo inputs, and bundled DejaVu Sans (with license); `GET /og` is a public, explicitly labelled **sample only**, with no query-parameter data. Rendering uses no ledger or WhatsApp integration. Real cards need owner-authenticated data retrieval, core-calculated totals, safe delivery, and layout checks for long names/amounts before production. Do not expose trader data through a public URL. Visual inspection of the 1080×1350 PNG succeeded; typecheck, lint, 23 tests and build passed (metadataBase warning remains).

The owner says the film may remain scripted and labelled as a film, including purchases, due dates and reminders because core is adding them. Your turn must use the real backend when its API lands; then delete the scripted engine without breaking the film (film currently depends on it, so decouple first). No claim that core's work has shipped. Sample voice recording and Pidgin review remain open.

Shared paths changed against `main`: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/apple-icon.png`, `src/app/favicon.ico`, `src/app/icon.png`, `src/app/opengraph-image.png`, `src/app/fonts/`, plus `HANDOVER.md` and `docs/CURRENT_STATE.md`. New route `src/app/og/` requires route-placement coordination; `docs/DESIGN.md` and `docs/design/` are in the docs lane. No package or lockfile change.

## Next single action
Coordinate core's API contract and arrival, then integrate Your turn and preserve a decoupled scripted film. Coordinate real summary data and private delivery separately.
