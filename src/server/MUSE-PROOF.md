# Muse tool-call proof — blocked

## Scope
Owner-authorized text-only synthetic integration proof before checkpoint B. No voice, WhatsApp, private harness transcripts, or real customer data sent. Existing server credential loaded without displaying or copying it. No automatic retry loop or alternate model substitution.

## Official references inspected directly
- https://dev.meta.ai/docs/tool-calling
- https://dev.meta.ai/docs/api-reference/responses/create-response

The tool-calling reference recommends `POST https://api.meta.ai/v1/responses`, Bearer authentication, flat tool definitions (`type`, `name`, `description`, `parameters`), and describes `output` items of type `function_call` with `name`, `arguments`, `call_id`, and `status`. A follow-up uses `function_call_output` referencing `call_id`. This is documentation evidence, not a verified successful response.

## Actual requests
1. Model `muse-spark-1.3`, synthetic list-debtors prompt, string `input`, one flat `list_debtors` function with an empty-object JSON schema, `tool_choice: required`. Result: HTTP 400, `invalid_request_error`. Detailed message was not retained; cause unknown.
2. After direct documentation inspection, revised request used an input user-message array, `tool_choice: auto`, explicit `strict: false`, `max_output_tokens: 1024`, `store: false`, same model and synthetic read-only tool. Result: HTTP 404, error code `model_not_found`, message `The requested model was not found.`
3. Diagnostic `GET /v1/models`: HTTP 200, `data` contained an empty model list for the available credential.

No successful function-call response received. No model-created pending action or ledger write occurred. Raw provider responses and credentials are not tracked. Model access/account provisioning is unresolved; do not build a parser on an assumed successful format or silently use another model.

## Resume gate
Owner resolves model access and authorizes adding Zod to shared package.json/lockfile. Then run one bounded real tool-call proof before implementing checkpoint B. A documented format alone does not satisfy the live-proof acceptance criterion.
