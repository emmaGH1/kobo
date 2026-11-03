# WhatsApp setup — test number first

Implemented and offline-tested; **not live connected**. These are Cloud API steps, not the Muse dashboard. Dashboard labels vary slightly by app type. Use synthetic transactions first.

## 1. App and test recipient

1. Open [Meta → My Apps](https://developers.facebook.com/apps/), create/select a Business app. Choose **Connect with customers through WhatsApp**, select your business portfolio and finish. For an existing eligible app: **Add product → WhatsApp → Set up**.
2. Open **WhatsApp → API Setup** (newer layout: **Use cases → Customize → WhatsApp → API Setup**). Under **Send and receive messages**, select the supplied test number. Copy **Phone number ID** — not the telephone number or WABA ID.
3. Under **To → Manage phone number list → Add phone number**, add your own WhatsApp number and verify the code on your phone. Test numbers send only to verified recipients.
4. Copy the **temporary access token** privately; check its displayed expiry. Note the Graph version in the generated request example.
5. Open **App settings → Basic → App secret → Show** and save privately. This is different from the access token and verify token.

## 2. Private VPS environment

Set in ignored environment/service configuration, never Git, `NEXT_PUBLIC_*` or chat:

| Variable | Value |
|---|---|
| `WHATSAPP_GRAPH_VERSION` | Supported version from dashboard, including `v` and `.0` |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID from API Setup |
| `WHATSAPP_ACCESS_TOKEN` | Temporary token initially |
| `WHATSAPP_APP_SECRET` | App secret from Basic settings |
| `WHATSAPP_VERIFY_TOKEN` | Your own private random value; reuse below |
| `WHATSAPP_OWNER_MAP_JSON` | Map sender international digits without `+` to an existing non-demo owner, e.g. `{"2348000000000":"owner"}` (fictional number) |
| `VOICE_API_KEY` | Muse voice credential; falls back to `MODEL_API_KEY`. A text gateway key may not authorize direct Meta voice. Do not copy the harness `.env`. |
| `VOICE_PRODUCT_NAMES_JSON` | Optional per-owner product hints, e.g. `{"owner":["Rice","Palm oil"]}` |

Sign in through owner login first so the `owner` database row exists. Unknown sender numbers and other Phone number IDs are ignored. Customer hints are read from that owner's database; core has no product catalogue yet.

Install FFmpeg/FFprobe, use persistent SQLite on the Node VPS, configure public HTTPS and restart Next. Deploy only with approval. Disable proxy request-body logging.

## 3. Webhook registration

1. **WhatsApp → Configuration → Webhook → Edit**: Callback URL = `https://YOUR-HOST/api/whatsapp`; Verify token = your `WHATSAPP_VERIFY_TOKEN`. Click **Verify and save**.
2. **Webhook fields → Manage → messages → Subscribe**. In the generic Webhooks view choose **WhatsApp Business Account → messages**. Status-only events are ignored.
3. If the WABA is not automatically subscribed by the test setup, use **POST `/{WABA-ID}/subscribed_apps`** with your configured Graph version and a token with `whatsapp_business_management`, per the [webhooks guide](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks). Kobo does not provision accounts.
4. From your verified phone, send the test number a synthetic transaction. This opens the **24-hour service window**; the adapter sends session replies/buttons, not outbound templates or scheduled reminders.

## 4. Check on your phone (not yet run)

- Review a fictional transaction; press **1 Save** once and check one ledger write.
- Try **2 Edit**, send replacement details, verify a new review needs a fresh save. An old button must not save the replacement. **3 Cancel** must not append money events.
- Send a short synthetic/consented voice note. Check the quoted transcript, names and amounts before saving. Transcribed `1 save` cannot confirm: use text/buttons.
- Invalid signatures/unknown senders must do nothing. Automated synthetic tests cover duplicate message IDs; real Meta redelivery is untested.

## 5. Longer-lived token / real number — separate approval

**Business settings → Users → System users → Add**; assign the app and WhatsApp account assets. **Generate new token → select app → expiry → `whatsapp_business_messaging` + `whatsapp_business_management`**. A non-expiring option is account-dependent; tokens remain revocable. Store privately and restart.

Real-number onboarding: **WhatsApp → API Setup → Add phone number** or **WhatsApp Manager → Phone numbers → Add**; follow verification, display-name, registration and two-step-verification prompts. Business verification, billing and advanced-access/app-review requirements depend on your account/use case. Do not blindly switch Live or register a real number.

## Important limits

Audio is bounded (15 MB input, 10 minutes), converted privately and deleted after processing. Transcripts remain in core pending/evidence storage. Deduplication is persistent **at-most-once**, not exactly-once delivery: long synchronous ASR may exceed webhook/proxy timeouts. Crashed/uncertain sends are quarantined, not automatically retried. Check the current review/ledger before a fresh user message; never delete dedupe rows or blindly replay confirmations. Durable worker/outbox recovery and retention cleanup remain production follow-up.

Web chat calls **POST `/api/whatsapp/voice`**, with existing owner-session cookie, same Origin and multipart field `audio` containing a recorded Blob or uploaded File. Let the browser set Content-Type. Returns `MessageReply` plus `transcript`; no client filesystem path/sender ID is accepted. **Your-turn UI wiring and real HTTPS microphone testing remain with the UI lane.** See [channel handoff](../src/server/channels/README.md).

References: [Get started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started), [Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks), [Media](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media).
