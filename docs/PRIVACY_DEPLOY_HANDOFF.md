# Privacy pages: deployment handoff

## Scope / approval

The owner approved drafting a privacy policy and deletion instructions, using `emma080355@gmail.com` as the public contact. This docs-lane task changes only `docs/`. It does not authorize code/config changes, a deployment, actual data deletion or publishing the Meta app.

Source content:

- `docs/PRIVACY_POLICY.md`
- `docs/DATA_DELETION.md`

Both are drafts for operator review before publication. The policy describes known code behavior; it is not a legal compliance certification or Meta approval guarantee. It deliberately does not promise automated database deletion, a fixed retention period, zero provider retention or a self-service erasure endpoint.

## Observed blocker

Meta's dashboard warns that the unpublished app only receives dashboard test webhooks, not phone-originated events. The publishing checklist flags the missing privacy-policy URL. This explains a likely delivery gate, but does not prove there are no other configuration issues.

At the time of this task, both proposed public paths returned HTTP 404:

- `https://trykobo.xyz/privacy`
- `https://trykobo.xyz/data-deletion`

Do not put these URLs into Meta until they actually serve the approved documents.

## Next lane task (requires owner coordination)

1. Confirm that the drafts reflect current production processing and actual operator practices, including configured model/gateway and hosting providers, logging, backup handling and the ability to handle manual privacy requests. The docs lane has not inspected production environment values or backups. Resolve factual or operational gaps before publication; obtain legal review as needed.
2. Serve the approved content as readable, public, unauthenticated pages at `/privacy` and `/data-deletion`, with cross-links and a visible contact email. Preserve the retention and deletion limitations. Do not add misleading claims about automated deletion or security.
3. Make only the necessary page/content changes; no authentication, ledger, webhook or model behavior changes are requested here.
4. Run the usual checks and, with deployment approval, deploy from main through the existing production process. Verify both URLs return HTTP 200 over HTTPS and render without login on a phone.
5. The owner can then enter the verified `/privacy` URL in Meta's **Privacy policy URL**, and `/data-deletion` under **User data deletion → Data deletion instructions URL**, save and revisit the publishing checklist. Publishing the app remains an owner action; inspect any remaining requirements rather than assuming these pages are sufficient.
6. After the app is eligible for phone-originated webhooks, send one new fictional text. Check sanitized service logs and inbox state. Do not print secrets, raw webhook payloads, sender numbers or transcripts. A missing journal line is not proof of no webhook: the handler does not emit request logs. Do not delete inbox/dedupe rows or blindly replay prior confirmations.

## Draft verification

Cross-checked against `src/server/web.ts`, `src/server/demo.ts`, `src/server/model-provider.ts`, `src/server/voice/index.ts`, `src/server/notebook.ts`, `src/server/service.ts`, `src/server/channels/whatsapp.ts` and `db/schema.sql` at main `dc69fbe`. No paid calls or production changes were made.
