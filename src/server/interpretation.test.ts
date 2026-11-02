import { expect, it, vi } from 'vitest';
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
    expect(r.replyText).toContain('*Bola* (new customer)');
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
it('resolves tomorrow against the Lagos calendar date', async () => {
  const clock=vi.spyOn(Date,'now').mockReturnValue(Date.parse('2030-01-01T23:30:00Z'));
  const text='Bola bought on credit for 12k due tomorrow';
  const {store,service}=setup([entry({evidence_text:text,due_date_text:'tomorrow'})]);
  try { const r=await service.handleMessage({...ctx,text}); expect(r.pending?.flags).toEqual([]); await service.confirm({...ctx,pendingId:r.pending!.id}); expect(store.events('a')[0].dueDate).toBe('2030-01-03'); } finally {store.close();clock.mockRestore();}
});
it('resolves an amount choice into a fresh review, never a save', async () => {
  const text='Bola bought on credit for three eight';
  const {store,service}=setup([entry({amount_text:'three eight',evidence_text:text})]);
  try {
    const first=await service.handleMessage({...ctx,text});
    expect(first.pending?.clarifications?.[0].options?.map(o => o.label)).toEqual(['₦3,800','₦38,000','Another amount']);
    const second=await service.handleMessage({...ctx,text:'1'});
    expect(second.pending?.id).not.toBe(first.pending?.id);
    expect(second.pending?.flags).toEqual([]);
    expect(store.events('a')).toHaveLength(0);
    await expect(service.confirm({...ctx,pendingId:first.pending!.id})).rejects.toThrow();
    await service.confirm({...ctx,pendingId:second.pending!.id});
    expect(store.events('a')).toHaveLength(1);
  } finally {store.close();}
});
it('resolves the same named weekday to the following week in Lagos', async () => {
  const clock=vi.spyOn(Date,'now').mockReturnValue(Date.parse('2030-01-01T23:30:00Z'));
  const text='Bola bought on credit for 12k due Wednesday';
  const {store,service}=setup([entry({evidence_text:text,due_date_text:'Wednesday'})]);
  try { const r=await service.handleMessage({...ctx,text}); await service.confirm({...ctx,pendingId:r.pending!.id}); expect(store.events('a')[0].dueDate).toBe('2030-01-09'); } finally {store.close();clock.mockRestore();}
});
it('records separately quoted sale and payment together', async () => {
  const {store,service}=setup([entry(),entry({kind:'payment',amount_text:'2k',evidence_text:'Bola paid 2k'})]);
  try {const r=await service.handleMessage({...ctx,text:'Bola bought on credit for 12k. Bola paid 2k'}); expect(r.pending?.flags).toEqual([]); await service.confirm({...ctx,pendingId:r.pending!.id}); expect(store.events('a').map(e=>e.amountKobo)).toEqual([1200000,200000]);} finally {store.close();}
});

it('answers missing amounts one at a time without saving or accepting stale reviews', async () => {
  const text='Bola bought on credit. Bola paid';
  const {store,service}=setup([entry({amount_text:null,evidence_text:'Bola bought on credit'}),entry({kind:'payment',amount_text:null,evidence_text:'Bola paid'})]);
  try {
    const first=await service.handleMessage({...ctx,text});
    const second=await service.handleMessage({...ctx,text:'12000'});
    expect(second.pending?.id).not.toBe(first.pending?.id);
    expect(second.pending?.flags.length).toBeGreaterThan(0);
    await expect(service.confirm({...ctx,pendingId:first.pending!.id})).rejects.toThrow();
    await expect(service.confirm({...ctx,pendingId:second.pending!.id})).rejects.toThrow();
    const third=await service.handleMessage({...ctx,text:'2000'});
    expect(third.pending?.flags).toEqual([]);
    expect(store.events('a')).toHaveLength(0);
    await service.confirm({...ctx,pendingId:third.pending!.id});
    expect(store.events('a').map(e=>e.amountKobo)).toEqual([1200000,200000]);
  } finally {store.close();}
});

it('keeps two ambiguous amounts independent and rejects stale or cross-owner confirmations', async () => {
  const text='Bola bought on credit for three eight. Bola paid three eight';
  const {store,service}=setup([entry({amount_text:'three eight',evidence_text:'Bola bought on credit for three eight'}),entry({kind:'payment',amount_text:'three eight',evidence_text:'Bola paid three eight'})]);
  store.sqlite.exec("INSERT INTO owners VALUES ('b','B','x',0)");
  try {
    const first=await service.handleMessage({...ctx,text});
    const second=await service.resolveClarification({...ctx,pendingId:first.pending!.id,answer:'1'});
    expect(second.pending!.id).not.toBe(first.pending!.id);
    await expect(service.resolveClarification({...ctx,pendingId:first.pending!.id,answer:'2'})).rejects.toThrow();
    await expect(new Service('b',store,{} as ModelProvider).resolveClarification({...ctx,pendingId:second.pending!.id,answer:'2'})).rejects.toThrow();
    expect(second.pending!.flags.length).toBeGreaterThan(0);
    await expect(new Service('b',store,{} as ModelProvider).confirm({...ctx,pendingId:second.pending!.id})).rejects.toThrow();
    await expect(service.confirm({...ctx,pendingId:first.pending!.id})).rejects.toThrow();
    const third=await service.handleMessage({...ctx,text:'2'});
    expect(third.pending!.flags).toEqual([]);
    expect(store.events('a')).toHaveLength(0);
    const amounts=store.pending('a',third.pending!.id)!.entries.map(e=>e.amountKobo);
    expect(amounts[0]).not.toBe(amounts[1]);
    await service.confirm({...ctx,pendingId:third.pending!.id});
    expect(store.events('a').map(e=>e.amountKobo)).toEqual(amounts);
  } finally {store.close();}
});

it('clarifies an uncertain date in Lagos without saving and rejects invalid dates', async () => {
  const clock=vi.spyOn(Date,'now').mockReturnValue(Date.parse('2030-01-01T23:30:00Z'));
  const text='Bola bought on credit for 12k due next week';
  const {store,service}=setup([entry({evidence_text:text,due_date_text:'next week'})]);
  try {
    const first=await service.handleMessage({...ctx,text});
    const invalid=await service.handleMessage({...ctx,text:'2030-02-30'});
    expect(invalid.pending?.id).toBe(first.pending?.id);
    const second=await service.handleMessage({...ctx,text:'tomorrow'});
    expect(second.pending?.flags).toEqual([]);
    expect(store.events('a')).toHaveLength(0);
    await expect(service.confirm({...ctx,pendingId:first.pending!.id})).rejects.toThrow();
    await service.confirm({...ctx,pendingId:second.pending!.id});
    expect(store.events('a')[0].dueDate).toBe('2030-01-03');
  } finally {store.close();clock.mockRestore();}
});

it('selects a close customer explicitly into a new review', async () => {
  const text='Bola bought on credit for 12k';
  const {store,service}=setup([entry()]);
  store.sqlite.exec("INSERT INTO customers(id,owner_id,name) VALUES ('c','a','Bolo')");
  try {
    const first=await service.handleMessage({...ctx,text});
    expect(first.pending?.clarifications?.some(c => c.options?.some(o => o.label === 'Bolo'))).toBe(true);
    await expect(service.confirm({...ctx,pendingId:first.pending!.id})).rejects.toThrow();
    const second=await service.handleMessage({...ctx,text:'1'});
    expect(second.pending?.flags).toEqual([]);
    expect(store.events('a')).toHaveLength(0);
    await expect(service.confirm({...ctx,pendingId:first.pending!.id})).rejects.toThrow();
    await service.confirm({...ctx,pendingId:second.pending!.id});
    expect(store.events('a')[0].customerId).toBe('c');
  } finally {store.close();}
});
