import { expect, it } from 'vitest';
import { LedgerStore } from './ledger-store';
import { Service } from './service';
import { createModelProvider, ModelProviderError } from './model-provider';

// Explicit opt-in: synthetic names only, in-memory DB, paid provider calls, no confirmations.
const cases: [string, string, number | null][] = [
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
it.skipIf(process.env.KOBO_LIVE_EVAL !== '1')('evaluates 25 synthetic messages against the live configured provider', async () => {
  let passed=0, failed=0, errors=0;
  const selected = process.env.KOBO_LIVE_CASES?.split(',').map(value => Number(value.trim()));
  if (selected && selected.some(n => !Number.isInteger(n) || n < 1 || n > cases.length)) throw new Error('Invalid synthetic case selection');
  const underlying=createModelProvider();
  let inputTokens=0, outputTokens=0, usageResponses=0;
  const provider = { ...underlying, listModels: () => underlying.listModels(), requestToolResponse: async (...args: Parameters<typeof underlying.requestToolResponse>) => {
    const response = await underlying.requestToolResponse(...args);
    const usage = (response as {usage?: {input_tokens?: unknown; output_tokens?: unknown}})?.usage;
    if (typeof usage?.input_tokens === 'number' && Number.isSafeInteger(usage.input_tokens) && usage.input_tokens >= 0 && typeof usage.output_tokens === 'number' && Number.isSafeInteger(usage.output_tokens) && usage.output_tokens >= 0) {
      inputTokens += usage.input_tokens; outputTokens += usage.output_tokens; usageResponses++;
    }
    return response;
  }};
  for (const [index, [text,kind,amount]] of cases.entries()) {
    if (selected && !selected.includes(index + 1)) continue;
    const store=new LedgerStore(':memory:');
    try {
      store.sqlite.exec("INSERT INTO owners VALUES ('a','A','x',0)");
      const result=await new Service('a',store,provider).handleMessage({channel:'web',senderId:'s',text});
      const pending=result.pending && store.pending('a',result.pending.id);
      const correctEntry = !!pending && pending.entries.length === 1 && pending.entries[0].kind === kind && pending.entries[0].customerName === text.split(' ')[0];
      const ok = correctEntry && (amount === null ? !!pending.flags.length && !pending.entries[0].amountKobo : pending.flags.length === 0 && pending.entries[0].amountKobo === amount);
      if (ok) passed++; else {failed++; console.log(`Case ${index+1} failed`);}
    } catch (error) {
      errors++;
      // Do not print provider payloads, model output, credentials or untrusted messages.
      const category = error instanceof ModelProviderError ? `provider HTTP ${error.status}` : error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'processing or transport';
      console.log(`Case ${index+1} error: ${category}`);
    }
    finally {store.close();}
  }
  // Write directly: some Vitest reporters suppress console.log from passing tests.
  process.stdout.write(`Live synthetic evaluation: ${passed} passed, ${failed} failed, ${errors} errors, ${selected ? new Set(selected).size : cases.length} total; no confirmations.\n`);
  process.stdout.write(`Provider usage: ${inputTokens} input tokens, ${outputTokens} output tokens from ${usageResponses} responses with usage; errors or missing usage are not included.\n`);
  expect(passed+failed+errors).toBe(selected ? new Set(selected).size : 25);
}, 600000);
