import { afterEach,expect,it,vi } from 'vitest';
import { LedgerStore } from './ledger-store';
import { Reminders } from './reminders';
import { Service } from './service';
import { outstandingDebts } from '../core/ledger';
const stores:LedgerStore[]=[];afterEach(()=>{stores.forEach(s=>s.sqlite.close());stores.length=0;vi.useRealTimers();});
function book(){
 const store=new LedgerStore(':memory:');stores.push(store);
 store.sqlite.exec("INSERT INTO owners VALUES('a','A','x',1),('b','B','x',0);INSERT INTO customers VALUES('c','a','Mama Chidi')");
 store.seedConfirmed('a',Date.UTC(2026,9,20),'fictional',[{customerId:'c',kind:'opening_debt',amountKobo:850000}]);
 store.seedConfirmed('a',Date.UTC(2026,10,2),'fictional',[{customerId:'c',kind:'sale',amountKobo:4500000,dueDate:'2026-11-06'},{customerId:'c',kind:'payment',amountKobo:2000000}]);
 const manager=new Reminders(store);const ctx={channel:'web' as const,senderId:'s'};
 const service=new Service('a',store,{listModels:async()=>[],requestToolResponse:async()=>{throw new Error('offline');}});
 return {store,manager,ctx,service};
}
it('allocates same-sale partial payments before older debt, then independent payments FIFO',()=>{
 const {store}=book();let debts=outstandingDebts(store.events('a'));expect(debts.map(d=>d.remainingKobo)).toEqual([850000,2500000]);
 store.seedConfirmed('a',Date.UTC(2026,10,3),'fictional',[{customerId:'c',kind:'payment',amountKobo:1000000}]);
 debts=outstandingDebts(store.events('a'));expect(debts.map(d=>d.remainingKobo)).toEqual([2350000]);
});
it('queues at exactly 08:00 Lagos only after opt-in and deduplicates repeated scheduler ticks',()=>{
 const {manager}=book(),at=Date.UTC(2026,10,6,7);
 expect(manager.tick(at)).toBe(0);manager.opt('a','web','s',true);
 expect(manager.tick(at-1)).toBe(0);expect(manager.tick(at)).toBe(1);expect(manager.tick(at+1000)).toBe(0);
 const jobs=manager.queued('a','web','s','en');expect(jobs).toHaveLength(1);expect(jobs[0].reply.replyText).toContain('₦25,000');expect(jobs[0].reply.replyText).toContain('₦33,500');
 expect(manager.queued('b','web','s','en')).toHaveLength(0);expect(manager.facts('a','web','foreign',jobs[0].id)).toBeUndefined();
 manager.markPresented('a','web','s',jobs[0].id);manager.later('a','web','s',jobs[0].id,at);
 manager.later('a','web','s',jobs[0].id,at+1000);expect(manager.tick(at+86400000-1)).toBe(0);expect(manager.tick(at+86400000)).toBe(1);
 manager.opt('a','web','s',false);expect(manager.queued('a','web','s','en')).toHaveLength(0);
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(at+2*86400000);
 manager.opt('a','web','s',true);expect(manager.queued('a','web','s','en')).toHaveLength(1);
});
it('draft is only text and Already paid asks an amount, then a distinct confirmation; settled debt suppresses stale buttons',async()=>{
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(Date.UTC(2026,10,6,7));
 const {store,manager,service,ctx}=book();manager.opt('a','web','s',true);manager.tick();
 const id=manager.queued('a','web','s','en')[0].id;
 const draft=await service.handleInteractive({...ctx,id:`reminder:${id}:draft`});expect(draft.replyText).toContain('You send it. Nothing goes out without you.');expect(store.events('a')).toHaveLength(3);
 const ask=await service.handleInteractive({...ctx,id:`reminder:${id}:paid`});expect(ask.pending?.flags.length).toBeGreaterThan(0);expect(store.events('a')).toHaveLength(3);
 const review=await service.handleMessage({...ctx,text:'33,500'});expect(review.pending?.flags).toEqual([]);expect(store.events('a')).toHaveLength(3);
 await service.handleMessage({...ctx,text:'1'});expect(store.events('a')).toHaveLength(4);manager.tick();
 expect(manager.queued('a','web','s','en')).toHaveLength(0);expect((await service.handleInteractive({...ctx,id:`reminder:${id}:draft`})).replyText).toContain('no longer available');
});
it('allows a demo-only preview without moving real time or bypassing real-owner opt-in',()=>{
 const {manager}=book(),at=Date.UTC(2026,10,6,7);
 expect(manager.tick(at,{owner:'a',channel:'web',sender:'s'},true)).toBe(1);
 expect(()=>manager.tick(at,{owner:'b',channel:'web',sender:'s'},true)).toThrow('demo');
});
