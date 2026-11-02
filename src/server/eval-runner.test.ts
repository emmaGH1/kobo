import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { runEvaluation, cases, type EvalCase } from './eval-runner';
import { ModelProviderError, type ModelProvider } from './model-provider';

const call = (entries: object[], usage?: object) => ({ status: 'completed', ...(usage ? { usage } : {}), output: [{ type: 'function_call', status: 'completed', name: 'record_entries', arguments: JSON.stringify({ entries }) }] });
const fixture: EvalCase[] = [['Ada paid 2k', 'payment', 200000], ['Bola bought on credit for 5k', 'sale', 500000], ['Chika paid three eight', 'payment', null], ['Dayo paid 1k', 'payment', 100000]];
const entry = (kind: string, name: string, amount: string | null, evidence: string) => ({ kind, customer_name: name, description: null, amount_text: amount, evidence_text: evidence, due_date_text: null });

it('has 25 unique synthetic cases', () => { expect(cases).toHaveLength(25); expect(new Set(cases.map(c => c[0])).size).toBe(25); });

it('persists pass rate, per-case outcomes and token usage, classifying failures and errors without leaking payloads', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kobo-eval-'));
  const out = join(dir, 'nested', 'results.json');
  const lines: string[] = [];
  let n = 0;
  const provider: ModelProvider = { listModels: async () => [], requestToolResponse: async () => {
    n++;
    if (n === 1) return call([entry('payment', 'Ada', '2k', 'Ada paid 2k')], { input_tokens: 600, output_tokens: 50, total_tokens: 650 });
    if (n === 2) return call([entry('sale', 'Bola', '6k', 'Bola bought on credit for 5k')], { input_tokens: 610, output_tokens: 40 }); // fabricated quote -> flagged
    if (n === 3) return call([entry('payment', 'Chika', 'three eight', 'Chika paid three eight')], { input_tokens: 620, output_tokens: 30, total_tokens: 650 });
    throw new ModelProviderError(429, 'rate_limited', 'secret-looking provider detail');
  } };
  try {
    const summary = await runEvaluation({ provider, cases: fixture, outPath: out, log: l => lines.push(l) });
    expect(summary).toMatchObject({ total: 4, passed: 2, failed: 1, errors: 1, passRate: '2/4 (50.0%)' });
    expect(summary.usage).toEqual({ responsesWithUsage: 3, responsesWithoutUsage: 1, inputTokens: 1830, outputTokens: 120, totalTokens: 1950 });
    expect(summary.results.map(r => r.outcome)).toEqual(['pass', 'fail', 'pass', 'error']);
    expect(summary.results[1].reason).toBe('unexpected clarification flag');
    expect(summary.results[3].reason).toBe('provider HTTP 429');
    const saved = JSON.parse(readFileSync(out, 'utf8'));
    expect(saved).toEqual(summary);
    expect(JSON.stringify(saved)).not.toContain('secret-looking');
    expect(JSON.stringify(saved)).not.toContain('Ada paid');
    expect(lines.at(-1)).toContain('2/4 (50.0%) passed');
    await expect(runEvaluation({ provider, cases: fixture, selected: [9] })).rejects.toThrow('Invalid synthetic case selection');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

it('distinguishes a missing review from the wrong number of entries', async () => {
  const none: ModelProvider = { listModels: async () => [], requestToolResponse: async () => ({ status: 'completed', output: [] }) };
  const two: ModelProvider = { listModels: async () => [], requestToolResponse: async () => call([entry('payment', 'Ada', '2k', 'Ada paid 2k'), entry('payment', 'Ada', '2k', 'Ada paid 2k')]) };
  expect((await runEvaluation({ provider: none, cases: fixture.slice(0, 1), log: () => {} })).results[0]).toMatchObject({ outcome: 'fail', reason: 'no review returned (safe error or unknown-request reply)' });
  expect((await runEvaluation({ provider: two, cases: fixture.slice(0, 1), log: () => {} })).results[0]).toMatchObject({ outcome: 'fail', reason: '2 entries instead of 1' });
});
