# Kobo: judging guide

**Meta Global AI Developer Hackathon · Indie Developer · Build for Your World**

**Judge path:** [trykobo.xyz](https://trykobo.xyz) → **Your turn**. The interactive demo uses the real bookkeeping engine in an isolated, fictional seeded session. The landing-page film is scripted. Meta's WhatsApp test number only reaches approved recipients, so use the website. The owner has verified one real WhatsApp text and reply through the deployed webhook; that is not a broad reliability test.

## Evidence against the rubric

| Criterion | What to see | Evidence and limits |
|---|---|---|
| **Impact — 30** | Bookkeeping in the English and Pidgin a Nigerian market trader might use; review before saving, debtors, daily summary and drafted reminders. | The problem and workflow are the product hypothesis, not evidence of adoption, measured time savings or validated user outcomes. Demo data is fictional. |
| **Meta tooling — 25** | Muse Spark Open interprets live text via validated tool calls through Vercel AI Gateway. Muse Voice Transcribe supports voice with the trader's customer names as hints; Muse Spark also reads notebook photos. | Live text is verified. **Voice and notebook import are built and offline-tested, not yet verified live.** Code: [`model-provider.ts`](../src/server/model-provider.ts), [`tool-calls.ts`](../src/server/tool-calls.ts), [`notebook.ts`](../src/server/notebook.ts), [`voice/index.ts`](../src/server/voice/index.ts), [`channels/runtime.ts`](../src/server/channels/runtime.ts). |
| **Technical depth — 20** | AI interprets; trader confirms; code calculates. Integer-kobo arithmetic, append-only records, confirmation gating, ambiguity clarification and signed owner-mapped webhook handling. | [`ledger.ts`](../src/core/ledger.ts), [`ledger-store.ts`](../src/server/ledger-store.ts), [`service.ts`](../src/server/service.ts), [`whatsapp.ts`](../src/server/channels/whatsapp.ts). Financial writes require confirmation; proposals and source text can be stored before confirmation. WhatsApp has one owner-verified text exchange, not an end-to-end reliability benchmark. |
| **Demo — 25** | Open Your turn, send a suggestion, inspect a review, confirm or cancel, then ask who owes money. Try `Bayo pay me three eight` to see the ambiguity question. | Live interactive engine with usage limits; pre-seeded names and balances are fictional. No need to access the WhatsApp test number. [README](../README.md#try-it-in-60-seconds) lists all six suggestions. Demo video link is pending. |

## Evaluation and boundaries

The latest documented live synthetic extraction check passed **23/25 (92.0%)**, with two failures and zero errors. It was one run, on in-memory databases, with no confirmations; the underlying causes of the two failures were not captured. Results vary, and the check is **not** a production accuracy or safety benchmark. See [`LIVE_EVAL_RESULTS.md`](LIVE_EVAL_RESULTS.md) for the authoritative record.

- WhatsApp: owner verified a real text and the reply “Nobody owes you right now” on Meta's test number. Only approved recipients can use that number.
- Voice notes and notebook photo import: built and offline-tested; not yet verified live. The first live WhatsApp voice note test (4 Nov) returned an error reply; under investigation. The demo film's voice note scene is a labelled reenactment.
- A drafted reminder is not a claim that a message was automatically sent.
- Don't use real customer data in the demo. The [privacy policy](https://trykobo.xyz/privacy) explains storage, including unconfirmed content.

## Built during the hackathon

The owner confirms Kobo was built from scratch during **26 October–4 November 2026**; nothing was pre-existing. The first commit visible in this repository is dated **31 October**. [README history](../README.md#built-during-the-hackathon) links representative commits through 4 November; dates before the first visible commit are owner-provided context, not independently demonstrated by this repository's Git history.
