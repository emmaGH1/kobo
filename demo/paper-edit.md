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
| M3a | 0:47 | WhatsApp in the phone, tilted in 3D on graphite; Nkechi's voice note about Bayo's oil, "0:05" timer | phone component | push-in |
| M3b | 0:55 | transcript appears; Bayo / groundnut oil / ₦3,800 / Friday get lavender marks one by one; small labels "Muse Voice", "Muse Spark" | wa-text component | marks in sequence |
| M3c | 1:02 | the review card pulls out of the phone ("Remain go pay: Fri 6 Nov"); "1 Save" tapped; Bayo's floating card from M1 snaps into the book as an owed row | review card, book panel | card pull-out, then the landing's "lands in the book" motion |
| M3d | 1:07 | one quick beat: a small "₦3,800 or ₦38,000?" chip appears and resolves, no full-screen poster | review card | 1.5s, light touch |
| M4a | 1:10 | "Who dey owe me?": the debtors list, biggest first, days owed beside each name | phone + book panel | list rows cascade in |
| M4b | 1:20 | "Show me Bayo": his history lifts out as a card (sale, promise, due date) | customer history card | card pull-out |
| M4c | 1:30 | stock / collected / credit totals roll; the 1080×1350 summary card arrives in chat and lifts off the phone | summary card (`src/app/og`) | number roll, card pull-out |
| M5a | 1:45 | quiet; date stamp "Friday 8:00 AM"; the reminder message arrives (4.10) | phone | single notification sound in the silence |
| M5b | 1:55 | "Draft message" tapped; the drafted reminder to Bayo (4.11) slides up; footer "Na you go send am" | phone | push-in on the draft |
| M5c | 2:08 | "Bayo pays": a short voice note "Bayo don pay the oil money"; review; save; Bayo's row turns paid; his balance rolls to ₦0 | phone + book panel | number roll to ₦0, paid green |
| M6 | 2:20 | every remaining floating card from M1 files itself into the book; "later" written in biro and struck through; pull back to the logo and end card | motion | pull back |

## Sound

- Three music beds, crossfaded: **soft** (M1, M5 under the payoff, M6), **pulse** (M2, M3), **groove** (M4). The groove drops to silence for one beat before Friday's notification lands.
- Free-license sources only (Pixabay Music, YouTube Audio Library). Log every track in CREDITS.txt.
- Narration is always on top; music ducks under it. Sound effects only when something lands (a soft paper tap when a row enters the book, a click on "1 Save").

## Rules

- One easing family (ease-in-out). Camera moves 400–700ms. Text in about 300ms, out about 200ms.
- Captions: one line, fixed position, word by word, at most one lavender word per line.
- No invented stats, users or testimonials. Every amount on screen is labelled sample data or comes from a real capture.
- Nkechi, Bayo and every amount are sample characters and data. Never present them as real people or real usage.
- Bayo's oil is the thread through the whole film: an unwritten "later" card in M1, a spoken entry in M3, a name on the debtors list in M4, the Friday reminder and payment in M5. The emphasis is memory, reminders and drafted messages; "never guesses money" is a single short beat.
