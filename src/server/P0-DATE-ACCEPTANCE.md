# P0 pending-question/date acceptance — 2026-11-04

Core implementation: `5aabcb6`, based on `origin/main` `2efbd8e`. No merge or deploy.

## Method and safety boundary

Production `pnpm build` + `next start`, bound only to `127.0.0.1:3127`, disposable synthetic SQLite databases. Requests went through the real `/api/demo/session` and `/api/demo/message` routes, not a fake provider or scripted UI. Production Origin was simulated as `https://127.0.0.1:3127`; Secure cookies were supplied manually over loopback HTTP and were never logged. This is **not external HTTPS/browser acceptance**.

The six inputs below were taken verbatim, in order, from `src/components/chat/demo-engine.ts` CHIPS. One fresh session explicitly selected Pidgin. No confirmation, cancellation, clarification answer, clock advance or reset was inserted between them. Then the next-week message and the three continuation messages were sent in that same session. A second fresh English session exercised the exact four-message sticky repro directly. All final route responses were HTTP 200. Explicit language selection explains Pidgin replies to the English sale in the first session.

No transaction was confirmed. Final database evidence across the two sessions: **10 ledger rows, all seeded; 0 web confirmations; 0 stock purchases; 2 current reviews and 5 superseded unsaved reviews.** Each fresh demo seeds five ledger events and Mama Chidi already owes ₦33,500. Consequently the proposed extra ₦45,000 sale minus ₦20,000 payment previews **₦58,500**, not ₦33,500; the saved balance stays ₦33,500.

Final Pidgin session quota: **12 → 9** (3 actual provider reservations: purchase, ambiguous Bayo payment, Chinedu next week). Exact dated Mama Chidi/Ada clauses and read requests use no provider. English sticky session: **12 throughout**, zero provider calls. Including the first diagnostic run below, total authorized provider invocations/reservations were **8**. The implementation does not retry provider requests. No charge/token total is inferred from the quota.

## Final ordered session: exact real replyText

### 1. `I buy 5 bag rice from Alhaji, 290k`

HTTP 200; remaining 11; review flags `[]`.

```text
Make I write am like this?

*Stock purchase*
- Stock wey you buy (5 bag rice): *₦290,000*

1 save / 2 edit / 3 cancel
```

### 2. `Mama Chidi carry rice 45k, she pay 20k, remain Friday`

HTTP 200; remaining 11; fresh review flags `[]`. Old purchase proposal retained as superseded, not saved.

```text
I keep the earlier draft aside. I never save am. This one na separate review. To go back to the earlier one, send the details again.

Make I write am like this?

*Mama Chidi*
- Credit sale: *₦45,000*, pay day Fri 6 Nov
- Pay now: *₦20,000*

Before, im owe ₦33,500. After this, im go owe *₦58,500*.

1 save / 2 edit / 3 cancel
```

### 3. `Bayo pay me three eight`

HTTP 200; remaining 10. Buttons: `₦3,800`, `₦38,000`, `Another amount`; no Save button. Flags: `Please clarify three eight: ₦3,800 or ₦38,000?`, `Missing or invalid amount`.

```text
I keep the earlier draft aside. I never save am. This one na separate review. To go back to the earlier one, send the details again.

I hear *"three eight"* for Bayo payment.
Which one be am?
1. ₦3,800
2. ₦38,000
3. Another amount

I never save anything.
```

### 4. `Who dey owe me`

HTTP 200; remaining 10; no pending proposal returned. Bayo question remains unchanged.

```text
*Who dey owe you* · 2 people
Total: *₦61,500*

1. Mama Chidi · *₦33,500*
2. Bayo · *₦28,000*

_Biggest first. Total na from your saved entries._
```

### 5. `How market today?`

HTTP 200; remaining 10; no pending proposal returned. Bayo question remains unchanged.

```text
*Your book today* · Wed 4 Nov
- Credit sales: *₦0*
- Money wey you collect: *₦0*
- Stock wey you buy: *₦0*
People owe you *₦61,500*
Biggest: Mama Chidi · *₦33,500*

_Na from the 0 entries wey you confirm today._
```

### 6. `Show Mama Chidi book`

HTTP 200; remaining 10; no pending proposal returned. Bayo question remains unchanged.

````text
*Mama Chidi* · owe *₦33,500*

```
               AMOUNT    OWES
3 Nov  paid    20,000  33,500
3 Nov  credit  45,000  53,500
26 Oct paid     5,000   8,500
21 Oct old     13,500  13,500
```
_Last 4 entries._
_E don owe for 14 days for this book · last pay 3 Nov_
````

### 7. `Chinedu collect 2 carton indomie, 18 thousand, e go pay next week`

HTTP 200; remaining 9. New date question, flag `Which day will they pay?`. Buttons: `Tomorrow`, `Friday`, `No date`; each carries the new review ID. Stored amount is 1,800,000 kobo; **no due date is stored**.

```text
I keep the earlier draft aside. I never save am. This one na separate review. To go back to the earlier one, send the details again.

Which day Chinedu go pay? Choose one day, or talk No date.
1. Tomorrow
2. Friday
3. No date

I never save anything.
```

### 8–9. While Chinedu's date question is pending

`How market today?` returned **exactly the step 5 replyText above**, HTTP 200, remaining 9, no pending proposal returned.

`Show Mama Chidi book` returned **exactly the step 6 replyText above**, HTTP 200, remaining 9, no pending proposal returned.

Neither answered, changed or consumed Chinedu's pending question.

### 10. `Ada bought 3 crates of eggs on credit for 27,000, she will pay tomorrow`

HTTP 200; remaining 9; new review flags `[]`. Stored due day is tomorrow, not a question. Chinedu's prior proposal is retained as superseded and remains unsaved.

```text
I keep the earlier draft aside. I never save am. This one na separate review. To go back to the earlier one, send the details again.

Make I write am like this?

*Ada* (new customer)
- Credit sale: *₦27,000*, pay day Thu 5 Nov

After this, im go owe *₦27,000*.

1 save / 2 edit / 3 cancel
```

## Fresh English session: exact sticky sequence

All four responses HTTP 200, remaining **12** throughout; no provider calls. Both sale reviews have flags `[]`; summary/history return no pending proposal.

### `Mama Chidi carry rice 45k, she pay 20k, remain Friday`

```text
Shall I write it like this?

*Mama Chidi*
- Credit sale: *₦45,000*, due Fri 6 Nov
- Paid now: *₦20,000*

They owed ₦33,500 before. After this they will owe *₦58,500*.

1 save / 2 edit / 3 cancel
```

### `How market today?`

```text
*Your book today* · Wed 4 Nov
- Credit sales: *₦0*
- Money you collected: *₦0*
- Stock you bought: *₦0*
People owe you *₦61,500*
Biggest: Mama Chidi · *₦33,500*

_From the 0 entries you confirmed today._
```

### `Show Mama Chidi book`

````text
*Mama Chidi* · owes *₦33,500*

```
               AMOUNT    OWES
3 Nov  paid    20,000  33,500
3 Nov  credit  45,000  53,500
26 Oct paid     5,000   8,500
21 Oct old     13,500  13,500
```
_Last 4 entries._
_Owing for 14 days in this book · last paid 3 Nov_
````

### `Ada bought 3 crates of eggs on credit for 27,000, she will pay tomorrow`

```text
I set the earlier draft aside without saving it. This is a separate review. To return to the earlier one, send its details again.

Shall I write it like this?

*Ada* (new customer)
- Credit sale: *₦27,000*, due Thu 5 Nov

After this they will owe *₦27,000*.

1 save / 2 edit / 3 cancel
```

## Diagnostic failures observed before the final correction

The first real ordered run reserved five provider calls (12 → 7). It was not declared a pass:

- Exact landing sample #2 returned HTTP 200 with **no review** and this exact reply: `Something spoil for my side. *I never save anything.* Try again small time.` The service intentionally catches provider/response parsing errors without sensitive payloads; the specific upstream HTTP/timeout/schema cause was **not captured and must not be guessed**. The earlier purchase review remained available. No automatic paid retry was performed.
- Ada's explicit tomorrow incorrectly became a date question because the extracted evidence clause did not include the date, although `due_date_text` was `tomorrow`. Exact reply:

```text
I keep the earlier draft aside. I never save am. This one na separate review. To go back to the earlier one, send the details again.

Which day Ada go pay? Choose one day, or talk No date.
1. Tomorrow
2. Friday
3. No date

I never save anything.
```

- The first Chinedu/Ada questions also exposed a duplicate legacy internal date flag containing the old ISO-format instruction. The store validation copy has now been corrected; old persisted questions can still be answered and have the legacy flag cleared safely.
- The initial offline suite had two old tests expecting unrelated messages to redisplay the old question/review. These were updated to assert separate-message handling and explicit language persistence instead. A subsequent typecheck caught nullable `dueDateSource`; it was corrected to `string | undefined` before the final successful checks.

The implementation was then changed: complete numeric dated Mama Chidi/Ada clauses get deterministic reviews without a provider request; source-checked promise recovery handles omitted date spans; vague next-week promises are independently blocked even if the model returns a shortened weekday quote. The entire ordered session was rerun in a fresh disposable production demo database, giving the final results above. This was a changed-code regression run, not an automatic provider retry.

## Final verification and limitations

- `pnpm test`: **212 passed, 1 opt-in paid live-eval test skipped**, 34 passing files, 1 skipped file.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed. Existing warning: `metadataBase property in metadata export is not set ... using "http://localhost:3000"`. No unrelated metadata/UI edit made.
- `git diff --check`: passed.
- Regressions cover all amount/customer/date pending types, exact landing #2 + sticky continuation, read requests without draft mutation/provider calls, independent new review IDs, legacy dates, no guessed next-week date, mentioned weekday options, No date, stale/cross-owner/cross-sender rejection, and idempotent confirmations. Existing money/expiry tests also pass.
- Set-aside proposals use existing **superseded** status and retain their original entries/input. They are not automatically resumed or saved, and their old buttons cannot write. Copy honestly tells the trader to resend earlier details to return to that transaction. No new parked-draft picker or schema migration was added.
- New choices never save: they produce a fresh review; separate owner confirmation is still required. Dates in trader copy are friendly weekday/day/month; ISO dates remain only storage/action internals and legacy-flag compatibility code.
- No voice, channels, WhatsApp, product UI, deployment or unrelated functionality was edited. `AGENTS.md` remained the pre-existing unrelated dirty file and was not staged. Native-speaker Pidgin review remains open; these synthetic tests are not an accuracy benchmark or production safety certification.
