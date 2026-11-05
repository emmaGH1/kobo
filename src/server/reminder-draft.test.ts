import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { LedgerStore } from './ledger-store';
import { Service } from './service';
import { CUSTOMER_CONTEXT_TTL, draftTarget } from './reminder-draft';
import type { ModelProvider } from './model-provider';

let store: LedgerStore;
let service: Service;
let request: ReturnType<typeof vi.fn<ModelProvider['requestToolResponse']>>;
let tunde: string;
const ctx = { channel: 'whatsapp' as const, senderId: 'fictional-owner' };
const exact = 'help me draft a message asking Brother Tunde ... his debt is due';
const followup = 'draft message asking him to pay back';
const call = (name: string, args: object) => ({ status: 'completed', output: [{ type: 'function_call', status: 'completed', name, arguments: JSON.stringify(args) }] });
const model = (): ModelProvider => ({ listModels: async () => [], requestToolResponse: request });
const say = (text: string) => service.handleMessage({ ...ctx, text });
function addCustomer(owner: string, name: string, amount = 0) {
  const id = randomUUID();
  store.sqlite.prepare('INSERT INTO customers VALUES(?,?,?)').run(id, owner, name);
  if (amount) store.seedConfirmed(owner, Date.now() - 1000, 'Fictional test opening balance', [{ kind: 'opening_debt', customerId: id, amountKobo: amount }]);
  return id;
}
function financialState() {
  return ['customers', 'ledger_events', 'evidence', 'pending_actions', 'stock_purchases'].map(table => store.sqlite.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all());
}
beforeEach(() => {
  store = new LedgerStore(':memory:');
  store.sqlite.exec("INSERT INTO owners VALUES('a','Fictional A','disabled',0),('b','Fictional B','disabled',0)");
  tunde = addCustomer('a', 'Brother Tunde', 1250050);
  addCustomer('b', 'Brother Tunde', 9990000);
  request = vi.fn(async () => call('get_balance', { customer_name: 'Brother Tunde' }));
  service = new Service('a', store, model());
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('No network or sends allowed'); }));
});
afterEach(() => { store.close(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('drafts the exact reported example from deterministic saved debt, unsent and without a due-date claim', async () => {
  const before = financialState();
  const reply = await say(exact);
  expect(reply.replyText).toBe('Copy this and send it to Brother Tunde:\n> Hello Brother Tunde. A small reminder about your outstanding balance of ₦12,500.50. Please let me know when you can pay. Thank you.\n\nYou send it. Nothing goes out without you.');
  expect(reply.pending).toBeUndefined(); expect(reply.interactive).toBeUndefined();
  expect(reply.replyText).not.toMatch(/wa\.me|due today|overdue|sent|Nkechi/);
  expect(financialState()).toEqual(before);
  expect(request).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});
it.each([
  'Help me draft a message asking Brother Tunde to pay back, his debt is due',
  'Please write a reminder for Brother Tunde',
  'compose a message to Brother Tunde about his debt',
  'draft message asking Brother Tunde that his debt is due',
  'Abeg help me draft message give Brother Tunde make e pay im debt',
])('recognizes English/Pidgin drafting wording: %s', async text => {
  const reply = await say(text);
  expect(reply.replyText).toContain('Brother Tunde'); expect(reply.replyText).toContain('₦12,500.50');
  expect(reply.pending).toBeUndefined(); expect(request).not.toHaveBeenCalled();
});
it('uses design intro/footer and generic saved-total wording in Pidgin', async () => {
  await say('Pidgin');
  const reply = await say('Abeg draft message give Brother Tunde make e pay');
  expect(reply.replyText).toContain('Copy am send to Brother Tunde:');
  expect(reply.replyText).toContain('₦12,500.50 balance to pay');
  expect(reply.replyText).toContain('Na you go send am. Nothing go out without you.');
});
it.each(['him', 'her'])('resolves %s only after an explicit recent balance read, across service instances', async pronoun => {
  expect((await say('What is Brother Tunde balance?')).replyText).toBe('*Brother Tunde* · owes *₦12,500.50*');
  service = new Service('a', store, model());
  const reply = await say(`draft message asking ${pronoun} to pay back`);
  expect(reply.replyText).toContain('Copy this and send it to Brother Tunde:');
  expect(request).toHaveBeenCalledTimes(1);
  expect((await say(followup)).replyText).toContain('Which saved customer'); // consumed, not rolling reference
});
it('uses the latest saved balance, not the prior read or an amount claimed in the draft request', async () => {
  await say('What is Brother Tunde balance?');
  store.seedConfirmed('a', Date.now(), 'Fictional payment', [{ kind: 'payment', customerId: tunde, amountKobo: 250000 }]);
  const before = financialState();
  const reply = await say('draft message asking him to pay back 999999 naira');
  expect(reply.replyText).toContain('₦10,000.50'); expect(reply.replyText).not.toContain('999999');
  expect(financialState()).toEqual(before);
});
it.each(['Show Brother Tunde book', 'how many days Brother Tunde dey owe me'])('permits an explicit single-customer history read: %s', async text => {
  await say(text);
  expect((await say(followup)).replyText).toContain('Copy this and send it to Brother Tunde:');
  expect(request).not.toHaveBeenCalled();
});
it('permits an explicit customer selection but never a debtor list, even with one debtor', async () => {
  await service.handleInteractive({ ...ctx, id: `customer:${tunde}` });
  expect((await say(followup)).replyText).toContain('Copy this and send it to Brother Tunde:');
  expect((await say('who owes me')).replyText).toContain('Who owes you');
  expect((await say(followup)).replyText).toContain('Which saved customer');
});
it.each(['help', 'summary', 'who owes me', 'English', 'nonsense'])('invalidates context after an intervening message: %s', async text => {
  await say('Show Brother Tunde book'); await say(text);
  expect((await say(followup)).replyText).toContain('Which saved customer');
});
it('invalidates context after an unrelated interactive action', async () => {
  await say('Show Brother Tunde book');
  await service.handleInteractive({ ...ctx, id: 'query:debtors' });
  expect((await say(followup)).replyText).toContain('Which saved customer');
});
it.each([CUSTOMER_CONTEXT_TTL, CUSTOMER_CONTEXT_TTL + 1, -1])('rejects expired or future-dated context at age %i', async age => {
  const at = Date.now(); vi.spyOn(Date, 'now').mockReturnValue(at);
  await say('Show Brother Tunde book');
  vi.spyOn(Date, 'now').mockReturnValue(at + age);
  expect((await say(followup)).replyText).toContain('Which saved customer');
});
it.each(['What is the balance?', 'Brother Tunde paid 500', 'What is Brother Tunde balance and Ada balance?', 'compare Brother Tunde balance with Ada'])('does not use a model-selected reference without a complete single-customer read: %s', async text => {
  await say(text);
  expect((await say(followup)).replyText).toContain('Which saved customer');
});
it.each(['how much does Brother Tunde owe me?', 'balance for Brother Tunde', 'show me Brother Tunde balance'])('establishes context from an explicit balance grammar: %s', async text => {
  await say(text);
  expect((await say(followup)).replyText).toContain('Copy this and send it to Brother Tunde:');
});
it.each(['confirm', 'edit', 'cancel'] as const)('invalidates context even for a direct %s API action', async action => {
  await say('Show Brother Tunde book');
  await expect(service[action]({ ...ctx, pendingId: randomUUID() })).rejects.toThrow();
  expect((await say(followup)).replyText).toContain('Which saved customer');
});
it('asks for unknown/omitted targets rather than using an older context or creating a customer', async () => {
  const before = financialState();
  for (const text of ['draft message asking Unknown Example to pay back', 'draft a message', followup]) {
    await say('Show Brother Tunde book');
    // Unknown explicit target must never fall back to the recent known customer.
    if (text === followup) await say('help');
    const reply = await say(text);
    expect(reply.replyText).toContain('Which saved customer'); expect(reply.replyText).not.toContain('₦');
  }
  expect(financialState()).toEqual(before); expect(request).not.toHaveBeenCalled();
});
it('asks about ambiguous partial names and colliding exact name/alias, without selecting a balance', async () => {
  const other = addCustomer('a', 'Brother Tunde Example', 700000);
  let reply = await say('draft message asking Brother to pay back');
  expect(reply.replyText).toContain('Brother Tunde Example'); expect(reply.replyText).not.toContain('₦');
  store.sqlite.prepare('INSERT INTO customer_aliases VALUES(?,?,?)').run('a', other, 'Brother Tunde');
  reply = await say(exact);
  expect(reply.replyText).toContain('Which'); expect(reply.replyText).toContain('Brother Tunde Example');
  expect(reply.replyText).not.toContain('₦');
  // The same collision must not establish unsafe pronoun context via history.
  await say('Show Brother Tunde book');
  expect((await say(followup)).replyText).toContain('Which saved customer');
});
it('resolves a unique saved alias without inventing a customer', async () => {
  store.sqlite.prepare('INSERT INTO customer_aliases VALUES(?,?,?)').run('a', tunde, 'Tunde Example');
  expect((await say('draft message for Tunde Example')).replyText).toContain('Copy this and send it to Brother Tunde:');
});
it.each([1250050, 1250150])('does not draft for a zero or credit balance after payment %i', async amount => {
  store.seedConfirmed('a', Date.now(), 'Fictional clearing payment', [{ kind: 'payment', customerId: tunde, amountKobo: amount }]);
  const before = financialState();
  const reply = await say(exact);
  expect(reply.replyText).toContain('no outstanding debt'); expect(reply.replyText).toContain('another customer');
  expect(reply.replyText).not.toContain('Copy this'); expect(financialState()).toEqual(before);
});
it('asks for an existing customer with no events instead of assuming a debt', async () => {
  addCustomer('a', 'Zero Example');
  expect((await say('draft message for Zero Example')).replyText).toContain('no outstanding debt');
});
it('isolates named lookups and conversational reference by owner, sender and channel', async () => {
  addCustomer('b', 'Private Fictional Customer', 880000);
  await say('Show Brother Tunde book');
  const other = new Service('b', store, model());
  expect((await other.handleMessage({ ...ctx, text: followup })).replyText).toContain('Which saved customer');
  expect((await other.handleMessage({ ...ctx, text: exact })).replyText).toContain('₦99,900');
  for (const input of [{ ...ctx, senderId: 'another' }, { ...ctx, channel: 'web' as const }]) {
    expect((await service.handleMessage({ ...input, text: followup })).replyText).toContain('Which saved customer');
  }
  expect((await say('draft message for Private Fictional Customer')).replyText).toContain('Which saved customer');
  expect((await say(exact)).replyText).not.toContain('99,900');
});
it('fails closed if context storage is supplied a different owner customer', () => {
  expect(() => store.sqlite.prepare('INSERT INTO recent_customer_context VALUES(?,?,?,?,?,?)').run('a', ctx.channel, ctx.senderId, store.customers('b')[0].id, Date.now(), randomUUID())).toThrow();
});
it('does not resurrect stale context when a slow model read completes after a newer turn', async () => {
  addCustomer('a', 'Ada Example', 90000);
  let complete!: (response: unknown) => void;
  request.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  const slow = say('What is Brother Tunde balance?');
  await say('Show Ada Example book');
  complete(call('get_balance', { customer_name: 'Brother Tunde' }));
  await slow;
  expect((await say(followup)).replyText).toContain('Which saved customer');
});
it('leaves an unsaved amount question intact and does not send, confirm or change money', async () => {
  const p = store.propose({ ownerId: 'a', ...ctx, idempotencyKey: 'fictional-question', rawInput: 'Fictional missing amount', entries: [{ kind: 'payment', customerId: tunde, amountQuestion: { candidatesKobo: [], flag: 'Please clarify the stated amount.' } }] });
  const before = financialState();
  expect((await say(exact)).replyText).toContain('Copy this');
  expect(store.current('a', ctx.channel, ctx.senderId)[0].id).toBe(p.id);
  expect(financialState()).toEqual(before); expect(fetch).not.toHaveBeenCalled(); expect(request).not.toHaveBeenCalled();
});
it('does not classify ordinary balance/debtors requests as drafting', async () => {
  for (const text of ['who owes me', 'What is Brother Tunde balance?', 'Show Brother Tunde book', 'Brother Tunde pay 500']) expect(draftTarget(text)).toBeUndefined();
  expect((await say('who owes me')).replyText).toContain('₦12,500.50');
  expect((await say('What is Brother Tunde balance?')).replyText).toBe('*Brother Tunde* · owes *₦12,500.50*');
  const review = await say('Brother Tunde pay 500');
  expect(review.pending?.flags).toEqual([]); expect(store.events('a')).toHaveLength(1);
});
