# Session handover

## Session / lane / branch
Design lane, branch `design`. Logo and design probe step (playbook 4.5). At the owner's request, the docs are written on `design`.

## Bounded task and checkpoints
Write docs/DESIGN.md (direction, tokens, naira rules, WhatsApp message formats, summary card, landing layout, logo direction, core endpoints the landing chat needs), then stop for owner approval.

## Changes and commits
Added docs/DESIGN.md, docs/design/logo-review-r1.png (3 logo concepts), docs/design/type-specimen.png. No UI code, no shared or config files, no core files.

## Verification evidence
Fonts were checked with fontTools for the ₦ glyph and tnum: Familjen Grotesk passes, Schibsted, Instrument, Geist and others fail. Palette contrast was computed (WCAG): all text tokens are ≥5.5:1 except ink-3, which is 3.5:1 and reserved for meta text. The logo sheet was rendered in headless Chromium and inspected.

## Blockers / unresolved decisions
Owner must approve the direction and pick logo A, B or C (B recommended). Core must decide on the ReplyView contract extension and the /api/demo/* endpoints. Shared-file coordination is needed for page.tsx, layout.tsx, globals.css and a PNG renderer dependency. The Pidgin copy needs a native-speaker check.

## Next single action
Owner reviews DESIGN.md and the logo sheet, then approves the direction or requests changes.
