import { afterEach, expect, it, vi } from 'vitest';
import { LedgerStore } from './ledger-store';
import { Service } from './service';
import { history, owingSince, lastPaidAt } from '../core/ledger';
import { historyText, summaryText, summaryTemplateBody, lagosDayWithWeekday } from './copy';
import type { ModelProvider } from './model-provider';

const ctx = { channel: 'web' as const, senderId: 's' };
const noModel: ModelProvider = { listModels: async () => [], requestToolResponse: vi.fn(async () => { throw new Error('model must not be called'); }) };
const lagos = (y: number, m: number, d: number, h = 12) => Date.UTC(y, m - 1, d, h) - 3600000;
afterEach(() => vi.useRealTimers());

function book() {
  const store = new LedgerStore(':memory:');
  store.sqlite.exec("INSERT INTO owners VALUES ('a','A','x',0),('b','B','x',0)");
  const c = (name: string, owner = 'a') => { const id = crypto.randomUUID(); store.sqlite.prepare('INSERT INTO customers VALUES(?,?,?)').run(id, owner, name); return id; };
  const chidi = c('Mama Chidi'), other = c('Chidi Okoro'), bayo = c('Bayo');
  store.seedConfirmed('a', lagos(2026, 10, 20), 'seed', [{ customerId: chidi, kind: 'sale', amountKobo: 1350000 }]);
  store.seedConfirmed('a', lagos(2026, 10, 24), 'seed', [{ customerId: chidi, kind: 'payment', amountKobo: 500000 }]);
  store.seedConfirmed('a', lagos(2026, 11, 1), 'seed', [{ customerId: chidi, kind: 'sale', amountKobo: 4500000 }, { customerId: chidi, kind: 'payment', amountKobo: 2000000 }]);
  store.seedConfirmed('a', lagos(2026, 11, 2, 9), 'seed', [{ customerId: bayo, kind: 'sale', amountKobo: 2800000 }]);
  return { store, service: new Service('a', store, noModel), chidi, other, bayo };
}

it('computes running balances, owing-since and last payment in code', () => {
  const { store, chidi, bayo } = book();
  const events = store.events('a');
  expect(history(events, chidi).map(r => r.balanceKobo)).toEqual([1350000, 850000, 5350000, 3350000]);
  expect(owingSince(events, chidi)).toBe(lagos(2026, 10, 20));
  expect(lastPaidAt(events, chidi)).toBe(lagos(2026, 11, 1));
  expect(owingSince(events, bayo)).toBe(lagos(2026, 11, 2, 9));
});

it('renders design 4.5 history for a unique match, newest first, in a narrow monospace block, without calling the model', async () => {
  const { service } = book();
  const reply = await service.handleMessage({ ...ctx, text: 'show me Mama Chidi full history' });
  expect(reply.replyText).toBe([
    '*Mama Chidi* · owes *₦33,500*', '', '```', '               AMOUNT    OWES',
    '1 Nov  paid    20,000  33,500', '1 Nov  credit  45,000  53,500', '24 Oct paid     5,000   8,500', '20 Oct credit  13,500  13,500', '```', '_Last 4 entries._',
  ].join('\n'));
  for (const line of reply.replyText.split('\n').filter(l => /^\d/.test(l))) expect(line.length).toBeLessThanOrEqual(30);
  expect(reply.interactive?.buttons?.[0]).toEqual({ id: 'query:debtors', title: 'Who owes me' });
  expect(noModel.requestToolResponse).not.toHaveBeenCalled();
});

it('accepts "history X" and "X book", shows only the last 8 entries and Pidgin wording', () => {
  const lines = Array.from({ length: 10 }, (_, i) => ({ at: lagos(2026, 10, 1 + i), kind: 'sale' as const, amount: 100000, balance: 100000 * (i + 1) }));
  const text = historyText('pg', 'Ada', 1000000, lines);
  expect(text.startsWith('*Ada* · owe *₦10,000*')).toBe(true);
  expect(text.split('\n').filter(l => /^\d+ Oct/.test(l))).toHaveLength(8);
  expect(text).toContain('_Last 8 entries._');
  expect(historyText('en', 'Ada', 0, [])).toContain('_No entries yet._');
});

it('asks which customer when a typed name matches several, with owner-checked list rows that open history', async () => {
  const { service, other, store } = book();
  const reply = await service.handleMessage({ ...ctx, text: 'history Chidi' });
  expect(reply.interactive?.kind).toBe('list');
  expect(reply.interactive?.body).toBe('Which Chidi do you mean?');
  expect(reply.interactive?.rows?.map(r => r.title)).toEqual(['Chidi Okoro', 'Mama Chidi']);
  expect(reply.interactive?.rows?.[0].id).toBe(`customer:${other}`);
  const opened = await service.handleInteractive({ ...ctx, id: `customer:${other}` });
  expect(opened.replyText).toContain('*Chidi Okoro* · owes nothing');
  // Another owner cannot open it by id.
  const foreign = await new Service('b', store, noModel).handleInteractive({ ...ctx, id: `customer:${other}` });
  expect(foreign.replyText).toBe('Customer not found.');
  expect((await service.handleMessage({ ...ctx, text: 'history Nobody' })).replyText).toBe('Customer not found.');
});

it('shows reversals as fix rows with the reference of the entry they undo', async () => {
  const { store, service, bayo } = book();
  const sale = store.events('a').find(e => e.customerId === bayo)!;
  store.sqlite.prepare("INSERT INTO pending_actions(id,owner_id,channel,sender_id,idempotency_key,raw_input,proposal_json,flags_json,status,created_at,expires_at) VALUES('rev','a','seed','seed','k','x','[]','[]','confirmed',1,1)").run();
  store.sqlite.prepare("INSERT INTO ledger_events(id,owner_id,customer_id,kind,amount_kobo,reversal_of,pending_id,sequence,occurred_at) VALUES('r1','a',?,'reversal',?,?,'rev',0,?)").run(bayo, sale.amountKobo, sale.id, lagos(2026, 11, 2, 10));
  const text = (await service.handleMessage({ ...ctx, text: 'Bayo book' })).replyText;
  expect(text).toContain('2 Nov  fix     28,000       0');
  expect(text).toContain('_fix = undo of K-0004_');
  expect(text).toContain('owes nothing');
});

it('renders the design 4.12 day summary from the ledger in Lagos time, with stock and biggest debtor', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(lagos(2026, 11, 2, 20));
  const { store, service } = book();
  store.sqlite.exec("INSERT INTO pending_actions(id,owner_id,channel,sender_id,idempotency_key,raw_input,proposal_json,flags_json,status,created_at,expires_at) VALUES('p1','a','seed','seed','k1','x','[]','[]','confirmed',1,1)");
  store.sqlite.prepare("INSERT INTO stock_purchases VALUES('s1','a','5 bag rice',?, 'p1', ?)").run(29000000, lagos(2026, 11, 2, 8));
  const reply = await service.handleMessage({ ...ctx, text: 'How market today?' });
  expect(reply.replyText).toBe([
    '*Your book today* · Mon 2 Nov', '- Credit sales: *₦28,000*', '- Money you collected: *₦0*', '- Stock you bought: *₦290,000*',
    'People owe you *₦61,500*', 'Biggest: Mama Chidi · *₦33,500*', '', '_From the 2 entries you confirmed today._',
  ].join('\n'));
  expect(reply.interactive?.buttons?.[0].title).toBe('Who owes me');
  const pg = await service.handleMessage({ ...ctx, text: 'daily summary' });
  expect(pg.replyText).toContain('Your book today');
  expect(noModel.requestToolResponse).not.toHaveBeenCalled();
});

it('renders both languages of the 4.6 template body', () => {
  const s = { at: lagos(2026, 11, 2), entries: 4, creditKobo: 4500000, collectedKobo: 2380000, stockKobo: 0, owedKobo: 12280000 };
  expect(lagosDayWithWeekday(s.at)).toBe('Mon 2 Nov');
  expect(summaryTemplateBody('en', s)).toBe('Your book for Mon 2 Nov: 4 entries. Credit given ₦45,000, collected ₦23,800. People owe you ₦122,800 in total.');
  expect(summaryTemplateBody('pg', s)).toBe('Your book for today, Mon 2 Nov: 4 entries. You give credit ₦45,000, you collect ₦23,800. People still owe you ₦122,800.');
  expect(summaryText('pg', { ...s, entries: 1 })).toContain('_Na from the 1 entry wey you confirm today._');
});
