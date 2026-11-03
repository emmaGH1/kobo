import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { balances, dailySummary, debtors } from './ledger';
import { LedgerStore, type EntryDraft } from '../server/ledger-store';

let store: LedgerStore;
beforeEach(() => {
  store = new LedgerStore(':memory:');
  store.sqlite.exec(`INSERT INTO owners VALUES ('o','Test owner','not-a-real-hash',0),('other','Other','not-a-real-hash',0);
    INSERT INTO customers VALUES ('c','o','Chika'),('c2','other','Someone');
    INSERT INTO customer_aliases VALUES ('o','c','Chi');`);
});
afterEach(() => store.close());
let counter = 0;
function propose(entries: EntryDraft[], key = String(++counter)) {
  return store.propose({ownerId:'o',channel:'web',senderId:'o',idempotencyKey:key,rawInput:'Fictional test input',entries});
}
function save(entries: EntryDraft[]) {
  const pending = propose(entries);
  return store.confirm('o',pending.id,'web','o');
}
const entry = (kind: EntryDraft['kind'],amountKobo: number): EntryDraft => ({kind,customerId:'c',amountKobo});

describe('event-derived ledger', () => {
  it('records a full sale paid and evidence per event', () => {
    save([entry('sale',380000),entry('payment',380000)]);
    expect(balances(store.events('o')).c).toBe(0);
    expect(dailySummary(store.events('o'),0,Date.now()+1000)).toEqual({salesKobo:380000,collectionsKobo:380000});
    expect(store.sqlite.prepare('SELECT count(*) AS n FROM evidence').get()).toEqual({n:2});
  });
  it('partial payment produces outstanding debt and a debtors list', () => {
    save([entry('sale',380000),entry('payment',190000)]);
    expect(debtors(store.events('o'),store.customers('o'))).toEqual([{id:'c',ownerId:'o',name:'Chika',balanceKobo:190000}]);
  });
  it('outstanding opening debt, later repayment', () => {
    save([entry('opening_debt',100005)]);
    expect(balances(store.events('o')).c).toBe(100005);
    save([entry('payment',100005)]);
    expect(debtors(store.events('o'),store.customers('o'))).toEqual([]);
    expect(dailySummary(store.events('o'),0,Date.now()+1000)).toEqual({salesKobo:0,collectionsKobo:100005});
  });
  it('void + re-enter preserves originals, reverses sales and collections', () => {
    const originals = save([entry('sale',10000),entry('payment',4000)]);
    save(originals.map(e => ({...entry('reversal',e.amountKobo),reversalOf:e.id})));
    save([entry('sale',12000),entry('payment',5000)]);
    expect(store.events('o')).toHaveLength(6);
    expect(balances(store.events('o')).c).toBe(7000);
    expect(dailySummary(store.events('o'),0,Date.now()+1000)).toEqual({salesKobo:12000,collectionsKobo:5000});
    expect(() => store.sqlite.prepare('DELETE FROM ledger_events').run()).toThrow('append-only');
    expect(() => store.sqlite.prepare('UPDATE ledger_events SET amount_kobo=1').run()).toThrow('append-only');
  });
  it('duplicate key and duplicate confirm consume exactly once', () => {
    const pending = propose([entry('sale',100)],'same');
    expect(propose([entry('sale',999)],'same').id).toBe(pending.id);
    const first = store.confirm('o',pending.id,'web','o');
    expect(store.confirm('o',pending.id,'web','o')).toEqual(first);
    expect(store.events('o')).toHaveLength(1);
  });
  it('unknown customer and missing amount are blocked', () => {
    for (const entries of [[{kind:'sale',customerId:'missing',amountKobo:100}], [{kind:'sale',customerId:'c'}]] as EntryDraft[][]) {
      const pending = propose(entries);
      expect(pending.flags.length).toBeGreaterThan(0);
      expect(() => store.confirm('o',pending.id,'web','o')).toThrow('flags');
    }
    expect(store.events('o')).toHaveLength(0);
  });
  it('exact integer totals; floats, zero, negative, unsafe integers rejected', () => {
    for (let i=0;i<10;i++) save([entry('sale',101)]);
    expect(balances(store.events('o')).c).toBe(1010);
    for (const amount of [1.1,0,-1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]) expect(propose([entry('sale',amount)]).flags.length).toBeGreaterThan(0);
  });
  it('overflow rolls back events, evidence and consumption atomically', () => {
    save([entry('sale',Number.MAX_SAFE_INTEGER)]);
    const pending = propose([entry('sale',1)]);
    expect(() => store.confirm('o',pending.id,'web','o')).toThrow('overflow');
    expect(store.events('o')).toHaveLength(1);
    expect(store.pending('o',pending.id)?.status).toBe('review');
    expect(store.sqlite.prepare('SELECT count(*) AS n FROM evidence').get()).toEqual({n:1});
  });
  it('cross-owner, cross-conversation and expired pending fail closed', () => {
    const pending = propose([entry('sale',100)]);
    expect(() => store.confirm('other',pending.id,'web','other')).toThrow('not found');
    expect(() => store.confirm('o',pending.id,'whatsapp','o')).toThrow('not found');
    expect(propose([{kind:'sale',customerId:'c2',amountKobo:100}]).flags).toContain('Unknown customer');
    store.sqlite.prepare('UPDATE pending_actions SET expires_at=0 WHERE id=?').run(pending.id);
    expect(() => store.confirm('o',pending.id,'web','o')).toThrow('expired');
  });
  it('edit creates a new review, invalidates old ID and requires fresh save', () => {
    const old = propose([entry('sale',100)]);
    store.setStatus('o',old.id,'web','o','editing');
    const next = store.replace('o',old.id,'web','o',{...old,idempotencyKey:'replacement',entries:[entry('sale',200)]});
    expect(store.events('o')).toHaveLength(0);
    expect(() => store.confirm('o',old.id,'web','o')).toThrow('stale');
    store.confirm('o',next.id,'web','o');
    expect(balances(store.events('o')).c).toBe(200);
  });
  it('cancel does not change history and prevents saving', () => {
    const pending = propose([entry('sale',100)]);
    store.setStatus('o',pending.id,'web','o','cancelled');
    expect(() => store.confirm('o',pending.id,'web','o')).toThrow('stale');
    expect(store.events('o')).toHaveLength(0);
  });
  it('repeated reversal rolls back its entire bundle', () => {
    const [sale] = save([entry('sale',100)]);
    const reversal = {...entry('reversal',100),reversalOf:sale.id};
    save([reversal]);
    const pending = propose([entry('sale',10),reversal]);
    expect(() => store.confirm('o',pending.id,'web','o')).toThrow();
    expect(store.events('o')).toHaveLength(2);
    expect(store.pending('o',pending.id)?.status).toBe('review');
  });
  it('resolves owner-scoped aliases; daily boundaries exclude next day', () => {
    expect(store.findCustomer('o','chi')?.id).toBe('c');
    expect(store.findCustomer('other','chi')).toBeUndefined();
    const events = save([entry('sale',123)]);
    expect(dailySummary(events,events[0].occurredAt,events[0].occurredAt+1).salesKobo).toBe(123);
    expect(dailySummary(events,0,events[0].occurredAt).salesKobo).toBe(0);
  });
});
