# Kobo design direction

Status: **design probe, round 1. Not approved yet.** Nothing in this file should be built until the owner approves the direction and picks a logo (playbook 4.5F and 4.5I stop gates). Every amount, name and date below is sample copy for layout only. None of it is real data, a metric or a result.

Lane note: the owner asked for this file on the `design` branch, even though `docs/` normally belongs to the docs lane. Building the landing page touches shared files (`src/app/page.tsx`, `src/app/layout.tsx` for fonts, `src/app/globals.css` for tokens) and needs `/api/demo/*` from core. All of that needs coordination before the build step (see section 9).

---

## 1. Direction

Kobo is the trader's own notebook, carried on into WhatsApp. Recording, confirming and reading the book all happen in chat. The web pieces (landing page, summary card, optional web book) exist to explain the chat or extend it, never to compete with it. The look comes from a market trader's exercise book: warm paper, faint blue ruled lines, biro-blue ink, figures written large and honestly, totals underlined once. That idea shows up as structure (rule rhythm, tabular columns, one hand-drawn underline or circle at most per view). It never shows up as decoration: no paper textures, coffee stains, washi tape or handwriting fonts.

- **Feels like:** a trustworthy ledger, calm, plain-spoken, Nigerian market, exact.
- **Must not feel like:** a WhatsApp clone, a Threads/X feed, a generic AI chat, a fintech SaaS template (gradients, glass, floating cards, stat rows), or a "cute" notebook with skeuomorphic kitsch.
- **Design profile:** mobile-first; medium information density; low interaction density (chat plus a few taps); trust level high (money); visual energy low to medium; primary emotion is *"it wrote down exactly what I said, and it asked before saving."*
- **Signature motif:** **the ruled line.** Body text sits on a 28px rule rhythm in "book" surfaces (chat panel, summary card, web book). Totals get one biro underline. The single most important uncertain figure gets one hand-drawn biro circle (the safety example). That's the whole motif.
- **Colour rule:** biro blue is the only accent. Green means **paid** and red means **owed**, and they appear nowhere else. WhatsApp green (#25D366 or #075E54) is never used.

## 2. Tokens

### Colour

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `paper` | `#F4F0E6` | page background, card background | n/a |
| `paper-sunken` | `#EAE4D6` | chat panel, input field, chips | n/a |
| `rule` | `#C9D3E3` | ruled lines, hairline dividers (1px) | decorative only |
| `ink` | `#1B1A17` | text, numbers, dark section background (`night`) | 15.3:1 on paper |
| `ink-2` | `#5C574D` | secondary text, second clause of headline | 6.3:1 |
| `ink-3` | `#847E72` | timestamps and meta, **only ≥14px or non-essential** | 3.5:1 |
| `biro` | `#2A3A9E` | the single accent: primary buttons, links, logo detail, underline/circle marks, Kobo's chat bubble edge | 8.4:1; white on biro 9.6:1 |
| `biro-soft` | `#DEE2F5` | selected chip, highlighted pending row | n/a |
| `paid` | `#1D6E43` | money received / balance cleared, nothing else | 5.5:1 |
| `paid-soft` | `#DCEBDF` | paid row tint (rare) | n/a |
| `owed` | `#B0261C` | money owed / credit given, nothing else | 5.9:1 |
| `owed-soft` | `#F6DEDA` | owed row tint (rare) | n/a |
| On `night` (`#1B1A17`): text `#F4F0E6`, accent `biro-night #9AA6F2` (7.5:1), `paid-night #6FCF97`, `owed-night #F2877C`, meta `#A39E92` | | used only in the dark safety section and the dark logo variant | all ≥6.5:1 |

No gradients, shadows on content, glow or blur. One permitted shadow: the chat panel in the hero gets `0 1px 0 rule` (a hairline under it, like a page edge). Dark mode is not in scope. The landing page has exactly one `night` section.

### Type

Two families, both checked to include the **₦ glyph (U+20A6)** and tabular figures. Schibsted Grotesk, Instrument Sans, Geist, Figtree, Onest and Hanken were rejected because they **lack ₦**. Specimen: `docs/design/type-specimen.png`.

- **Familjen Grotesk** (Google Fonts, variable 400–700, OFL): everything (display, UI, chat, amounts). It's a warm grotesk with a single-storey `a` that reads written-by-hand without being a handwriting font. Always set amounts with `font-feature-settings: "tnum"` (`tabular-nums`).
- **IBM Plex Mono** 400/500 (OFL): only for receipt metadata on the summary card (dates, ref numbers, "counted by code" line), the customer-history ledger table in the web book, and micro labels. Plex digits are fixed-width by design. Never use it for headlines or chat body.

| Role | Mobile | ≥1024px | Weight / tracking / leading |
|---|---|---|---|
| `display` (hero) | 40px | 72px | 600 / −0.025em / 1.02 |
| `h2` | 28px | 44px | 600 / −0.02em / 1.08 |
| `h3` | 20px | 24px | 600 / −0.01em / 1.2 |
| `body` | 17px | 18px | 400 / 0 / **28px** (the rule rhythm) |
| `small` | 14px | 14px | 400 / 0 / 20px |
| `micro` (Plex Mono) | 12px | 12px | 400–500 / +0.06em / UPPERCASE |
| `amount-xl` | 56px | 96px | 600 / −0.02em / 1.0 / tnum |
| `amount-l` | 32px | 40px | 600 / −0.015em / tnum |
| `amount` (inline) | inherits | inherits | 600 / tnum |

Headlines use the two-tone split from the Synais reference: first clause `ink`, second clause `ink-2`, same weight.

### Spacing, layout, radius

- 4px base. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Rule rhythm: 28px. Ruled surfaces draw `repeating-linear-gradient(to bottom, transparent 0 27px, rule 27px 28px)` aligned to the text baseline grid. This is the one place a CSS gradient is allowed: it draws lines, not a colour wash.
- Container: max 1200px, gutters 20px mobile / 32px tablet / 48px desktop. 4 columns on mobile, 12 at ≥1024px.
- Section spacing: 64px mobile, 128px desktop.
- Radius: controls and buttons **4px**; chips 6px; panels and cards **8px**; chat bubbles 12px with the corner nearest the speaker squared (2px). No pills, no rounded-square icon tiles.
- Borders: 1px `rule` or 1px `ink` at 12% opacity. Primary button: solid `biro`, paper text. Secondary button: 1px `ink` outline, transparent.
- Tap targets ≥44px. Icons: lucide at 1.5px stroke, `ink`, never inside tinted squares. No Sparkles/Bot/Brain icons.
- Motion: a message appears with 120ms opacity plus a 4px rise. A typing indicator (three dots, `ink-3`) shows only while a real request is in flight. `prefers-reduced-motion` turns both off. Nothing else moves.

## 3. Naira formatting rules

All money is integer kobo from core. Formatting lives in one shared, tested function. Design specifies the output; core or shared code implements it.

1. Symbol `₦` (U+20A6), no space: `₦3,800`. Never `N3800`, `NGN 3,800` or `3.8k`. The exception is outbound plain-text fallbacks where a renderer might lack the glyph; WhatsApp renders ₦ fine, so use it there.
2. Thousands separator is a comma, always, including 4-digit amounts: `₦3,800`, not `₦3800`.
3. Kobo fraction is shown **only when non-zero**, and then always 2 digits: `₦3,800.50`. Never `₦3,800.00`.
4. **Never abbreviate** (k, m, "3.8k") anywhere a figure is being confirmed, saved or summed. Abbreviations are input the trader may say; Kobo always writes the full figure back.
5. Never use a minus sign or brackets to mean debt. Direction is a word plus a colour: "owes ₦33,500" (`owed`), "paid ₦20,000" (`paid`). In mono ledger tables, columns are labelled instead of signed.
6. Amounts are tabular and right-aligned in any column or stack. In prose they sit inline, bold (`*₦45,000*` in WhatsApp).
7. When an amount came from a voice note, the review shows **what was heard** as a quote next to the number Kobo intends to save (see section 4.1). The trader checks against their own words.
8. Ambiguous figures are never formatted as a decision. They are shown as a question (section 4.2) and confirmation stays blocked until it's answered.
9. Zero balance: "owes nothing" / "e don clear", in `paid`. Never "₦0 owed".
10. Formatting is display only. It never feeds back into arithmetic.

## 4. WhatsApp message formats

General rules:
- **Pidgin first, English fallback.** Reply in the language of the trader's last message. If detection is unsure, reply in English. Typing `English` or `Pidgin` switches and remembers the choice. Every message below has both versions. The Pidgin is plain market Pidgin, not comic. **Have a native speaker check it before launch.**
- WhatsApp formatting used: `*bold*` for names and amounts, `_italic_` for small print, `> quote` for what Kobo heard, `- ` bullet lists, `1. ` numbered lists, and ```` ``` ```` monospace blocks for ledger tables (bold doesn't work inside these). No emoji anywhere. Kobo is a book, not a mascot.
- **Interactive types:** *reply buttons* (max 3 buttons, title ≤20 chars, body ≤1024, footer ≤60) when there are ≤3 actions. *List messages* (one button ≤20 chars, ≤10 rows, row title ≤24, description ≤72) when choosing from people. Interactive messages only work inside the 24-hour customer-service window. Outside it, only approved **templates** can be sent (the daily summary is a template).
- **No button-only dependency** (ARCHITECTURE.md). Every buttoned message also accepts the typed equivalent, and review messages always carry the exact `1 save / 2 edit / 3 cancel` footer. Button payload IDs carry `action:pendingId:version` and go through the same ownership/version checks as typed replies.
- Messages stay short. The longest normal message is the customer history (about 14 lines).

### 4.1 Confirmation (review). Reply buttons

Shown after Kobo interprets a message. Nothing is saved yet.

Pidgin, body:
```
Make I write am like this?

> "Mama Chidi carry two bag rice, forty five thousand. She pay twenty thousand now."

*Mama Chidi*
- Credit sale: *₦45,000*
- She pay now: *₦20,000*

Before she owe ₦8,500. After this, she go owe *₦33,500*.
```
English, body:
```
Shall I write it like this?

> "Mama Chidi took two bags of rice, forty-five thousand. She paid twenty thousand now."

*Mama Chidi*
- Credit sale: *₦45,000*
- Paid now: *₦20,000*

She owed ₦8,500 before. After this she will owe *₦33,500*.
```
- Footer (both languages, exact contract text): `1 save / 2 edit / 3 cancel`
- Buttons: `1 Save` · `2 Edit` · `3 Cancel` (same in both languages so they match the footer)
- The quote line appears only for voice notes (the transcript, cut to 160 chars with "…"). For typed messages, leave it out.
- The before/after balance is calculated by code from the ledger plus this proposal, never by the model.
- `2 Edit` → Pidgin: "Okay. Tell me the correct one, talk am or type am." / English: "Okay. Send the correct details, by voice or text." The new details produce a **new** review with a new pending version.
- `3 Cancel` → Pidgin: "I no save am. Nothing change for your book." / English: "Cancelled. Nothing was saved."

### 4.2 Flagged amount question. Reply buttons

Shown instead of a review when a figure can be read more than one way. Confirmation is blocked until it's answered.

Pidgin, body:
```
I hear *"three eight"* for Bayo payment.
Which one be am?
```
English, body:
```
I heard *"three eight"* for Bayo's payment.
Which amount is it?
```
- Footer: Pidgin `I never save anything.` / English `Nothing is saved yet.`
- Buttons: `₦3,800` · `₦38,000` · Pidgin `Another amount` / English `Another amount`
- `Another amount` → Pidgin "Type the amount with numbers, like 3800." / English "Type the amount in numbers, e.g. 3800."
- Typed replies `3800`, `3,800`, `38000` are accepted while this question is open.
- **Core note:** the candidate amounts must come from deterministic code reading the transcript tokens, not from the model, and only when there are exactly two readings. If there are more than two, or none, show no amount buttons and ask the trader to type the number. Offering two readings as a question is asking, not guessing (AGENTS.md money rules). After an answer, show the full 4.1 review. Answering the question never saves anything by itself.
- The same pattern covers a missing amount ("Bayo go pay me" with no figure): Pidgin "How much Bayo owe? Type am or talk am." / English "How much does Bayo owe? Type or say the amount." No buttons. A promise to pay is not recorded as a debt amount.

### 4.3 Saved. Reply buttons

Pidgin, body:
```
*E don enter book.*
Mama Chidi now owe you *₦33,500*.

_Ref K-0142 · 1 Nov, 4:12pm_
```
English, body:
```
*Saved to your book.*
Mama Chidi now owes you *₦33,500*.

_Ref K-0142 · 1 Nov, 4:12pm_
```
- Buttons: Pidgin `Who dey owe me` / English `Who owes me` · then `Undo this` (both languages).
- `Undo this` never deletes anything. It opens a **reversal review** (4.1 format, heading Pidgin "Make I cancel this entry?" / English "Reverse this entry?") that needs its own `1 save`.
- If the balance reaches zero: Pidgin "Mama Chidi don clear everything. She no owe you again." / English "Mama Chidi has cleared her balance."

### 4.4 Who dey owe me. List message

Triggers: `who dey owe me`, `who owe me`, `who owes me`, `debtors`, or the button.

Pidgin, body:
```
*Who dey owe you* · 6 people
Total: *₦122,800*

1. Mama Chidi · *₦33,500*
2. Bayo · *₦28,000*
3. Iya Basira · *₦26,000*
4. Emeka (spare parts) · *₦19,800*
5. Aunty Ngozi · *₦12,000*
6. Tunde · *₦3,500*

_Biggest first. Total na from your saved entries._
```
English: heading `*Who owes you* · 6 people`, small print `_Largest first. Totals come from your saved entries._`
- List button: Pidgin `See person` / English `See customer`
- Rows (≤10): title = name (≤24 chars, truncated with "…"). Description = Pidgin "Owe ₦33,500 · last pay 24 Oct" / English "Owes ₦33,500 · last paid 24 Oct" (≤72). Row ID `customer:<id>`.
- More than 10 debtors: the body lists all names up to the 1024-char limit, and the rows show the top 9 plus a 10th row "Full list" that sends the web-book link.
- Nobody owes: Pidgin "Nobody owe you now. Your book clean." / English "Nobody owes you right now."

### 4.5 Customer history. Text, then reply buttons

Opened from a list row or `history Mama Chidi` / `Mama Chidi book`.

Pidgin, body:
````
*Mama Chidi* · she owe *₦33,500*

```
               AMOUNT    OWES
1 Nov  paid    20,000  33,500
1 Nov  credit  45,000  53,500
24 Oct paid     5,000   8,500
20 Oct credit  13,500  13,500
```
_Last 8 entries. Full book: kobo.example/b/Xk29…_
````
English: heading `*Mama Chidi* · owes *₦33,500*`, small print `_Last 8 entries. Full history: kobo.example/b/Xk29…_`
- The monospace block is ≤30 chars wide so it doesn't wrap on a 360px phone. Newest first. Amounts have no ₦ inside the table (the column header says it), and the "owes" column is the running balance calculated by code.
- Reversals show as `fix   ` rows with the amount, plus a footnote line `fix = undo of K-0139`.
- Buttons: Pidgin `Who dey owe me` / English `Who owes me` · `Open full book`. The web link is a signed, owner-bound, short-lived URL.
- Name ambiguity (a known voice-eval weakness) uses a **list message**: Pidgin "Which Chidi you mean?" / English "Which Chidi do you mean?", with rows for the matching customers (description: current balance) plus a last row "New customer".

### 4.6 Daily summary. Template (image header, utility category)

Sent at 20:00 Lagos (configurable) only to traders who opted in, only on days with at least one entry. Outside the 24-hour window this **must** be a Meta-approved template.

- Header: the summary card image (section 5).
- Body, Pidgin: `Your book for today, {{1}}: {{2}} entries. You give credit {{3}}, you collect {{4}}. People still owe you {{5}}.`
- Body, English: `Your book for {{1}}: {{2}} entries. Credit given {{3}}, collected {{4}}. People owe you {{5}} in total.`
- Buttons: quick reply Pidgin `Who dey owe me` / English `Who owes me`, and a URL button `Open my book`.
- Opt-in: `send summary` / `daily summary`. Opt-out: `stop summary`, confirmed with Pidgin "I don stop the daily summary." / English "Daily summary turned off."

### 4.7 Errors and edge states. Plain text unless noted

Every error that happens before a save says plainly that nothing was saved.

| Case | Pidgin | English |
|---|---|---|
| Voice note unclear | I no hear that voice note well. *I never save anything.* Abeg talk am again, or type am. | I couldn't make out that voice note. *Nothing was saved.* Please say it again or type it. |
| Voice note too long (>2 min) | That voice note too long. Send am small small, one customer at a time. | That voice note is too long. Please send one customer at a time. |
| Model/transcription down | Something spoil for my side. *I never save anything.* Try again small time. | Something went wrong on my side. *Nothing was saved.* Please try again shortly. |
| `1`/`save` with nothing pending | Nothing dey wait to save. Tell me wetin happen, like "Bayo pay 5,000". | There's nothing waiting to save. Tell me what happened, e.g. "Bayo paid 5,000". |
| Old button tapped (stale version) | That one don change. Na this one be the latest, check am: (re-sends current 4.1 review) | That draft was replaced. Here's the latest one: (re-sends current 4.1 review) |
| Pending expired (30 min) | That entry wait too long so I no save am. Send am again. | That draft expired, so it wasn't saved. Please send it again. |
| Two drafts open | You get two entries wey never save. Which one? (list message, one row per draft) | You have two unsaved drafts. Which one? (list message) |
| Image/sticker/document | For now I fit read only text and voice note. | I can only read text and voice notes for now. |
| Unknown request | I be your book. Tell me who buy, who pay, or ask "who dey owe me". | I keep your book. Tell me who bought, who paid, or ask "who owes me". |

`help` returns a short message with 3 example lines and the language switch.

## 5. Daily summary card (image)

1080 × 1350 PNG (4:5 fills a phone, and WhatsApp doesn't crop it), rendered server-side from ledger figures only. It looks like a till receipt torn from a ruled book, with the paper background visible all round it.

```
┌──────────────────────────────── 1080 ─┐  outer: paper-sunken #EAE4D6, 64px margin
│  ┌──────────── receipt 952 wide ─────┐ │  receipt: paper #F4F0E6, 8px top radius,
│  │ kobo (wordmark, 56px)    SAT 1 NOV│ │  ruled lines every 28px at 40% opacity
│  │ MAMA NKECHI PROVISIONS   2026     │ │  micro Plex Mono, ink-2
│  │ ─────────────────────────────────  │ │  1px ink rule
│  │ PEOPLE OWE YOU                     │ │  micro
│  │ ₦122,800                           │ │  amount-xl 120px, ink, one biro underline
│  │ ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾                    │ │  (hand-drawn SVG stroke, 6px)
│  │                                    │ │
│  │ TODAY                              │ │  micro
│  │ Credit given          ₦63,000      │ │  amount-l, owed
│  │ Collected             ₦41,500      │ │  amount-l, paid
│  │ Entries saved              9       │ │  amount-l, ink
│  │ - - - - - - - - - - - - - - - - -  │ │  dashed 2px ink-3 (tear line)
│  │ BIGGEST BALANCES                   │ │  micro
│  │ Mama Chidi            ₦33,500      │ │  body 32px, tnum, top 3 only
│  │ Bayo                  ₦28,000      │ │
│  │ Iya Basira            ₦26,000      │ │
│  │ ─────────────────────────────────  │ │
│  │ Counted by code from 9 confirmed   │ │  Plex Mono 22px, ink-2
│  │ entries · 07:42–19:10              │ │
│  └/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\┘ │  zig-zag tear edge, 12px teeth
└────────────────────────────────────────┘
```
- Amount rows: label left in Familjen 400 34px, amount right-aligned tabular 600 40px.
- Only figures the ledger actually has: credit sales, payments, reversals and balances. **No "sales today" or "profit"**, because cash sales aren't recorded (the schema requires a customer). If a day had reversals, add the row `Corrections  2` in `ink`.
- Customer names are the trader's own data, shown to the trader only. The landing-page preview uses the demo book.
- Rendering: server-side PNG (e.g. Satori + resvg). That's a dependency decision for owner coordination. Familjen and Plex Mono are bundled locally, not fetched at render time.

## 6. Landing page (mobile first)

Purpose: a judge opens the URL and, within the first fold, *uses* Kobo. The live chat is in the hero, not behind a button. Sections, in order: **top bar → hero with live chat → how it works → safety example → footer.** Nothing else (no stats, testimonials, logo wall, pricing or FAQ).

### 6.1 Top bar
48px high, `paper`. Wordmark left (28px). Right: `GitHub` text link (ink, underline on hover). No nav menu.

### 6.2 Hero

**Mobile (360–767px)**
1. Headline, `display` 40px, left-aligned, two-tone: **"Your market notebook,** <span ink-2>now inside WhatsApp."</span>
2. Sub-line, `body` ink-2, max 34ch: "Talk or type your sales in Pidgin or English. Kobo writes them down, asks when a figure is unclear, and saves only when you say so."
3. **Live chat panel** starts within the first 520px of viewport height so it's visible without scrolling on a 360×740 phone. Full-bleed minus gutters, 8px radius, `paper-sunken` with ruled lines, height `min(72svh, 600px)`.
   - Panel header (44px): "Kobo · demo book" left, then `ink-3` small "Sample data, resets in 30 min" (true, because the session TTL is real). Right: `Reset` text button.
   - Messages: Kobo's bubbles are `paper` with a 2px `biro` left edge, and trader bubbles are `ink` text on `biro-soft`, right-aligned. Buttons render under Kobo's bubble as outlined 4px-radius buttons in a row (stacked if more than 2 on a narrow width). List messages render as an inline list (name left, amount right, tabular). Quote lines (`> heard`) render as `ink-2` italic with a 2px `rule` left border. Monospace blocks use Plex Mono.
   - Opening state (no API call): one Kobo message, Pidgin and English in two lines: "Tell me who buy or who pay. / Tell me who bought or who paid."
   - **Tap-to-try chips** (horizontal scroll row above the input, 6px radius, `paper` with 1px `rule` border): `Bayo pay me three eight` (triggers the safety question), `Mama Chidi carry rice 45k, she pay 20k`, `Who dey owe me`, `Show Mama Chidi book`, `Iya Basira don pay everything`.
   - **Sample voice note button**: a full-width secondary button with a play-triangle icon, "Play a sample voice note (Pidgin, 9s)". It plays the clip, shows it as a voice bubble with the transcript beneath, and sends it through the real pipeline (`POST /api/demo/voice-sample`). The clip must be recorded by a consenting team member for this purpose, never taken from the private voice harness.
   - Input row: text field (`paper`, 1px `rule`, 44px) plus a send button (`biro`). No microphone in the landing chat unless HTTPS mic capture has been tested. Until then, the voice path is the sample button only.
   - Limit reached state: the input is replaced with "That's the end of the demo for this session. The real Kobo lives in WhatsApp." plus a GitHub link. No fake "join waitlist".

**Desktop (≥1024px)**: 12 columns. Headline block in columns 1–5, vertically anchored to the bottom of the hero (Synais' bottom-left statement), with `display` 72px and the sub-line underneath. Chat panel in columns 7–12, height 640px, top-aligned with the top bar's baseline + 48px. The chips sit inside the panel. The voice-note button sits under the headline block on desktop, so the panel stays a pure chat. Hero min-height `min(100svh, 860px)`.

### 6.3 How it works (3 steps)

One horizontal ruled band, not cards. Mobile: stacked rows, each separated by a 1px `rule`. Desktop: three columns divided by hairline vertical rules (the Walos divider rhythm).

Each step has a big tabular numeral in `biro` (amount-l), a title, two lines of copy, and a small *real* fragment of the message format beside it:
1. **Speak.** "Send a voice note or text, like you'd tell your apprentice. *AI interprets* what you said: names, items, amounts." Fragment: a voice bubble plus the `> heard` quote.
2. **Confirm.** "Kobo shows you exactly what it will write. *You confirm* with 1 save, 2 edit or 3 cancel." Fragment: the review footer and buttons.
3. **It's in your book.** "*Code calculates* every total and balance, never the AI. Every evening you get your book on one page." Fragment: a 240px-wide thumbnail of the summary card (demo data).

Section title, `h2`: "Speak. Confirm. It's in your book."

### 6.4 Safety example (the one `night` section)

Full-bleed `night`, paper text. Desktop 2 columns: left is the statement, right is one large exchange.
- Statement `h2`: **"Kobo never guesses money."** Body: "Voice notes are messy. 'Three eight' could be ₦3,800 or ₦38,000. When a figure can be read two ways, Kobo asks, and nothing is saved until you choose."
- Exchange: trader voice bubble with "Bayo pay me three eight" → Kobo bubble "I hear *"three eight"* for Bayo payment. Which one be am?" → two buttons set at `amount-l`: **₦3,800**, **₦38,000**, with one hand-drawn `biro-night` circle around the pair and the footer "I never save anything." This is a static rendering of the 4.2 format, not a fake live feed. It's labelled as an example.

### 6.5 Footer
`paper`, a 1px `ink` rule on top, 48px padding. One row on desktop and stacked on mobile: wordmark · "Built with Muse Spark and Muse Voice" · GitHub link · "Made for the Meta Global AI Developer Hackathon". Plex Mono `micro` for the small print. Model names and the event name must match the final submission facts.

### 6.6 What we take from each reference

The build step can't see the images, so the borrowed principles are recorded here. All three are fintech templates. We take structure and restraint, never their look.

- **`1000230054.jpg`, "Synais" (warm stone + oxblood finance landing).** *Take:* the warm, non-white paper background (theirs is about #E4E0D6, ours `paper`); the large, tightly tracked grotesk headline with the **two-tone split** (dark first clause, muted second clause, same weight); the bottom-left anchored statement paragraph that makes the hero asymmetric; real product panels sitting in the hero's lower right; small-radius (about 2–4px) rectangular buttons in a solid primary + outlined secondary pair; thin 1px hairlines as the structural motif (their circuit lines become our ruled lines); one dark full-bleed section for a single big statement (our safety example). *Don't take:* oxblood (it fights `owed` red), the hand-and-device photo, the "Backed by" badge, the stats row, the AI copy, the glossy gradient feature band, the asterisk logo.
- **`1000230055.jpg`, "Walos" (glassy blue finance hero).** *Take:* a left-aligned, three-line headline at about 1.05 leading with the product proof filling the right half on desktop; the row of **hairline vertical dividers** between items, reused for the 3-step band (not for metrics). *Don't take:* the gradient/blurred background, glassmorphism, floating avatar chips with fake amounts, fabricated stats (100+, 850K, 4.9/5), gradient pill buttons, the grid-paper backdrop as decoration.
- **`1000230061.mp4`, "Advapay" (40s scroll of a core-banking site).** *Take:* the lowercase wordmark in the top-left; **generous vertical whitespace** (about 120–160px between sections on desktop); alternating text/product composition; **oversized balance numerals** in the product shots as the main visual (our `amount-xl`); one saturated accent used only for actions (theirs is indigo, ours `biro`); a plain footer. *Don't take:* the indigo spheres and blobs, 3D renders, the phone-on-desk device mockups, the customer logo wall, blog cards, the newsletter band, the multi-level nav.

## 7. Web book (last, optional)

Opened only from a signed WhatsApp link (`/b/<token>`, short-lived, owner-bound, read-only). Same tokens, a denser layout, mobile first.
- **Overview:** "People owe you" `amount-xl` with a biro underline, then "Today / This week" rows (credit given in `owed`, collected in `paid`, entries), then a "Last summary card" thumbnail.
- **Debtors:** a ruled list, name left and tabular amount right in `owed`, "last paid" in `ink-3`. Sort by amount or by oldest. No charts.
- **Customer history:** Plex Mono ledger table on ruled lines (Date · Entry · Amount · Owes), newest first and paginated. Reversals show as `fix` rows linked to the original ref. Voice-sourced entries have a "heard" disclosure showing the transcript (never the audio file in public).
- Recording and confirming never happen on the web book. It links back: "To add an entry, message Kobo on WhatsApp."

## 8. Logo direction (playbook 4.5I, round 1)

- **Name check:** "kobo" (koh-boh) is the Nigerian 1/100-naira coin, so it says "every last kobo." **Conflict to note:** Rakuten Kobo (e-readers) is a well-known brand, but in a different market. Low risk for a hackathon. Avoid any book or e-reader imagery so we don't reinforce the association.
- **Typeface:** Familjen Grotesk 700, tracking −0.045em, lowercase. Colours: `ink #1B1A17` + `biro #2A3A9E` (dark background: `#F4F0E6` + `#9AA6F2`). Two colours maximum, and the one-colour versions must hold up.
- **Review sheet:** `docs/design/logo-review-r1.png` shows each concept at 128/64/16px plus the mark, on light and dark, and in one-colour black and white. It's an HTML/CSS render using the font for this review. Final SVGs will be outlined, hand-written paths.
  - **A · Ruled line:** the wordmark sits on a biro notebook rule, because Kobo writes onto your own page. It's clear, but it reads as an underline. Weakest as a favicon (a lone "k").
  - **B · Coin o (recommended):** the first `o` is a solid biro disc, the kobo coin, because Kobo counts every last kobo. It's the only accent, on exactly one letter. It survives at 16px (`k●`), holds up in one colour, and the disc can drop in last for the demo's logo "click."
  - **C · Circled o:** the last `o` is circled by hand, the way a trader circles a figure to check it, because Kobo asks before saving. It's the strongest story (the safety motif) but busy at 16px, and the hand loop is hard to keep crisp.
- **After the pick:** export `logo.svg`, `logo-mark.svg`, `favicon.ico`, `icon.png`, `apple-touch-icon.png` and `og.png` (1200×630: `paper` background, wordmark, line "Your market notebook, now inside WhatsApp."), with the detail as a separate path for animation. Record the final path colours here. Two rounds maximum.

## 9. What the landing chat needs from core

All of this sits behind a demo-only boundary: a separate `is_demo=1` owner per session, seeded fictional book, no real trader data, no WhatsApp. These are **requests to the core lane**, not implemented.

| Endpoint | Purpose | Notes |
|---|---|---|
| `POST /api/demo/session` | Creates a demo owner plus the seeded sample book. Sets an httpOnly, SameSite=Lax cookie. | Returns `{ expiresAt, remaining, language }`. TTL 30 min, one live session per cookie. Rate-limited per IP. |
| `POST /api/demo/message` `{ text }` | Calls `handleMessage({ channel:'web', senderId: <from cookie> })` | Returns `MessageReply` **plus structured render data** (below) and `remaining`. Typed `1`/`2`/`3` routes through the same protocol. |
| `POST /api/demo/action` `{ action:'confirm'\|'edit'\|'cancel'\|'choose', pendingId, version, value? }` | Button taps (and the 4.2 amount choice) | Same ownership/version/expiry checks as WhatsApp. A stale version returns the current review. |
| `GET /api/demo/samples` | Chip texts plus voice-sample metadata `{ id, label, durationSec, audioUrl, transcript }` | The sample clip is a public, consented demo asset, separate from the private media store. |
| `POST /api/demo/voice-sample` `{ sampleId }` | Runs the real transcription + interpretation on a **server-owned** clip | Client sends only an ID, never a path (AGENTS.md audio rule). |
| `GET /api/demo/summary-card` | Renders the 1080×1350 PNG for the demo book | Used by how-it-works step 3 and as the og/README image source. |
| `POST /api/demo/reset` | Re-seeds the session's book | |

**Limits:** per session, 12 model-calling messages (`remaining` is returned on every response; plain `1/2/3` actions don't count). Per IP, 3 sessions per hour. A global daily cap on paid model calls acts as a kill switch, which returns `429 { reason:'demo_limit' }`. The UI then shows the 6.2 limit state. No blind retries on paid calls (ARCHITECTURE.md).

**Contract extension request:** `MessageReply` today is `{ replyText, pending?: { id, summary, flags } }`. Rendering sections 4.1–4.7 identically in WhatsApp and on the landing chat needs a channel-neutral render hint that core produces once, and both adapters map:
```ts
interface ReplyView {
  lang: 'pcm' | 'en';
  kind: 'text' | 'buttons' | 'list' | 'template';
  body: string;            // WhatsApp-formatted (*bold*, > quote, ``` blocks)
  footer?: string;         // e.g. CONFIRMATION_PROMPT
  buttons?: { id: string; title: string }[];            // ≤3, title ≤20
  list?: { button: string; rows: { id: string; title: string; description?: string }[] }; // ≤10
  pendingVersion?: number;
}
```
`replyText` stays as the plain-text fallback. Core owns `src/core/contract.ts`, so this is their decision.

**Other coordination before building:** landing route at `src/app/page.tsx` (outside the design lane), fonts via `next/font` in `src/app/layout.tsx`, tokens in `src/app/globals.css`, and a PNG renderer dependency for the summary card.
