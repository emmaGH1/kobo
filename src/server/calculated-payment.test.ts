import { expect, it } from 'vitest';
import { LedgerStore } from './ledger-store';
import { Service } from './service';
import type { ModelProvider } from './model-provider';
it('computes and labels a payment from a quoted sale total and unpaid remainder', async () => {
  const store = new LedgerStore(':memory:');
  store.sqlite.exec("INSERT INTO owners VALUES ('a','A','x',0)");
  const args = {entries:[{kind:'sale',customer_name:'Bola',description:null,amount_text:'12k',remaining_text:'2k',evidence_text:'Bola bought for 12k, of that sale 2k remains unpaid',due_date_text:null}]};
  const model: ModelProvider = {listModels:async()=>[],requestToolResponse:async()=>({status:'completed',output:[{type:'function_call',status:'completed',name:'record_entries',arguments:JSON.stringify(args)}]})};
  try {
    const service = new Service('a',store,model); const ctx={channel:'web' as const,senderId:'s'};
    const r=await service.handleMessage({...ctx,text:args.entries[0].evidence_text});
    expect(r.pending?.flags).toEqual([]); expect(r.replyText).toContain('calculated as sale total minus stated unpaid amount');
    await service.confirm({...ctx,pendingId:r.pending!.id});
    expect(store.events('a').map(e=>[e.kind,e.amountKobo])).toEqual([['sale',1200000],['payment',1000000]]);
  } finally {store.close();}
});
