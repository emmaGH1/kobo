# Kobo demo paper edit (gate 2, draft v2)

Follows `hackathon-playbook/phases/06-demo.md` (emmaGH1/emmaGH1). Narration, tone and music cues are in `demo/script.md`. Tokens come from `docs/DESIGN.md`: Geist Serif for the record, Geist Sans for UI, graphite `#2D2C2A`, lavender `#92A9E1` = "Kobo noticed this", paid/owed colours only for money direction.

**Format:** 1920×1080, 30fps, about 2:30 (limit 3:00).
**Phone shots:** the iPhone frame drawn in code (`src/components/chat/phone.tsx`) with Kobo's real message formats, driven by the scripted demo engine for now. **Before submission, re-capture M5 from the real backend** through the "your turn" web chat (Playwright, same frame). Anything shown working must work there by then, or it gets cut.
**Grade:** graphite world, soft lavender glow, paper-white surfaces for the book and cards. Market footage graded warm, then cooled toward graphite as M1 turns into abstraction.

## The motif: "later"

Every unwritten sale is a small floating card (item, name, amount) drifting around the shopkeeper in M1. As "later" grows, the cards multiply, overlap, and their labels swap and blur (the cream's name slides onto the wrong person). In M3 to M5 Kobo turns each spoken sale straight into a solid row in the book. In M6 the last drifting card snaps into place and the word "later" is struck through. The film opens with chaos and ends with every card filed.

| # | time | picture | source | move |
|---|---|---|---|---|
| M1a | 0:00 | black, market ambience, then a wide Nigerian market in golden light | Pexels clip 3 (keke, grain sacks, umbrellas) | slow push |
| M1b | 0:05 | "This is Nkechi": footage softens into thin graphite line art of a provision stall (shelves of tins, a pack of biscuits, oil bottles); "Nkechi Provisions" lettered on the board | motion | match dissolve from footage to line art |
| M1c | 0:10 | the biscuit sale: a card floats off the counter (*Cabin biscuit · ₦1,500 · tomorrow?*) | motion | card drifts up |
| M1d | 0:17 | the oil: a second card (*Groundnut oil · Bayo · ₦3,800 · Friday?*) | motion | card drifts up |
| M1e | 0:23 | "By evening, it's ten people": cards multiply; labels swap (the oil slides onto the wrong name), a lone "₦2,000 · ?" hangs with no name | motion | slow orbit, focus breaks |
| M1f | 0:33 | "Every market in Nigeria…": quick cuts of real market footage | Pexels: Lagos market women trading; Côte d'Ivoire clip as texture only | cuts every ~1.5s |
| M2 | 0:40 | the drifting cards collapse into one point, which becomes the [k] tile; the stub drops into the notch; tagline types in | logo SVG (#tile #stub #k #wordmark) | percussion hit on the stub landing |
| M3a | 0:47 | WhatsApp in the phone, tilted in 3D on graphite; a voice-note bubble with a "0:05" timer | phone component | push-in |
| M3b | 0:55 | transcript under the voice note; who/what/how much/when get lavender marks one by one; small labels "Muse Voice", "Muse Spark" | wa-text component | marks in sequence |
| M3c | 1:05 | the review card pulls out of the phone, floats forward; "1 Save" tapped; the row drops into the book panel | review card, book panel | card pull-out, then the landing's signature "lands in the book" motion |
| M4 | 1:15 | Bayo's floating card from M1 drifts in; "three eight" as a voice bubble; silence; the ₦3,800 *or* ₦38,000? poster fills the frame, the two numbers split apart; Kobo's question with the two buttons; one tapped | poster + phone | hard cut to the poster in the silence; music returns on "It asks." |
| M4b | 1:30 | "plain code… nothing is ever erased": a correction appears as a new line under the original, the original stays | book panel | quiet hold |
| M5 | 1:40 | the film: phone left, book right, chapter bar (morning → noon → evening → night); the summary card arrives at the end | landing film, later re-captured from the real backend | chapter labels as scene titles; zooms on 4K screenshots |
| M6a | 2:10 | Friday 8:00 AM reminder; "Draft message" tapped; the drafted text; footer "Na you go send am" | phone | push-in on the drafted text |
| M6b | 2:22 | the last floating card from M1 snaps into the book; "later" is written and struck through; pull back to the logo and end card | motion | pull back |

## Sound

- Three music beds, crossfaded: **soft** (M1, M6), **pulse** (M2, M3), **groove** (M5). **Silence** for M4's question.
- Free-license sources only (Pixabay Music, YouTube Audio Library). Log every track in CREDITS.txt.
- Narration is always on top; music ducks under it. Sound effects only when something lands (a soft paper tap when a row enters the book, a click on "1 Save").

## Rules

- One easing family (ease-in-out). Camera moves 400–700ms. Text in about 300ms, out about 200ms.
- Captions: one line, fixed position, word by word, at most one lavender word per line.
- No invented stats, users or testimonials. Every amount on screen is labelled sample data or comes from a real capture.
- Nkechi, Bayo and every amount are sample characters and data. Never present them as real people or real usage.
- The ₦3,800 oil in M1 is deliberately the same "three eight" in M4: the viewer already knows the real amount, so the question lands.
