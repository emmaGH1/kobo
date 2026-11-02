# Kobo demo paper edit (gate 2, draft v1)

Follows `hackathon-playbook/phases/06-demo.md` (emmaGH1/emmaGH1). Narration is in `demo/script.md`. Look and tokens come from `docs/DESIGN.md` (Geist Serif for the record, Geist Sans for UI, graphite `#2D2C2A`, lavender `#92A9E1` = "Kobo noticed this", paid `#2F6B48` and owed `#A63D2A` only for money direction).

**Format:** 1920×1080, 30fps, about 2:22 (limit 3:00).
**Phone shots:** an iPhone frame drawn in code (`src/components/chat/phone.tsx`). The screen content comes from Kobo's real message formats. For now it's driven by the scripted demo engine. **Before submission, re-capture S4 from the real backend** through the "your turn" web chat (Playwright, inside the same frame). Anything the video shows working must work in that chat by then, or it gets cut.
**Grade:** dark graphite world with a soft lavender glow (Kobo's version of TourIQ's warm dark grade). Book and card surfaces stay paper-white so they read like a ledger.

| # | time | narration (from script.md) | designed picture | source | move |
|---|---|---|---|---|---|
| S1a | 0:00 | "Walk into any provision store…" | Lagos market, slow and wide | Pexels: Lagos market women trading (Shedrack Salami) | slow push, graded toward graphite |
| S1b | 0:07 | "…reach under the counter for a notebook." | a notebook page drawn in code: ruled lines, biro figures writing themselves | motion (Kobo serif plus a biro-blue stroke) | match cut from the market to the page |
| S1c | 0:11 | *"Mama Chidi. Two bags of rice…"* | the line writes itself on the page; "45,000" and "Friday" get lavender marks | motion | number roll on 45,000 |
| S1d | 0:16 | "…fails her quietly. Pages tear, figures smudge…" | the page ages: ink smudges, "Friday?" blurs, the totals don't add up (a red question mark) | motion | slow tilt, focus breaks |
| S1e | 0:24 | "She already runs everything on WhatsApp." | the notebook page slides away to reveal a phone with WhatsApp open | motion + phone component | match cut: page edge → phone edge |
| S2 | 0:28 | "So I built Kobo." | the [k] tile: the k lands, the stub drops into the notch, "obo" types in | `docs/design/logo/logo.svg` (separate #tile #stub #k #wordmark) | logo reveal on lavender glow |
| S3a | 0:33 | "a bookkeeper that lives in WhatsApp…" | the phone tilted in 3D on graphite, a voice-note bubble playing (waveform) | phone component | push-in |
| S3b | 0:42 | "Muse Voice writes it down. Muse Spark picks out…" | the transcript appears under the voice note; who/what/how much/when get lavender marks one by one; small tags "Muse Voice" and "Muse Spark" | wa-text component | marks animate in sequence |
| S3c | 0:50 | "It reads it back to her first." | the review card (section 4.1) pulls out of the phone and floats forward; the 1 save / 2 edit / 3 cancel buttons visible | review card | card pull-out, background blurs |
| S3d | 0:56 | "…like 'three eight'…" | the ₦3,800 *or* ₦38,000? poster: huge serif numbers, "or" in ink-2 | poster from the landing ("the rule") | number roll; the two amounts split apart |
| S3e | 1:03 | "…plain code does the maths… nothing is ever erased." | the confirmed row drops into the book panel; a correction appears as a new line under it, the original stays | book panel | card lands in the book (the landing's signature motion) |
| S4 | 1:10 | "Morning… Noon… Afternoon… Evening…" | the film: phone left, book right, chapter bar on top (7:52 AM → 8:00 PM). Continuous phone capture, no cuts inside a chapter | landing film (`src/components/landing/film.tsx`), later re-captured from the real backend | chapter labels act as scene titles; zooms on key replies use 4K screenshots |
| S5a | 1:55 | "On Friday morning, Kobo reminds her…" | the reminder message (4.10) arrives; "Draft message" tapped; the drafted text (4.11) appears | phone component | push-in on the drafted text |
| S5b | 2:03 | "Kobo never messages her customers." | the footer line "Na you go send am. Nothing go out without you." highlighted | phone | hold |
| S6 | 2:10 | "No new app… Kobo keeps the book." | pull back: the phone shrinks into the book, the book closes into the logo; url and repo; "Built with Muse Spark and Muse Voice" | motion | pull back to the end card |

## Rules for this video

- One easing family (ease-in-out). Camera moves 400–700ms. Text in about 300ms, out about 200ms.
- Captions: one line, fixed position, word by word, at most one lavender word per line. Pidgin lines are captioned with a small English translation underneath.
- Sound: narration on top, music ducked under it, sound effects only when something lands (a soft paper tap when a row enters the book).
- No invented stats, users or testimonials. Every amount on screen is labelled sample data or comes from a real capture.
- Speed ramps over slow real steps are labelled ("2×").

## Open questions for Emmanuel

1. Music: calm afrobeats instrumental, or ambient piano? (Needs a free license: Pixabay Music or YouTube Audio Library.)
2. Pidgin lines inside the phone: is the copy in DESIGN.md section 4 natural to you? Fix anything that sounds off before capture.
3. Clip 3 (`pexels.com/download/video/39541763`): send its page link (not the download link) so the license and creator can be logged.
