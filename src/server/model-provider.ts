import { env } from 'node:process';
import { z } from 'zod';

const configSchema = z.object({
  MODEL_BASE_URL: z.url().refine(value => {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash;
  }, 'Use an HTTPS API base URL without credentials, query or fragment'),
  MODEL_ID: z.string().trim().min(1),
  MODEL_API_KEY: z.string().trim().min(1),
});
export interface ModelConfig { baseUrl: string; modelId: string; apiKey: string }
export function modelConfig(environment: Record<string, string | undefined> = env): ModelConfig {
  const result = configSchema.safeParse(environment);
  // Never put config values (especially the API key) into validation errors.
  if (!result.success) throw new Error(`Invalid model configuration: ${[...new Set(result.error.issues.map(issue => issue.path[0]))].join(', ')}`);
  return { baseUrl: result.data.MODEL_BASE_URL.replace(/\/+$/, ''), modelId: result.data.MODEL_ID, apiKey: result.data.MODEL_API_KEY };
}

const functionToolSchema = z.object({
  type: z.literal('function'),
  name: z.string().regex(/^[a-z_][a-z0-9_]*$/),
  description: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()),
  strict: z.boolean().optional(),
}).strict();
const requestSchema = z.object({
  input: z.string().min(1),
  tools: z.array(functionToolSchema).min(1),
}).strict();
export type ToolRequest = z.infer<typeof requestSchema>;

/** Server-only injection boundary. No ledger or provider credentials cross into core/UI code. */
export interface ModelProvider {
  listModels(): Promise<string[]>;
  /** Raw JSON until a real successful response establishes the tool-call parser contract. */
  requestToolResponse(request: ToolRequest): Promise<unknown>;
}

export class ModelProviderError extends Error {
  constructor(readonly status: number, readonly code: string | undefined, readonly detail: string | undefined) {
    // Safe generic message for application handling; detail is operator-only, never log raw bodies.
    super(`Model provider request failed (HTTP ${status}${code ? `, ${code}` : ''})`);
    this.name = 'ModelProviderError';
  }
}

/** Responses API transport. Switching compatible providers/models requires only environment changes. */
export class ResponsesModelProvider implements ModelProvider {
  constructor(private readonly config: ModelConfig, private readonly transport: typeof fetch = fetch) {
    // Also validate programmatically injected configuration, not only process.env.
    this.config = modelConfig({ MODEL_BASE_URL: config.baseUrl, MODEL_ID: config.modelId, MODEL_API_KEY: config.apiKey });
  }
  private async send(path: string, request?: Record<string, unknown>): Promise<unknown> {
    const response = await this.transport(`${this.config.baseUrl}${path}`, {
      method: request ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${this.config.apiKey}`, ...(request ? { 'Content-Type': 'application/json' } : {}) },
      ...(request ? { body: JSON.stringify(request) } : {}),
      signal: AbortSignal.timeout(60_000),
      redirect: 'error',
    });
    let data: unknown;
    try { data = await response.json(); }
    catch { throw new ModelProviderError(response.status, 'invalid_json', undefined); }
    if (!response.ok) {
      const parsed = z.object({ error: z.object({ code: z.string().nullish(), message: z.string().nullish() }) }).safeParse(data);
      const redact = (value: string | null | undefined) => value?.replaceAll(this.config.apiKey, '[REDACTED]');
      throw new ModelProviderError(response.status, redact(parsed.success ? parsed.data.error.code : undefined), redact(parsed.success ? parsed.data.error.message : undefined));
    }
    return data;
  }
  async listModels(): Promise<string[]> {
    const result = z.object({ data: z.array(z.object({ id: z.string().min(1) })) }).safeParse(await this.send('/models'));
    if (!result.success) throw new Error('Invalid model catalog response');
    return result.data.data.map(model => model.id);
  }
  async requestToolResponse(request: ToolRequest): Promise<unknown> {
    const parsed = requestSchema.safeParse(request);
    if (!parsed.success) throw new Error('Invalid tool response request');
    // A larger cap permits reasoning plus a tool call. Never retry a paid request automatically:
    // incomplete responses fail closed in Service, and the caller may choose to try again.
    return this.send('/responses', {
      model: this.config.modelId,
      input: [{ role: 'user', content: parsed.data.input }],
      tools: parsed.data.tools,
      tool_choice: 'auto',
      max_output_tokens: 4096,
      store: false,
    });
  }
}

export function createModelProvider(environment: Record<string, string | undefined> = env): ModelProvider {
  return new ResponsesModelProvider(modelConfig(environment));
}
