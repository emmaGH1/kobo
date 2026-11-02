import { expect, it } from 'vitest';
import { LedgerStore } from './ledger-store';
import { Service } from './service';
import type { ModelProvider } from './model-provider';
const ctx = {channel:'web' as const,senderId:'s'};
const entry = (overrides: object = {}) => ({kind:'sale',customer_name:'Bola',description:null,amount_text:'12k',evidence_text:'Bola bought on credit for 12k',due_date_text:null,...overrides});
function setup(entries: object[]) {
  const store = new LedgerStore(':memory:');
  store.sqlite.exec("INSERT INTO owners VALUES ('a','A','x',0)");
  const model: ModelProvider = {listModels:async()=>[],requestToolResponse:async()=>({status:'completed',output:[{type:'function_call',status:'completed',name:'record_entries',arguments:JSON.stringify({entries})}]})};
  return {store, service:new Service('a',store,model)};
}
it('connects quoted shorthand to an atomic new-customer review', async () => {
  const {store,service}=setup([entry()]);
  try {
    const r=await service.handleMessage({...ctx,text:'Bola bought on credit for 12k'});
    expect(r.pending?.flags).toEqual([]);
    expect(r.replyText).toContain('Bola (new customer)');
    expect(store.customers('a')).toHaveLength(0);
    await service.confirm({...ctx,pendingId:r.pending!.id});
    expect(store.events('a')[0].amountKobo).toBe(1200000);
  } finally {store.close();}
});
it('blocks fabricated quotations and ambiguous amounts', async () => {
  for (const [e,text] of [[entry(), 'Bola bought on credit for 15k'],[entry({amount_text:'three eight',evidence_text:'Bola bought on credit for three eight'}),'Bola bought on credit for three eight']] as const) {
    const {store,service}=setup([e]);
    try {const r=await service.handleMessage({...ctx,text}); expect(r.pending!.flags.length).toBeGreaterThan(0); expect(r.pending!.clarifications?.[0].question).toBe(r.pending!.flags[0]); await expect(service.confirm({...ctx,pendingId:r.pending!.id})).rejects.toThrow(); expect(store.events('a')).toHaveLength(0);} finally {store.close();}
  }
});
it('records separately quoted sale and payment together', async () => {
  const {store,service}=setup([entry(),entry({kind:'payment',amount_text:'2k',evidence_text:'Bola paid 2k'})]);
  try {const r=await service.handleMessage({...ctx,text:'Bola bought on credit for 12k. Bola paid 2k'}); expect(r.pending?.flags).toEqual([]); await service.confirm({...ctx,pendingId:r.pending!.id}); expect(store.events('a').map(e=>e.amountKobo)).toEqual([1200000,200000]);} finally {store.close();}
});
