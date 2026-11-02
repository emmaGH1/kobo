# Kobo demo paper edit (gate 2, draft v2)

Follows `hackathon-playbook/phases/06-demo.md` (emmaGH1/emmaGH1). Narration, tone and music cues are in `demo/script.md`. Tokens come from `docs/DESIGN.md`: Geist Serif for the record, Geist Sans for UI, graphite `#2D2C2A`, lavender `#92A9E1` = "Kobo noticed this", paid/owed colours only for money direction.

**Format:** 1920×1080, 30fps, about 2:52 (limit 3:00).
**Phone shots:** the iPhone frame drawn in code (`src/components/chat/phone.tsx`) with Kobo's real message formats, driven by the scripted demo engine for now. **Before submission, re-capture M3 to M6 from the real backend** through the "your turn" web chat (Playwright, same frame). Anything shown working must work there by then, or it gets cut.
**Grade:** graphite world, soft lavender glow, paper-white surfaces for the book and cards. Market footage graded warm, then cooled toward graphite as M1 turns into abstraction.

## The motif: "later"

Every unwritten sale is a small floating card (item, name, amount) drifting around the shopkeeper in M1. As "later" grows, the cards multiply, overlap, and their labels swap and blur (the cream's name slides onto the wrong person). In M3 to M5 Kobo turns each spoken sale straight into a solid row in the book. In M6 the last drifting card snaps into place and the word "later" is struck through. The film opens with chaos and ends with every card filed.

| # | time | picture | source | move |
|---|---|---|---|---|
| M1a | 0:00 | black, market ambience, then a wide Nigerian market in golden light | Pexels clip 3 (keke, grain sacks, umbrellas) | slow push |
| M1b | 0:05 | "This is Nkechi": footage dissolves into graphite line art of a provision stall; "Nkechi Provisions" on the board | motion | match dissolve |
| M1c | 0:10 | floating "later" cards: *Cabin biscuit · ₦1,500 · tomorrow?*, *Groundnut oil · Bayo · ₦3,800 · Friday?* | motion | cards drift up |
| M1d | 0:20 | "ten people": cards multiply, labels swap, a carton count "?" blinks out | motion | slow orbit, focus breaks |
| M1e | 0:28 | quick cuts of real market footage | Pexels: Lagos market women trading; Côte d'Ivoire as texture only | cuts every ~1.5s |
| M2 | 0:35 | the cards collapse into the [k] tile; the stub drops into the notch; tagline types in | logo SVG | percussion hit on the stub |
| M3 | 0:41 | a photo of a handwritten notebook page slides into the chat; Muse Spark's read lifts each line out (name, amount) into a review list; "1 Save"; rows land in the book as opening balances | phone + review card + book panel | card pull-out, rows cascade into the book |
| M4 | 0:56 | Bayo voice note "0:05"; transcript with lavender marks on Bayo / oil / ₦3,800 / Friday; review card with "Remain go pay: Fri 6 Nov"; "1 Save"; Bayo's M1 card snaps into the book; a 1.5s "₦3,800 or ₦38,000?" chip resolves | phone, wa-text, review card | marks in sequence, card lands in the book |
| M5a | 1:16 | "Who dey owe me?": debtors with days owed | phone + book panel | rows cascade |
| M5b | 1:24 | "How many oil remain?": stock count rolls down after each sale; a low-stock warning | phone + stock card | number roll |
| M5c | 1:32 | "Wetin sell pass this week?": top products and best customers as a ranked list | phone | rows slide in |
| M5d | 1:39 | receipt image for a customer lifts off the phone | receipt card (next/og) | card pull-out |
| M5e | 1:46 | the nightly summary card arrives and lifts off | summary card (`src/app/og`) | number roll, card pull-out |
| M6a | 1:52 | silence; "Friday 8:00 AM"; the reminder (4.10) arrives | phone | one notification sound |
| M6b | 2:02 | "Draft message" tapped; the drafted reminder to Bayo (4.11); "Na you go send am" | phone | push-in |
| M6c | 2:12 | "Bayo don pay the oil money"; review; save; his balance rolls to ₦0, paid green | phone + book panel | number roll to ₦0 |
| M7 | 2:20 | exploded architecture on graphite: a voice note flows into a "Muse Voice" node (with a chip list of her customer and product names as hints) → text → a "Muse Spark" node → labelled tool calls (record_sale, record_payment, get_balance) → a "code" ledger block → back to WhatsApp. The notebook photo enters Muse Spark the same way | motion diagram in Kobo's tokens | each node lights as the narration names it |
| M8 | 2:42 | every remaining floating card from M1 files itself into the book; "later" written in biro and struck through; pull back to logo and end card | motion | pull back |

## Sound

- Three music beds, crossfaded: **soft** (M1, M6 under the payoff, M8), **pulse** (M2 to M4, M7), **groove** (M5). The groove drops to silence for one beat before Friday's notification lands.
- Free-license sources only (Pixabay Music, YouTube Audio Library). Log every track in CREDITS.txt.
- Narration is always on top; music ducks under it. Sound effects only when something lands (a soft paper tap when a row enters the book, a click on "1 Save").

## Rules

- One easing family (ease-in-out). Camera moves 400–700ms. Text in about 300ms, out about 200ms.
- Captions: one line, fixed position, word by word, at most one lavender word per line.
- No invented stats, users or testimonials. Every amount on screen is labelled sample data or comes from a real capture.
- Nkechi, Bayo and every amount are sample characters and data. Never present them as real people or real usage.
- Bayo's oil is the thread through the whole film: an unwritten "later" card in M1, a spoken entry in M3, a name on the debtors list in M4, the Friday reminder and payment in M5. The emphasis is memory, reminders and drafted messages; "never guesses money" is a single short beat.
