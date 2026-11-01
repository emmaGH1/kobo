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

## Billing-fix follow-up — still blocked
Owner reported that billing/card verification was fixed and authorized a catalog retry, one five-minute delay if empty, and Zod installation.

1. `GET https://api.meta.ai/v1/models`, Bearer authentication: HTTP 200, `data` was `[]`.
2. Waited 300 seconds, then repeated the same GET exactly once: HTTP 200, `data` was still `[]`.

`muse-spark-1.3` was not listed. There was no HTTP error payload in these two catalog checks; the failure is an empty catalog, not a new model-not-found response. Per the owner's catalog-first gate, no further POST/tool-call attempt was made. Previous POST error remains HTTP 404, `model_not_found`, `The requested model was not found.` No fallback model or additional paid retry was attempted. Successful tool-call request/response format remains unverified.

## Dedicated Kobo credential follow-up — still blocked
Owner saved a credential in ignored `.env.local` through a hidden terminal prompt. Tests explicitly loaded Kobo's `.env.local`, not the voice harness environment. No credential values were displayed or compared.

- First GET /models using MODEL_BASE_URL and MODEL_API_KEY: HTTP 200, model IDs `[]`; configured MODEL_ID not listed.
- Waited 300 seconds and retried exactly once: HTTP 200, model IDs `[]`; configured MODEL_ID still not listed.
- No error payload reported by either catalog check. No POST/tool-call attempt made, per catalog-first gate.

Changing the credential source did not resolve access. This makes a harness-only credential-source issue less likely but does not establish which account owns the supplied key or prove a specific Meta-side fault. Next diagnostic is the billing-fixed account's dashboard/playground and, if needed, Meta support for an empty authenticated model catalog. No more blind retries.

## Owner-approved catalog bypass — minimal inference failed
Owner supplied screenshot evidence that `muse-spark-1.3` responds in their team/project playground. Directly inspected overview, authentication, quickstart and list-model documentation. Official examples use `https://api.meta.ai/v1`, Bearer authorization and model `muse-spark-1.3`; no extra team/project header is documented in those examples. Local non-secret checks confirmed official base URL/model, documented key structure, no surrounding whitespace/line breaks, correct .env.local loading, and owner-only credential file permissions. These checks do not establish account/project identity or key entitlement.

Owner explicitly approved bypassing the catalog gate for one minimal inference request, followed by tool-call proof only on success. Using Kobo's dedicated .env.local credential:

```http
POST https://api.meta.ai/v1/responses
Authorization: Bearer <server-side key, not recorded>
Content-Type: application/json
```

```json
{"model":"muse-spark-1.3","input":"Reply with OK."}
```

Result: HTTP 404. Request ID: `faa9e48e-9115-497d-907e-f55d04b1e435`.

```json
{"error":{"code":"model_not_found","message":"The requested model was not found.","param":null,"type":"invalid_request_error"}}
```

No tool definitions were sent, so this failure is independent of tool-schema formatting. No tool-call follow-up or retry was made. Playground access and API-key access disagree; the exact cause remains unverified. Next step: compare the playground's generated code (endpoint/model/header names, no secrets) and verify this key belongs to that same team/project. If those match, escalate to Meta support with the request ID. The empty catalog is not the sole blocker: dedicated-key inference now independently fails too.

## Provider boundary (implemented, mocked tests only)
`src/server/model-provider.ts` exports `ModelProvider` and `ResponsesModelProvider`. `MODEL_BASE_URL`, `MODEL_ID`, and `MODEL_API_KEY` are required server environment configuration; `.env.example` contains public defaults for the URL/model and no secret. No credential is copied into the app or committed. Importing the module makes no network requests. There are no automatic retries; requests have a 60-second timeout, reject redirects, and use `store: false` on Responses requests.

The transport's documented, not live-verified POST JSON is:

```json
{
  "model": "<MODEL_ID>",
  "input": [{ "role": "user", "content": "<text>" }],
  "tools": [{ "type": "function", "name": "list_debtors", "description": "Read debtors", "parameters": { "type": "object", "properties": {}, "additionalProperties": false } }],
  "tool_choice": "auto",
  "max_output_tokens": 1024,
  "store": false
}
```

The module validates configuration, request structure and model catalog with Zod. It returns Responses JSON as `unknown`: no tool-output parser or ledger execution is implemented before successful live proof. Per-tool argument Zod validation is still checkpoint B work, not satisfied by transport validation. Mock fixtures are explicitly not live provider evidence. Operator errors preserve HTTP status/code/detail, redact the API key, and do not log provider bodies. Swapping **Responses-compatible** models/providers is an env-only change; a provider using another protocol needs a new adapter implementing the interface.

## Resume gate
Zod approval is resolved and installed. Owner must resolve the still-empty catalog/account access. Then confirm `muse-spark-1.3` is listed and run one bounded real tool-call proof before implementing checkpoint B. A documented format or mocked provider test alone does not satisfy the live-proof acceptance criterion.
