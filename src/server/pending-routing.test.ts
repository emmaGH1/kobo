import { afterEach, expect, it, vi } from 'vitest';
import { LedgerStore, type EntryDraft } from './ledger-store';
import { Service } from './service';
import { resolveDueDate } from './due-date';
import type { ModelProvider } from './model-provider';

const ctx = { channel: 'web' as const, senderId: 's' };
const sample = 'Mama Chidi carry rice 45k, she pay 20k, remain Friday';
const english = 'Ada bought 3 crates of eggs on credit for 27,000, she will pay tomorrow';
const nextWeek = 'Chinedu collect 2 carton indomie, 18 thousand, e go pay next week';
const stores: LedgerStore[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); vi.restoreAllMocks(); });
function setup() {
  const store = new LedgerStore(':memory:'); stores.push(store);
  store.sqlite.exec("INSERT INTO owners VALUES ('a','A','x',0),('b','B','x',0); INSERT INTO customers VALUES ('m','a','Mama Chidi'),('bayo','a','Bayo'),('bolo','a','Bolo')");
  const request = vi.fn(async ({ input }: { input: string }) => {
    const text = input.split('<message>\n')[1].split('\n</message>')[0];
    const name = text === english ? 'Ada' : text === nextWeek ? 'Chinedu' : 'Mama Chidi';
    // Deliberately quote the full literal date phrase, or omit it entirely: code must handle both.
    const entries = [{ kind: 'sale', customer_name: name, description: null, amount_text: text === english ? '27,000' : text === nextWeek ? '18 thousand' : '45k', evidence_text: text, due_date_text: text === sample ? 'remain Friday' : null, remaining_text: null }];
    if (text === sample) entries.push({ ...entries[0], kind: 'payment', amount_text: '20k', due_date_text: null });
    return { status: 'completed', output: [{ type: 'function_call', status: 'completed', name: 'record_entries', arguments: JSON.stringify({ entries }) }] };
  });
  const provider: ModelProvider = { listModels: async () => [], requestToolResponse: request };
  return { store, request, service: new Service('a', store, provider), other: new Service('b', store, provider) };
}
function pending(store: LedgerStore, entries: EntryDraft[], flags: string[]) {
  return store.propose({ ownerId: 'a', ...ctx, idempotencyKey: 'old', rawInput: 'earlier transaction', entries, flags });
}

it.each(['remain Friday', 'pay Friday', 'she go pay Friday', 'pay monday', 'she will pay tomorrow', 'e go pay Friday'])('resolves only a whole supported promise: %s', phrase => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2030-01-02T10:00:00Z')); // Wednesday in Lagos
  expect(resolveDueDate(phrase)).toBe(phrase.includes('monday') ? '2030-01-07' : phrase.includes('tomorrow') ? '2030-01-03' : '2030-01-04');
  expect(resolveDueDate(`Ada bought eggs, ${phrase}`)).toBeUndefined();
  expect(resolveDueDate('next week')).toBeUndefined();
});

it('handles exact landing sample #2 then summary, history and a separate English sale without saving', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2030-01-02T10:00:00Z'));
  const { store, service, request } = setup();
  const sale = await service.handleMessage({ ...ctx, text: sample });
  expect(sale.pending!.flags).toEqual([]);
  expect(sale.replyText).toContain('Fri 4 Jan');
  expect(sale.replyText).not.toMatch(/\d{4}-\d{2}-\d{2}|YYYY/);
  expect(store.pending('a', sale.pending!.id)!.entries.map(e => [e.kind, e.amountKobo, e.dueDate])).toEqual([['sale',4500000,'2030-01-04'],['payment',2000000,undefined]]);
  const summary = await service.handleMessage({ ...ctx, text: 'How market today?' });
  expect(summary.replyText).toContain('₦0');
  expect(summary.pending).toBeUndefined();
  const book = await service.handleMessage({ ...ctx, text: 'Show Mama Chidi book' });
  expect(book.replyText).toContain('Mama Chidi');
  expect(book.pending).toBeUndefined();
  expect(store.current('a', 'web', 's')[0].id).toBe(sale.pending!.id);
  expect(request).not.toHaveBeenCalled(); // the complete numeric repro does not depend on a model
  const ada = await service.handleMessage({ ...ctx, text: english });
  expect(ada.pending!.id).not.toBe(sale.pending!.id);
  expect(ada.pending!.flags).toEqual([]);
  expect(ada.replyText).toContain('earlier draft aside without saving');
  expect(store.pending('a', ada.pending!.id)!.entries[0]).toMatchObject({ customerName: 'Ada', amountKobo: 2700000, dueDate: '2030-01-03' });
  expect(store.pending('a', sale.pending!.id)!.status).toBe('superseded');
  expect(store.events('a')).toHaveLength(0);
  await expect(service.confirm({ ...ctx, pendingId: sale.pending!.id })).rejects.toThrow();
});

it.each(['amount', 'customer', 'date'] as const)('does not let a pending %s question consume unrelated new messages', async type => {
  const { store, service, request, other } = setup();
  const entry: EntryDraft = type === 'amount' ? { kind: 'payment', customerId: 'bayo', amountQuestion: { candidatesKobo: [380000,3800000], flag: 'amount?' } }
    : type === 'customer' ? { kind: 'sale', customerName: 'Bola', customerCandidates: ['bolo'], amountKobo: 100000 }
    : { kind: 'sale', customerId: 'm', amountKobo: 4500000, needsDueDate: true };
  const old = pending(store, [entry], [type === 'date' ? 'Which day will they pay? Use YYYY-MM-DD, today, tomorrow or a weekday.' : type === 'customer' ? 'Choose the customer or confirm a new customer.' : 'amount?']);
  const before = store.pending('a', old.id);
  for (const text of ['How market today?', 'Show Mama Chidi book', 'Who dey owe me', 'stock left', 'insights']) {
    const reply = await service.handleMessage({ ...ctx, text });
    expect(reply.pending).toBeUndefined();
    expect(store.pending('a', old.id)).toEqual(before);
  }
  expect(request).not.toHaveBeenCalled();
  const next = await service.handleMessage({ ...ctx, text: english });
  expect(next.pending!.id).not.toBe(old.id);
  expect(next.pending!.flags).toEqual([]);
  expect(store.pending('a', old.id)!.entries).toEqual(before!.entries);
  expect(store.pending('a', old.id)!.status).toBe('superseded');
  expect(request).not.toHaveBeenCalled(); // complete numeric English sale is deterministic
  expect(store.events('a')).toHaveLength(0);
  await expect(service.resolveClarification({ ...ctx, pendingId: old.id, answer: '1' })).rejects.toThrow();
  await expect(service.confirm({ ...ctx, pendingId: old.id })).rejects.toThrow();
  await expect(other.confirm({ ...ctx, pendingId: next.pending!.id })).rejects.toThrow();
  await expect(service.confirm({ ...ctx, senderId: 'someone-else', pendingId: next.pending!.id })).rejects.toThrow();
  const saved = await service.confirm({ ...ctx, pendingId: next.pending!.id });
  expect((await service.confirm({ ...ctx, pendingId: next.pending!.id })).replyText).toBe(saved.replyText);
  expect(store.events('a')).toHaveLength(1);
});

it('asks next week with ID-bound choices, never invents a date, and No date needs a fresh save', async () => {
  const { store, service, other } = setup();
  await service.handleMessage({ ...ctx, text: 'Pidgin' });
  const q = await service.handleMessage({ ...ctx, text: nextWeek });
  expect(q.replyText).toBe('Which day Chinedu go pay? Choose one day, or talk No date.\n1. Tomorrow\n2. Friday\n3. No date\n\nI never save anything.');
  expect(q.interactive!.buttons!.map(b => b.title)).toEqual(['Tomorrow', 'Friday', 'No date']);
  expect(store.pending('a', q.pending!.id)!.entries[0].dueDate).toBeUndefined();
  await expect(service.confirm({ ...ctx, pendingId: q.pending!.id })).rejects.toThrow();
  const id = q.interactive!.buttons![2].id;
  expect((await other.handleInteractive({ ...ctx, id })).pending).toBeUndefined();
  const review = await service.handleInteractive({ ...ctx, id });
  expect(review.pending!.id).not.toBe(q.pending!.id);
  expect(review.pending!.flags).toEqual([]);
  expect(store.pending('a', review.pending!.id)!.entries[0].dueDate).toBeUndefined();
  expect(store.events('a')).toHaveLength(0);
  expect((await service.handleInteractive({ ...ctx, id })).pending!.id).toBe(review.pending!.id);
  await service.confirm({ ...ctx, pendingId: review.pending!.id });
  expect(store.events('a')[0]).toMatchObject({ amountKobo: 1800000, dueDate: null });
});

it('offers the mentioned weekday first without guessing what Monday next week means', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2030-01-02T10:00:00Z'));
  const { store, service } = setup();
  const old = pending(store, [{ kind: 'sale', customerId: 'm', amountKobo: 100000, needsDueDate: true, dueDateSource: 'Monday next week' }], ['Which day will they pay?']);
  const question = await service.resolveClarification({ ...ctx, pendingId: old.id, answer: 'next week' });
  expect(question.interactive!.kind).toBe('list');
  expect(question.interactive!.rows!.map(r => r.title)).toEqual(['Monday', 'Tomorrow', 'Friday', 'No date']);
  const review = await service.handleInteractive({ ...ctx, id: question.interactive!.rows![0].id });
  expect(store.pending('a', review.pending!.id)!.entries[0].dueDate).toBe('2030-01-07');
  expect(store.events('a')).toHaveLength(0);
});

it.each([null, 'tomorrow'])('recovers an explicit promise omitted from the model evidence clause (%s)', async quoted => {
  const { store } = setup();
  const text = 'Bola took eggs for 27,000 on credit, she will pay tomorrow';
  const service = new Service('a', store, { listModels: async () => [], requestToolResponse: async () => ({ status: 'completed', output: [{ type: 'function_call', status: 'completed', name: 'record_entries', arguments: JSON.stringify({ entries: [{ kind: 'sale', customer_name: 'Bola', description: null, amount_text: '27,000', evidence_text: 'Bola took eggs for 27,000 on credit', due_date_text: quoted, remaining_text: null }] }) }] }) });
  const review = await service.handleMessage({ ...ctx, text });
  // The close-name question is independent of the resolved date.
  expect(store.pending('a', review.pending!.id)!.entries[0].dueDate).toBe(resolveDueDate('tomorrow'));
  expect(store.pending('a', review.pending!.id)!.entries[0].needsDueDate).toBeUndefined();
  expect(store.events('a')).toHaveLength(0);
});

it('never accepts a shortened model date quote as a decision for next week', async () => {
  const { store } = setup();
  const text = 'Chinedu collect rice for 18 thousand, e go pay Friday next week';
  const service = new Service('a', store, { listModels: async () => [], requestToolResponse: async () => ({ status: 'completed', output: [{ type: 'function_call', status: 'completed', name: 'record_entries', arguments: JSON.stringify({ entries: [{ kind: 'sale', customer_name: 'Chinedu', description: null, amount_text: '18 thousand', evidence_text: text, due_date_text: 'Friday', remaining_text: null }] }) }] }) });
  const question = await service.handleMessage({ ...ctx, text });
  expect(question.interactive!.buttons!.map(b => b.title)).toEqual(['Friday', 'Tomorrow', 'No date']);
  expect(store.pending('a', question.pending!.id)!.entries[0].dueDate).toBeUndefined();
  expect(question.pending!.flags).toEqual(['Which day will they pay?']);
  expect(store.events('a')).toHaveLength(0);
});

it('keeps the old review actionable on an unrelated provider failure or unrecognized request', async () => {
  const { store } = setup();
  const old = pending(store, [{ kind: 'sale', customerId: 'm', amountKobo: 100000, needsDueDate: true }], ['Which day will they pay?']);
  for (const requestToolResponse of [async () => { throw new Error('synthetic'); }, async () => ({ status: 'completed', output: [] })]) {
    const service = new Service('a', store, { listModels: async () => [], requestToolResponse });
    const reply = await service.handleMessage({ ...ctx, text: 'something unrelated' });
    expect(reply.pending).toBeUndefined();
    expect(store.current('a', 'web', 's')[0].id).toBe(old.id);
  }
  expect(store.events('a')).toHaveLength(0);
});
