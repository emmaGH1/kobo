import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { LedgerStore } from './ledger-store';
import { Service } from './service';
import { ModelProviderError, type ModelProvider } from './model-provider';

/** Synthetic cases only: [message, expected kind, expected kobo or null when a clarification is required]. */
export type EvalCase = [text: string, kind: string, amountKobo: number | null];
export const cases: EvalCase[] = [
  ['Ada bought on credit for 5k','sale',500000], ['Bola paid 2k','payment',200000],
  ['Chika owes me 10k from before','opening_debt',1000000], ['Dayo paid ₦1,500','payment',150000],
  ['Ada bought goods on credit for 12,000 naira','sale',1200000], ['Bola paid five thousand naira','payment',500000],
  ['Chika bought on credit for 1.5k','sale',150000], ['Dayo paid 500 naira','payment',50000],
  ['Ada owes 8k from before','opening_debt',800000], ['Bola bought on credit for 30k','sale',3000000],
  ['Chika paid 3,500','payment',350000], ['Dayo bought on credit for 20 thousand naira','sale',2000000],
  ['Ada paid 100.50 naira','payment',10050], ['Bola owes 2000 from before','opening_debt',200000],
  ['Chika bought on credit for 100k','sale',10000000], ['Dayo paid 1m','payment',100000000],
  ['Ada bought on credit for 2500','sale',250000], ['Bola paid 7k','payment',700000],
  ['Chika owes 900 naira from before','opening_debt',90000], ['Dayo bought on credit for 4k','sale',400000],
  ['Ada paid three eight','payment',null], ['Bola bought on credit','sale',null],
  ['Chika paid 2.5k','payment',250000], ['Dayo owes me 15k from before','opening_debt',1500000],
  ['Ada bought on credit for 6,000','sale',600000],
];

export type Outcome = 'pass' | 'fail' | 'error';
export interface CaseResult {
  case: number; expectedKind: string; expectedAmountKobo: number | null; outcome: Outcome;
  /** Category only: never provider output, credentials or message text. */
  reason?: string;
  inputTokens?: number; outputTokens?: number; totalTokens?: number;
}
export interface EvalSummary {
  /** UTC time the run finished. */
  finishedAt: string;
  total: number; passed: number; failed: number; errors: number;
  passRate: string;
  usage: { responsesWithUsage: number; responsesWithoutUsage: number; inputTokens: number; outputTokens: number; totalTokens: number };
  results: CaseResult[];
  note: string;
}
const count = (n: unknown) => (typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : undefined);

export function errorCategory(error: unknown): string {
  if (error instanceof Error && 'category' in error && typeof error.category === 'string') return error.category;
  if (error instanceof ModelProviderError) return `provider HTTP ${error.status}`;
  if (error instanceof Error && error.name === 'TimeoutError') return 'timeout';
  return 'processing or transport';
}

/** Runs each case against a fresh in-memory ledger. Never confirms, never persists a ledger. */
export async function runEvaluation(options: { provider: ModelProvider; cases?: EvalCase[]; selected?: number[]; outPath?: string; log?: (line: string) => void }): Promise<EvalSummary> {
  const all = options.cases ?? cases;
  if (options.selected?.some(n => !Number.isInteger(n) || n < 1 || n > all.length)) throw new Error('Invalid synthetic case selection');
  const picked = options.selected ? [...new Set(options.selected)].sort((a, b) => a - b) : all.map((_, i) => i + 1);
  const log = options.log ?? ((line: string) => process.stderr.write(`${line}\n`));
  const results: CaseResult[] = [];
  for (const number of picked) {
    const [text, kind, amount] = all[number - 1];
    // Usage is captured per case and survives a later processing error, but not a provider HTTP/timeout error (no response).
    const usage: { input?: number; output?: number; total?: number; seen: boolean; providerError?: string } = { seen: false };
    const provider: ModelProvider = { listModels: () => options.provider.listModels(), requestToolResponse: async request => {
      // The service turns provider failures into a safe user reply, so classify them here at the boundary.
      let response: unknown;
      try { response = await options.provider.requestToolResponse(request); } catch (error) { usage.providerError = errorCategory(error); throw error; }
      const u = (response as { usage?: Record<string, unknown> } | null)?.usage;
      const input = count(u?.input_tokens), output = count(u?.output_tokens);
      if (input !== undefined && output !== undefined) { usage.seen = true; usage.input = (usage.input ?? 0) + input; usage.output = (usage.output ?? 0) + output; usage.total = (usage.total ?? 0) + (count(u?.total_tokens) ?? input + output); }
      return response;
    } };
    const store = new LedgerStore(':memory:');
    const result: CaseResult = { case: number, expectedKind: kind, expectedAmountKobo: amount, outcome: 'error' };
    try {
      store.sqlite.exec("INSERT INTO owners VALUES ('a','A','x',0)");
      const reply = await new Service('a', store, provider).handleMessage({ channel: 'web', senderId: 's', text });
      if (usage.providerError) throw Object.assign(new Error('provider'), { category: usage.providerError });
      const pending = reply.pending && store.pending('a', reply.pending.id);
      const entry = pending?.entries[0];
      let reason: string | undefined;
      if (!pending) reason = 'no review returned (safe error or unknown-request reply)';
      else if (pending.entries.length !== 1) reason = `${pending.entries.length} entries instead of 1`;
      else if (entry!.kind !== kind) reason = 'wrong transaction kind';
      else if (entry!.customerName !== text.split(' ')[0]) reason = 'wrong customer';
      else if (amount === null) { if (!pending.flags.length || entry!.amountKobo) reason = 'expected a clarification but amount was accepted'; }
      else if (pending.flags.length) reason = 'unexpected clarification flag';
      else if (entry!.amountKobo !== amount) reason = 'wrong amount';
      result.outcome = reason ? 'fail' : 'pass';
      if (reason) result.reason = reason;
    } catch (error) {
      result.outcome = 'error'; result.reason = errorCategory(error);
    } finally { store.close(); }
    if (usage.seen) { result.inputTokens = usage.input; result.outputTokens = usage.output; result.totalTokens = usage.total; }
    results.push(result);
    log(`case ${number}: ${result.outcome}${result.reason ? ` (${result.reason})` : ''}`);
  }
  const passed = results.filter(r => r.outcome === 'pass').length, failed = results.filter(r => r.outcome === 'fail').length, errors = results.filter(r => r.outcome === 'error').length;
  const withUsage = results.filter(r => r.inputTokens !== undefined);
  const sum = (key: 'inputTokens' | 'outputTokens' | 'totalTokens') => withUsage.reduce((t, r) => t + (r[key] ?? 0), 0);
  const summary: EvalSummary = {
    finishedAt: new Date().toISOString(), total: results.length, passed, failed, errors,
    passRate: `${passed}/${results.length} (${results.length ? ((passed / results.length) * 100).toFixed(1) : '0.0'}%)`,
    usage: { responsesWithUsage: withUsage.length, responsesWithoutUsage: results.length - withUsage.length, inputTokens: sum('inputTokens'), outputTokens: sum('outputTokens'), totalTokens: sum('totalTokens') },
    results,
    note: 'Synthetic extraction check; no confirmations, no ledger persisted, no real data. Not a production accuracy or safety benchmark. Tokens exclude cases whose provider call errored.',
  };
  if (options.outPath) {
    // Persist before any assertion so a reporter can never swallow the evidence.
    mkdirSync(dirname(options.outPath), { recursive: true });
    writeFileSync(options.outPath, `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o644 });
  }
  log(`Live synthetic evaluation: ${summary.passRate} passed; ${failed} failed, ${errors} errors. Tokens: ${summary.usage.inputTokens} in / ${summary.usage.outputTokens} out / ${summary.usage.totalTokens} total across ${withUsage.length} responses with usage.`);
  return summary;
}
