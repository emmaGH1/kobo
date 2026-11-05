# Channels lane integration handoff

Branch `channels`, based on committed `core` at d87d525. This checkout does not include core's unrelated uncommitted model-provider edits. No core, shared contract or product UI files changed.

## Web voice

```ts
const form = new FormData();
form.append('audio', recordingBlob, 'recording.webm');
const response = await fetch('/api/whatsapp/voice', {
  method: 'POST', body: form, credentials: 'same-origin',
});
const reply = await response.json(); // MessageReply + transcript, or { error }
```

The unusual route location respects this lane's explicit route ownership. Supports recorded WebM/Ogg/MP4 and uploaded WAV/MP3/AAC/MP4/Ogg/WebM. Exactly one multipart field `audio`; no audioPath, text caption, sender or owner field. Same Origin/session as `/api/dev`. Preserve pending/interactive IDs and continue review actions via the chat's existing authenticated endpoint. The wrapper prepends the transcript quote to replyText and pending.summary; transcript is also a separate field. No browser recording controls were built/tested here.

Core `Service.handleMessage` rejects audioPath. `voice/index.ts:handleVoiceMessage` accepts a trusted server-created reference, transcribes it and calls core with text only. No audio path is retained in ledger evidence. A transcribed confirmation/edit/cancel command is not passed to core: use buttons or typed choices. Other audio can answer core's current clarification question; it never bypasses core validation.

Keywords: owner customer names from `LedgerStore.customers`; optional explicit product arrays from `VOICE_PRODUCT_NAMES_JSON`. No product catalogue exists. Hints are deduplicated/bounded to 100 names of 100 characters. Bias is not a correctness guarantee. A core-owned future catalogue can replace that configuration hook.

## Media/security

ASR always uses direct Meta `https://api.meta.ai/v1/asr/transcribe` with `muse-voice-transcribe-1.0`; text `MODEL_BASE_URL`/`MODEL_ID` do not select its endpoint/model. `VOICE_API_KEY` takes precedence. Only a direct HTTPS `api.meta.ai` text base (including the default) permits fallback to `MODEL_API_KEY`; a gateway or invalid base without a dedicated voice key fails before conversion/ASR, never forwards the gateway credential. No `VOICE_BASE_URL`/`VOICE_MODEL_ID` override is currently implemented. Configure a direct Meta-authorized voice key privately; a valid WhatsApp Graph token does not authorize ASR.

15 MB input, at most 600 seconds decoded audio, mono PCM16 WAV/24 kHz, 31 MB converted-file cap. FFmpeg timeout 45 s, FFprobe 10 s, Muse HTTP 180 s. Harness request is preserved: JSON multipart `request` with empty filename, WAV `audio`, direct Meta endpoint, optional languageBias/keywords, buffered top-level transcript. No automatic network retries or raw provider logging.

Private `private/audio/clip-*` directories (or trusted `KOBO_AUDIO_DIR`) have mode 0700 and source files 0600. Callback scope deletes source and converted WAV on success/failure. Each new upload also sweeps own crash-orphan directories older than one hour; if traffic stops after a crash, an operator must remove old orphans (no background timer is installed). Never serve the directory publicly. Core pending/evidence transcript retention is unchanged.

Per-owner voice limit 3/minute, global 10/minute (persistent existing request_limits table); web charges before multipart parsing, WhatsApp before media fetch. Text uses core model limits. These are rate caps, not a billing budget or complete DoS protection.

## WhatsApp

Raw-body HMAC-SHA256 before JSON parsing; separate verification token; explicit sender-to-non-demo-owner map and destination Phone number ID check. Media URL is fetched by ID from Graph, then only HTTPS `lookaside.fbsbx.com` with redirects disabled and bounded streaming. Access token is never forwarded to a webhook-supplied arbitrary host.

Text routes through handleMessage (including 1/2/3). Reply buttons/lists route through handleInteractive, retaining review ID/version and core's owner/channel/sender validation. Core renders the 1 Save / 2 Edit / 3 Cancel buttons when applicable; unresolved reviews omit Save. The renderer uses complete `replyText`, not the potentially shortened `interactive.body`: valid controls + reply ≤1,024 UTF-16 units produce one complete interactive message, not a repeated text/interactive pair. Longer replies send the entire text in ≤4,096-unit chunks, then one distinct `Choose an option for the reply above.` interactive with unchanged controls. Without interactive metadata, only full plain text is sent. Redundant footers already in the reply are omitted; distinct valid footers are retained for both buttons and lists.

Control validation: 1–3 buttons (titles ≤20), 1–10 list rows (titles ≤24, descriptions ≤72), opener ≤20, footer ≤60, unique nonblank/unpadded IDs ≤100 (matching inbound validation), unique button titles, well-formed nonblank Unicode fields. No truncation of IDs/labels or partial row arrays: malformed/over-limit metadata falls back to the contract's complete typed-choice reply. This relies on upstream honoring that typed-equivalent contract; the renderer cannot recover choices already omitted there. UTF-16 limits are conservative; text splitting preserves whitespace and ordinary grapheme clusters/emoji, with code-point splitting only for a pathological cluster larger than a whole message. Long messages still require multiple sends and retain the partial/uncertain-delivery limitations below.

`channel_whatsapp_inbox` is created lazily in the existing SQLite DB, without core schema edits. INSERT OR IGNORE claims message IDs before execution. State moves processing → sending → done, or uncertain on outbound failure. Duplicate IDs never rerun, even after restart. No raw webhook, transcript or outbound message is copied to this table. Inbox sender identifiers are private data: retain for the pilot; there is not yet an automatic cleanup policy.

This is synchronous processing, **not a durable exactly-once queue**. Long ASR can exceed Meta/proxy acknowledgement deadlines; duplicate delivery is suppressed while the original is running. A process crash or uncertain send can lose a reply. Do not clear/replay rows blindly: inspect current review/ledger, then ask for a fresh user message if needed. Before production add durable jobs, quick acknowledgement, serialized per-conversation handling, recovery tooling and a bounded inbox retention policy. No automatic re-send of possibly delivered confirmations.

## Evidence boundary

Offline tests use synthetic audio, in-memory SQLite and mocked HTTP. No new paid Muse calls, WhatsApp sends, Meta registration, external HTTPS/microphone verification or production deployment were performed. Setup guide: `docs/WHATSAPP-SETUP.md`.
