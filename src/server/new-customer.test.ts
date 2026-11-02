import { expect, it } from 'vitest';
import { LedgerStore } from './ledger-store';

it('creates a new customer only on atomic, idempotent confirmation', () => {
  const store = new LedgerStore(':memory:');
  try {
    store.sqlite.exec("INSERT INTO owners VALUES ('a','A','x',0)");
    const p = store.propose({ownerId:'a', channel:'web', senderId:'s', idempotencyKey:'one', rawInput:'synthetic', entries:[{kind:'sale', customerName:'Bola', amountKobo:10000}, {kind:'payment', customerName:'Bola', amountKobo:3000}]});
    expect(p.flags).toEqual([]);
    expect(store.customers('a')).toHaveLength(0);
    store.confirm('a',p.id,'web','s');
    store.confirm('a',p.id,'web','s');
    expect(store.customers('a')).toHaveLength(1);
    expect(store.events('a')).toHaveLength(2);
    expect(new Set(store.events('a').map(e => e.customerId)).size).toBe(1);
  } finally { store.close(); }
});

it('refuses a name that becomes an alias before confirmation', () => {
  const store = new LedgerStore(':memory:');
  try {
    store.sqlite.exec("INSERT INTO owners VALUES ('a','A','x',0); INSERT INTO customers VALUES ('c','a','Other')");
    const p = store.propose({ownerId:'a',channel:'web',senderId:'s',idempotencyKey:'one',rawInput:'synthetic',entries:[{kind:'sale',customerName:'Bola',amountKobo:100}]});
    store.sqlite.exec("INSERT INTO customer_aliases VALUES ('a','c','Bola')");
    expect(() => store.confirm('a',p.id,'web','s')).toThrow();
    expect(store.events('a')).toHaveLength(0);
    expect(store.customers('a')).toHaveLength(1);
  } finally { store.close(); }
});
