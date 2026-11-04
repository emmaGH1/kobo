# Kobo Privacy Policy

Last updated: 4 November 2026

## Who we are

Kobo is an early-stage bookkeeping service for Nigerian market traders, available at https://trykobo.xyz. It helps interpret bookkeeping messages, prepare entries for review and keep confirmed records. This policy covers Kobo's website, web chat and connected WhatsApp service.

For privacy questions and requests, contact the Kobo operator at **emma080355@gmail.com**.

## Information we process

Depending on the features you use, Kobo processes:

- **Bookkeeping content:** messages, customer names and aliases, product names, amounts, payments, debts, due dates, stock records, corrections and confirmation choices.
- **WhatsApp information:** your sender phone number, message identifiers and message content received through Meta's WhatsApp service. Access is mapped to an authorized Kobo owner; sending a message does not automatically create owner access.
- **Voice notes:** audio you submit for transcription, the resulting text, and customer or configured product names used as transcription hints.
- **Notebook photos:** images you submit for reading, extracted text and proposed entries.
- **Access and technical information:** owner or demo identifiers, session cookies and server-side session records, language preferences, rate-limit records, timestamps, model-usage counts and technical information necessary to serve and secure requests. The demo can use a hashed IP address for rate limiting. Our hosting infrastructure also handles network information such as IP addresses when you connect.

Please use fictional data when trying the hackathon demo. Do not submit passwords, banking credentials, payment-card details or unrelated sensitive information. Only submit other people's information when you are entitled to use it for bookkeeping.

## Why we use this information

We use information to provide the requested bookkeeping functions, associate requests with the correct owner or demo session, transcribe or read submitted content, prepare reviews, store confirmed records, prevent duplicate processing, limit abuse, troubleshoot failures and respond to privacy requests.

A review may be stored before confirmation. **Confirmation controls changes to the financial ledger; it does not mean that unconfirmed messages are never processed or stored.** Cancelling a review does not itself erase its source text or pending record.

## AI processing and other service providers

Some requests use Meta's Muse Spark models to interpret text or notebook photos. Voice processing uses Meta's Muse Voice transcription service. Text and image requests are sent to the configured model API provider, which may be Meta directly or an API gateway such as Vercel AI Gateway. Voice transcription may include the trader's customer names and explicitly configured product names as keyword hints.

These providers receive the content needed for those requests. Kobo requests `store: false` for its Responses API calls, but this is not a guarantee that providers keep no operational or security records. Their own terms and privacy policies govern their processing. Kobo's code, rather than the model, calculates ledger amounts and balances; please still review names, amounts and interpretations carefully.

Meta also processes WhatsApp messages under its own terms and privacy policy. Hosting and network providers process information necessary to operate the service. Provider processing may occur outside Nigeria. Contact us if you need details about the providers used for your data before submitting it.

We do not sell your personal information. We may disclose information where required by applicable law or necessary to address security incidents.

## Storage and retention

Bookkeeping records, submitted text, extracted text, voice transcripts, pending reviews, preferences and technical records can be stored in Kobo's server-side database. There is currently **no automatic deletion schedule for these database records**. Expiry of a session or review prevents its use; it does not necessarily delete the underlying data. Starting a new demo also does not guarantee deletion of earlier demo records.

Uploaded voice files and converted audio are removed from Kobo's processing directory when processing finishes, including handled failures. A server crash can leave temporary files; a later upload attempts to remove orphaned audio directories older than one hour. This is not a guaranteed one-hour deletion deadline, and it does not delete copies held by WhatsApp or transcription providers. Transcripts may remain in database records.

The notebook-reading path processes images in memory, strips supported image metadata before forwarding them, and does not persist or serve the image itself. Extracted content and an image digest may remain in associated records. Avoid including unrelated information in the picture.

Confirmed financial records are append-only in normal application operation: a correction creates a new event rather than overwriting the original. Deletion requests need manual assessment; there is no self-service account-erasure feature. See the deletion instructions for how to contact us. We do not promise immediate deletion or a fixed backup-expiry period.

## Cookies and security

Kobo uses session cookies to support owner access and isolated demo sessions. Production session cookies are configured as Secure and HttpOnly. Server-side access checks restrict owners' records, and WhatsApp webhook signatures are checked before incoming messages are trusted. These safeguards reduce risk but cannot guarantee absolute security.

Never share your owner passcode, verification codes or API tokens. A device with an active owner session may be able to access that owner's records.

## Your choices and requests

You can stop using the service, decline to upload audio or photos, and cancel a financial proposal before confirming it. You may contact **emma080355@gmail.com** to request access, correction or deletion, raise a privacy concern or ask about rights available under applicable law. We may need proportionate information to verify your identity and authority over the records. Do not email passwords, access tokens or identity documents unless a necessary, secure process has first been agreed.

Deleting your WhatsApp chat, clearing cookies or resetting the demo does not by itself delete records held by Kobo. Requests concerning copies independently held by Meta or other providers may need to be directed to those providers.

## Changes

We may update this policy as the prototype changes. The date above identifies the latest version. Material changes should be explained before the affected processing begins.
