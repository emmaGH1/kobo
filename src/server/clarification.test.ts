import { expect, it, vi } from 'vitest';
import { LedgerStore } from './ledger-store';
import { Service } from './service';
import { formatNaira } from './copy';
import type { ModelProvider } from './model-provider';

const ctx = { channel: 'web' as const, senderId: 's' };
type Entry = Record<string, unknown>;
const entry = (o: Entry = {}) => ({ kind: 'sale', customer_name: 'Bola', description: null, amount_text: '12k', evidence_text: 'Bola bought on credit for 12k', due_date_text: null, ...o });
function setup(entries: Entry[] | (() => unknown)) {
  const store = new LedgerStore(':memory:');
  store.sqlite.exec("INSERT INTO owners VALUES ('a','A','x',0),('b','B','x',0)");
  const model: ModelProvider = { listModels: async () => [], requestToolResponse: async () => typeof entries === 'function' ? entries() : { status: 'completed', output: [{ type: 'function_call', status: 'completed', name: 'record_entries', arguments: JSON.stringify({ entries }) }] } };
  return { store, service: new Service('a', store, model), other: new Service('b', store, model) };
}
const buttons = (r: { interactive?: { buttons?: { id: string; title: string }[]; rows?: { id: string; title: string }[] } }) => r.interactive?.buttons ?? r.interactive?.rows ?? [];

it('formats naira per design section 3', () => {
  expect(formatNaira(380000)).toBe('₦3,800');
  expect(formatNaira(380050)).toBe('₦3,800.50');
  expect(formatNaira(100)).toBe('₦1');
  expect(formatNaira(4500000)).toBe('₦45,000');
  expect(formatNaira(1)).toBe('₦0.01');
  expect(formatNaira(-10000)).toBe('-₦100');
  expect(() => formatNaira(1.5)).toThrow();
});

it('drives two independent ambiguous amounts through interactive ids, one question at a time', async () => {
  const text = 'Bola bought on credit for three eight. Bola bought again for three eight';
  const { store, service, other } = setup([entry({ amount_text: 'three eight', evidence_text: 'Bola bought on credit for three eight' }), entry({ amount_text: 'three eight', evidence_text: 'Bola bought again for three eight' })]);
  try {
    const first = await service.handleMessage({ ...ctx, text });
    expect(first.replyText).toBe('I heard *"three eight"* for Bola\'s sale.\nWhich amount is it?\n1. ₦3,800\n2. ₦38,000\n3. Another amount\n_1 more question after this._\n\nNothing is saved yet.');
    expect(buttons(first).map(b => b.title)).toEqual(['₦3,800', '₦38,000', 'Another amount']);
    expect(first.interactive?.footer).toBe('Nothing is saved yet.');
    const ids = buttons(first).map(b => b.id);
    expect(ids[0]).toBe(`answer:${first.pending!.id}:1`);

    // Another owner (same sender id) cannot answer or learn anything about this review.
    const foreign = await other.handleInteractive({ ...ctx, id: ids[0] });
    expect(foreign.replyText).toContain("nothing waiting to save");
    expect(store.pending('a', first.pending!.id)!.status).toBe('review');

    const second = await service.handleInteractive({ ...ctx, id: ids[0] });
    expect(second.pending!.id).not.toBe(first.pending!.id);
    expect(second.replyText).toContain('for Bola\'s sale');
    expect(second.replyText).not.toContain('more question');
    expect(store.events('a')).toHaveLength(0);
    expect(store.pending('a', first.pending!.id)!.status).toBe('superseded');

    // A stale button from the first question must not answer the second question.
    const stale = await service.handleInteractive({ ...ctx, id: ids[1] });
    expect(stale.replyText.startsWith("That draft was replaced. Here's the latest one:")).toBe(true);
    expect(stale.pending!.id).toBe(second.pending!.id);
    expect(store.pending('a', second.pending!.id)!.status).toBe('review');

    // Save is not offered and is refused while a question is open.
    const refused = await service.handleInteractive({ ...ctx, id: `save:${second.pending!.id}` });
    expect(refused.pending!.id).toBe(second.pending!.id);
    expect(store.events('a')).toHaveLength(0);

    const third = await service.handleInteractive({ ...ctx, id: buttons(second)[1].id });
    expect(third.pending!.flags).toEqual([]);
    expect(third.replyText.startsWith('Shall I write it like this?')).toBe(true);
    expect(buttons(third).map(b => b.title)).toEqual(['1 Save', '2 Edit', '3 Cancel']);
    expect(third.interactive?.footer).toBe('1 save / 2 edit / 3 cancel');
    expect(store.pending('a', third.pending!.id)!.entries.map(e => e.amountKobo)).toEqual([380000, 3800000]);
    expect(third.replyText).toContain('- Credit sale: *₦3,800*\n- Credit sale: *₦38,000*');

    // Answer payloads can never save, cancel or edit, and out-of-range options are refused.
    await expect(service.resolveClarification({ ...ctx, pendingId: third.pending!.id, answer: '1' })).rejects.toThrow();
    const saved = await service.handleInteractive({ ...ctx, id: `save:${third.pending!.id}` });
    expect(saved.replyText).toMatch(/^\*Saved to your book\.\*\nBola now owes you \*₦41,800\*\.\n\n_Ref K-0001 · /);
    expect(store.events('a')).toHaveLength(2);
    // A replayed button is idempotent: same reference, no second write.
    expect((await service.handleInteractive({ ...ctx, id: `save:${third.pending!.id}` })).replyText).toBe(saved.replyText);
    expect(store.events('a')).toHaveLength(2);
  } finally { store.close(); }
});

it('rejects interactive command words and out-of-range options as clarification answers', async () => {
  const text = 'Bola bought on credit for three eight';
  const { store, service } = setup([entry({ amount_text: 'three eight', evidence_text: text })]);
  try {
    const first = await service.handleMessage({ ...ctx, text });
    for (const answer of ['1 save', '2 edit', '3 cancel', '4', '9']) await expect(service.resolveClarification({ ...ctx, pendingId: first.pending!.id, answer })).rejects.toThrow();
    await expect(service.handleInteractive({ ...ctx, id: 'answer:not-a-uuid:1' })).rejects.toThrow();
    expect(store.pending('a', first.pending!.id)!.status).toBe('review');
    // "Another amount" asks for typed digits without changing or superseding the review.
    const prompt = await service.resolveClarification({ ...ctx, pendingId: first.pending!.id, answer: '3' });
    expect(prompt.replyText).toBe('Type the amount in numbers, e.g. 3800.\n\nNothing is saved yet.');
    expect(store.pending('a', first.pending!.id)!.status).toBe('review');
    // Typed amounts are accepted while the question is open (design 4.2).
    const typed = await service.handleMessage({ ...ctx, text: '3,800' });
    expect(store.pending('a', typed.pending!.id)!.entries[0].amountKobo).toBe(380000);
  } finally { store.close(); }
});

it('shows the exact section 4.1 review in English and Pidgin with code-calculated balances', async () => {
  const seed = (store: LedgerStore) => {
    store.sqlite.exec("INSERT INTO customers VALUES ('c','a','Mama Chidi')");
    const p = store.propose({ ownerId: 'a', channel: 'web', senderId: 'seed', idempotencyKey: 'seed', rawInput: 'seed', entries: [{ kind: 'opening_debt', customerId: 'c', amountKobo: 850000 }] });
    store.confirm('a', p.id, 'web', 'seed');
  };
  const mk = (a: string, b: string) => [entry({ customer_name: 'Mama Chidi', amount_text: '45000', evidence_text: a }), entry({ kind: 'payment', customer_name: 'Mama Chidi', amount_text: '20000', evidence_text: b })];
  const english = setup(mk('Mama Chidi took rice, 45000', 'Mama Chidi paid 20000 now')); seed(english.store);
  const pidgin = setup(mk('Mama Chidi carry rice, 45000', 'Mama Chidi pay 20000 now')); seed(pidgin.store);
  try {
    const en = await english.service.handleMessage({ ...ctx, text: 'Mama Chidi took rice, 45000. Mama Chidi paid 20000 now.' });
    expect(en.replyText).toBe('Shall I write it like this?\n\n*Mama Chidi*\n- Credit sale: *₦45,000*\n- Paid now: *₦20,000*\n\nThey owed ₦8,500 before. After this they will owe *₦33,500*.\n\n1 save / 2 edit / 3 cancel');
    const pg = await pidgin.service.handleMessage({ ...ctx, text: 'Mama Chidi carry rice, 45000. Mama Chidi pay 20000 now, abeg' });
    expect(pg.replyText).toBe('Make I write am like this?\n\n*Mama Chidi*\n- Credit sale: *₦45,000*\n- Pay now: *₦20,000*\n\nBefore, im owe ₦8,500. After this, im go owe *₦33,500*.\n\n1 save / 2 edit / 3 cancel');
    expect(pg.pending!.flags).toEqual([]);
    expect(pidgin.store.events('a')).toHaveLength(1); // only the seed; the review saved nothing
    const saved = await pidgin.service.confirm({ ...ctx, pendingId: pg.pending!.id });
    expect(saved.replyText).toMatch(/^\*E don enter book\.\*\nMama Chidi now owe you \*₦33,500\*\.\n\n_Ref K-0002 · \d{1,2} [A-Z][a-z]{2}, \d{1,2}:\d{2}[ap]m_$/);
    expect(saved.interactive?.buttons?.map(b => b.title)).toEqual(['Who dey owe me']);
    // Retrying the same confirmation shows the same reference and appends nothing.
    const retry = await pidgin.service.confirm({ ...ctx, pendingId: pg.pending!.id });
    expect(retry.replyText).toBe(saved.replyText);
    expect(pidgin.store.events('a')).toHaveLength(3);
  } finally { english.store.close(); pidgin.store.close(); }
});

it('keeps Pidgin through a numeric answer, and an explicit language choice wins until changed', async () => {
  const text = 'Abeg Bola buy for credit, three eight dey';
  const { store, service } = setup([entry({ amount_text: 'three eight', evidence_text: 'Bola buy for credit, three eight' })]);
  try {
    const q = await service.handleMessage({ ...ctx, text });
    expect(q.replyText).toBe('I hear *"three eight"* for Bola sale.\nWhich one be am?\n1. ₦3,800\n2. ₦38,000\n3. Another amount\n\nI never save anything.');
    const review = await service.handleMessage({ ...ctx, text: '1' }); // unsure message: thread stays Pidgin
    expect(review.replyText.startsWith('Make I write am like this?')).toBe(true);
    expect((await service.handleMessage({ ...ctx, text: 'English' })).replyText).toBe('Okay. I will reply in English.');
    expect(store.language('a', 'web', 's')).toEqual({ language: 'en', explicit: true });
    // Even a clearly Pidgin message does not override an explicit choice.
    const again = await service.handleMessage({ ...ctx, text: 'Abeg wetin I write?' });
    expect(again.replyText.startsWith('Shall I write it like this?')).toBe(true);
    expect((await service.handleMessage({ ...ctx, text: 'pidgin' })).replyText).toBe('Okay. I go reply you for Pidgin.');
    expect((await service.handleMessage({ ...ctx, text: '3' })).replyText).toBe('I no save am. Nothing change for your book.');
    // Language is stored per owner and sender, not shared.
    expect(store.language('a', 'web', 'someone-else')).toBeUndefined();
    expect((await service.handleMessage({ ...ctx, senderId: 'someone-else', text: '1' })).replyText).toContain('nothing waiting to save');
  } finally { store.close(); }
});

it('asks a missing amount with the design wording and never invents one', async () => {
  const { store, service } = setup([entry({ kind: 'payment', customer_name: 'Bayo', amount_text: null, evidence_text: 'Bayo go pay me' })]);
  try {
    const r = await service.handleMessage({ ...ctx, text: 'Bayo go pay me' });
    expect(r.replyText).toBe('How much did Bayo pay? Type or say the amount.\n\nNothing is saved yet.');
    expect(r.interactive).toBeUndefined();
    await expect(service.confirm({ ...ctx, pendingId: r.pending!.id })).rejects.toThrow();
    const pidgin = await service.handleMessage({ ...ctx, text: 'wetin Bayo go pay' });
    expect(pidgin.replyText).toBe('How much Bayo pay? Type am or talk am.\n\nI never save anything.');
  } finally { store.close(); }
});

it('answers one customer choice for a sale and its calculated payment, as a list with a new-customer row', async () => {
  const text = 'Bola bought rice on credit for 12k, unpaid 10k';
  const { store, service } = setup([entry({ amount_text: '12k', remaining_text: '10k', evidence_text: text })]);
  store.sqlite.exec("INSERT INTO customers VALUES ('c','a','Bolo')");
  try {
    const q = await service.handleMessage({ ...ctx, text });
    expect(q.replyText).toBe('Which Bola do you mean?\n1. Bolo\n2. New customer\n\nNothing is saved yet.');
    expect(q.interactive?.kind).toBe('list');
    expect(q.interactive?.rows?.map(r => r.title)).toEqual(['Bolo', 'New customer']);
    expect(q.interactive?.rows?.[0].description).toBe('Owes nothing');
    const done = await service.handleInteractive({ ...ctx, id: q.interactive!.rows![0].id });
    expect(done.pending!.flags).toEqual([]);
    expect(done.replyText).toContain('*Bolo*');
    await service.confirm({ ...ctx, pendingId: done.pending!.id });
    expect(store.events('a').map(e => [e.customerId, e.kind, e.amountKobo])).toEqual([['c', 'sale', 1200000], ['c', 'payment', 200000]]);
  } finally { store.close(); }
});

it('uses design section 4.7 copy for edge states without writing anything', async () => {
  const clock = vi.spyOn(Date, 'now');
  const { store, service } = setup(() => ({ status: 'completed', output: [{ type: 'message' }] }));
  try {
    expect((await service.handleMessage({ ...ctx, text: '1' })).replyText).toBe(`There's nothing waiting to save. Tell me what happened, e.g. "Bayo paid 5,000".`);
    expect((await service.handleMessage({ ...ctx, text: 'tell me a joke' })).replyText).toBe('I keep your book. Tell me who bought, who paid, or ask "who owes me".');
    expect((await service.handleMessage({ ...ctx, text: 'help' })).replyText).toContain('Type Pidgin to switch language.');
    expect((await service.handleMessage({ ...ctx, text: 'who owes me' })).replyText).toBe('Nobody owes you right now.');
    const failing = new Service('a', store, { listModels: async () => [], requestToolResponse: async () => { throw new Error('boom'); } });
    expect((await failing.handleMessage({ ...ctx, text: 'Bola paid 5000' })).replyText).toBe('Something went wrong on my side. *Nothing was saved.* Please try again shortly.');
    const ok = new Service('a', store, { listModels: async () => [], requestToolResponse: async () => ({ status: 'completed', output: [{ type: 'function_call', status: 'completed', name: 'record_entries', arguments: JSON.stringify({ entries: [entry()] }) }] }) });
    const r = await ok.handleMessage({ ...ctx, text: 'Bola bought on credit for 12k' });
    clock.mockReturnValue(Date.now() + 31 * 60 * 1000);
    expect((await ok.handleInteractive({ ...ctx, id: `save:${r.pending!.id}` })).replyText).toBe("That draft expired, so it wasn't saved. Please send it again.");
    expect(store.events('a')).toHaveLength(0);
  } finally { clock.mockRestore(); store.close(); }
});

it('renders debtors as design section 4.4, largest first, in both languages', async () => {
  const { store, service } = setup(() => ({ status: 'completed', output: [] }));
  store.sqlite.exec("INSERT INTO customers VALUES ('c1','a','Mama Chidi'),('c2','a','Bayo')");
  try {
    const p = store.propose({ ownerId: 'a', channel: 'web', senderId: 'seed', idempotencyKey: 'k', rawInput: 'seed', entries: [{ kind: 'opening_debt', customerId: 'c2', amountKobo: 2800000 }, { kind: 'opening_debt', customerId: 'c1', amountKobo: 3350000 }] });
    store.confirm('a', p.id, 'web', 'seed');
    expect((await service.handleMessage({ ...ctx, text: 'who owes me' })).replyText).toBe('*Who owes you* · 2 people\nTotal: *₦61,500*\n\n1. Mama Chidi · *₦33,500*\n2. Bayo · *₦28,000*\n\n_Largest first. Totals come from your saved entries._');
    expect((await service.handleMessage({ ...ctx, text: 'who dey owe me' })).replyText).toBe('*Who dey owe you* · 2 people\nTotal: *₦61,500*\n\n1. Mama Chidi · *₦33,500*\n2. Bayo · *₦28,000*\n\n_Biggest first. Total na from your saved entries._');
  } finally { store.close(); }
});

it('migrates a database created before reference numbers and language preferences existed', async () => {
  const { mkdtempSync, readFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const Database = (await import('better-sqlite3')).default;
  const dir = mkdtempSync(join(tmpdir(), 'kobo-migrate-'));
  try {
    const path = join(dir, 'old.sqlite');
    const old = new Database(path);
    old.exec(readFileSync(join(__dirname, 'fixtures-old-schema.sql'), 'utf8'));
    old.close();
    const store = new LedgerStore(path);
    try {
      const columns = (store.sqlite.pragma('table_info(pending_actions)') as { name: string }[]).map(c => c.name);
      expect(columns).toEqual(expect.arrayContaining(['confirm_ref', 'confirmed_at']));
      store.sqlite.exec("INSERT INTO owners VALUES ('a','A','x',0)");
      store.setLanguage('a', 'web', 's', 'pg', true);
      expect(store.language('a', 'web', 's')).toEqual({ language: 'pg', explicit: true });
    } finally { store.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
