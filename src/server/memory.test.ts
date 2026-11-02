import { expect,it,vi } from 'vitest';
import { LedgerStore } from './ledger-store';
import { Service } from './service';
it('remembers debt age/history after a Pidgin partial payment and keeps every save explicit',async()=>{
 const store=new LedgerStore(':memory:');store.sqlite.exec("INSERT INTO owners VALUES('a','A','x',1); INSERT INTO customers VALUES('c','a','Bayo')");
 store.seedConfirmed('a',Date.now()-14*86400000,'Fictional',[{kind:'sale',customerId:'c',amountKobo:1000000}]);
 const provider={listModels:async()=>[],requestToolResponse:vi.fn(async()=>{throw new Error('offline');})};
 const service=new Service('a',store,provider),ctx={channel:'web' as const,senderId:'s'};
 await service.handleMessage({...ctx,text:'Pidgin'});
 const review=await service.handleMessage({...ctx,text:'Bayo don pay 3,800'});
 expect(review.pending?.flags).toEqual([]);expect(review.replyText).toContain('₦3,800');expect(store.events('a')).toHaveLength(1);
 await service.handleMessage({...ctx,text:'1'});
 const debtors=await service.handleMessage({...ctx,text:'who dey owe me'});
 expect(debtors.replyText).toContain('₦6,200');expect(debtors.interactive?.rows?.[0].description).toContain('14 days');
 const history=await service.handleMessage({...ctx,text:'history Bayo'});
 expect(history.replyText).toContain('E don owe for 14 days for this book');expect(history.replyText).toContain('last pay');
 expect((await service.handleMessage({...ctx,text:'how many days Bayo dey owe me'})).replyText).toContain('14 days');
 expect(provider.requestToolResponse).not.toHaveBeenCalled();store.sqlite.close();
});
