import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LedgerStore } from './ledger-store';
import { Service } from './service';
import type { ModelProvider } from './model-provider';

let store: LedgerStore;
let response: unknown;
let service: Service;
const ctx = { channel: 'web' as const, senderId: 'session' };
const call = (name: string, args: object) => ({ status: 'completed', output: [{ type: 'function_call', status: 'completed', name, arguments: JSON.stringify(args) }] });
beforeEach(() => {
  store = new LedgerStore(':memory:');
  store.sqlite.exec("INSERT INTO owners VALUES ('a','A','x',0),('b','B','x',0); INSERT INTO customers VALUES ('c','a','Ada Example'),('d','b','Ada Example');");
  const model: ModelProvider = { listModels: async () => [], requestToolResponse: async () => response };
  service = new Service('a', store, model);
});
afterEach(() => store.close());
function fact(kind: string, amount: string | null) { response = call('record_facts', { facts: [{ kind, customer_name: 'Ada Example', amount_text: amount }] }); }
it('requires confirmation then lists deterministic debtors', async () => {
  fact('sale','1000');
  const review = await service.handleMessage({ ...ctx, text: 'credit sale: Ada Example: 1000' });
  expect(review.pending?.flags).toEqual([]); expect(store.events('a')).toHaveLength(0);
  await service.handleMessage({ ...ctx, text: '1' });
  expect(store.events('a')[0].amountKobo).toBe(100000);
  response = call('list_debtors', {});
  expect((await service.handleMessage({ ...ctx, text: 'who owes?' })).replyText).toContain('₦1000.00');
  expect(store.events('b')).toHaveLength(0);
});
it('blocks hallucinated, ambiguous and semantically unsupported amounts', async () => {
  fact('sale','1000');
  const review = await service.handleMessage({ ...ctx, text: 'Ada Example paid 1000 next week' });
  expect(review.pending?.flags.length).toBeGreaterThan(0);
  await expect(service.handleMessage({ ...ctx, text: '1' })).rejects.toThrow();
  expect(store.events('a')).toHaveLength(0);
});
it('replacement creates a fresh ID and rejects cross-owner and stale confirmation', async () => {
  fact('sale','1000');
  const first = await service.handleMessage({ ...ctx, text: 'credit sale: Ada Example: 1000' });
  await service.handleMessage({ ...ctx, text: '2' });
  fact('payment','500');
  const second = await service.handleMessage({ ...ctx, text: 'payment: Ada Example: 500' });
  expect(second.pending?.id).not.toBe(first.pending?.id);
  await expect(service.confirm({ ...ctx, pendingId: first.pending!.id })).rejects.toThrow();
  await expect(service.confirm({ ...ctx, senderId: 'other', pendingId: second.pending!.id })).rejects.toThrow();
  await expect(new Service('b', store, {} as ModelProvider).confirm({ ...ctx, pendingId: second.pending!.id })).rejects.toThrow();
  expect(store.events('a')).toHaveLength(0);
});
it('preserves a validated credit due date and blocks invalid dates', async () => {
  fact('sale','1000');
  const review = await service.handleMessage({ ...ctx, text: 'credit sale: Ada Example: 1000: due 2030-02-28' });
  expect(review.pending?.flags).toEqual([]);
  await service.handleMessage({ ...ctx, text: '1' });
  expect(store.events('a')[0].dueDate).toBe('2030-02-28');
  const invalid = await service.handleMessage({ ...ctx, text: 'credit sale: Ada Example: 1000: due 2030-02-30' });
  expect(invalid.pending?.flags.length).toBeGreaterThan(0);
  await expect(service.handleMessage({ ...ctx, text: '1' })).rejects.toThrow();
});
it('records a confirmed stock purchase once and includes it in spent', async () => {
  response = call('record_purchase', {description:'rice bags',amount_text:'2000'});
  const review = await service.handleMessage({ ...ctx, text: 'stock purchase: rice bags: 2000' });
  expect(review.pending?.flags).toEqual([]);
  expect(store.spent('a',0,Date.now()+1000)).toBe(0);
  await service.confirm({ ...ctx, pendingId: review.pending!.id });
  await service.confirm({ ...ctx, pendingId: review.pending!.id });
  expect(store.spent('a',0,Date.now()+1000)).toBe(200000);
  expect(store.spent('b',0,Date.now()+1000)).toBe(0);
  expect(() => store.sqlite.prepare('DELETE FROM stock_purchases').run()).toThrow();
  response = call('daily_summary', {});
  expect((await service.handleMessage({ ...ctx, text:'summary' })).replyText).toContain('stock spent ₦2000.00');
});
it('shows negative daily sales when a previous-day sale is reversed today', async () => {
  const clock = vi.spyOn(Date, 'now');
  try {
    clock.mockReturnValue(Date.now() - 2 * 86400000);
    const sale = store.propose({ownerId:'a', channel:'web', senderId:'session', idempotencyKey:'sale', rawInput:'synthetic', entries:[{kind:'sale', customerId:'c', amountKobo:10000}]});
    const [event] = store.confirm('a', sale.id, 'web', 'session');
    clock.mockRestore();
    const correction = store.propose({ownerId:'a', channel:'web', senderId:'session', idempotencyKey:'reverse', rawInput:'synthetic', entries:[{kind:'reversal',customerId:'c',amountKobo:10000,reversalOf:event.id}]});
    store.confirm('a',correction.id,'web','session');
    response = call('daily_summary', {});
    expect((await service.handleMessage({ ...ctx, text:'summary' })).replyText).toContain('sales -₦100.00');
  } finally { clock.mockRestore(); }
});
it('does not choose arbitrarily when a name collides with another alias', () => {
  store.sqlite.exec("INSERT INTO customers VALUES ('other','a','Another'); INSERT INTO customer_aliases VALUES ('a','other','Ada Example');");
  expect(store.findCustomer('a', 'Ada Example')).toBeUndefined();
});
it('rejects invalid provider output without saving', async () => {
  response = { status: 'incomplete', output: [] };
  await expect(service.handleMessage({ ...ctx, text: 'anything' })).rejects.toThrow();
  expect(store.events('a')).toHaveLength(0);
});
