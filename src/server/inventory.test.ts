import {afterEach,expect,it,vi} from 'vitest';
import {LedgerStore} from './ledger-store';
import {Service} from './service';
import {Inventory} from './inventory';
const stores:LedgerStore[]=[];afterEach(()=>{stores.forEach(s=>s.sqlite.close());stores.length=0;vi.useRealTimers();});
function book(){
 const store=new LedgerStore(':memory:');stores.push(store);store.sqlite.exec("INSERT INTO owners VALUES('a','A','x',1),('b','B','x',1)");
 const provider={listModels:async()=>[],requestToolResponse:vi.fn(async()=>{throw new Error('offline');})};
 return{store,service:new Service('a',store,provider),other:new Service('b',store,provider),ctx:{channel:'web' as const,senderId:'s'},inventory:new Inventory(store.sqlite),provider};
}
it('records integer stock movements only after confirmation, flags lows and never invents spending or sales',async()=>{
 const {store,service,ctx,inventory,provider}=book();
 const first=await service.handleMessage({...ctx,text:'stock in: rice: bag: 5: reorder 2'});expect(first.pending?.flags).toEqual([]);expect(first.replyText).toContain('After: 5');expect(inventory.rows('a')).toEqual([]);
 await service.confirm({...ctx,pendingId:first.pending!.id});await service.confirm({...ctx,pendingId:first.pending!.id});expect(inventory.rows('a')[0]).toMatchObject({left:5,reorderAt:2,low:false});
 await service.handleMessage({...ctx,text:'stock out: rice: bag: 3'});await service.handleMessage({...ctx,text:'1'});
 expect(inventory.rows('a')[0]).toMatchObject({left:2,low:true});expect((await service.handleMessage({...ctx,text:'stock left'})).replyText).toContain('LOW');
 expect(store.events('a')).toHaveLength(0);expect(store.spent('a',0,Number.MAX_SAFE_INTEGER)).toBe(0);expect(provider.requestToolResponse).not.toHaveBeenCalled();
 const item=inventory.rows('a')[0];expect(()=>store.sqlite.prepare('UPDATE stock_movements SET delta=100 WHERE item=?').run(item.id)).toThrow('append-only');expect(()=>store.sqlite.prepare('DELETE FROM stock_movements').run()).toThrow('append-only');
});
it('enforces tenant/conversation binding, nonnegative stock, safe integers and exact units',async()=>{
 const {service,other,ctx,inventory}=book();
 const review=await service.handleMessage({...ctx,text:'stock in: Rice: bag: 5'});
 await expect(other.confirm({...ctx,pendingId:review.pending!.id})).rejects.toThrow();
 await expect(service.confirm({...ctx,senderId:'foreign',pendingId:review.pending!.id})).rejects.toThrow();
 await service.confirm({...ctx,pendingId:review.pending!.id});expect(inventory.rows('b')).toEqual([]);
 for(const text of ['stock out: rice: bag: 6','stock out: rice: carton: 1','stock in: rice: bag: 9007199254740992','stock in: rice: bag: 0']){
   const bad=await service.handleMessage({...ctx,text});expect(bad.pending?.flags.length).toBeGreaterThan(0);await expect(service.confirm({...ctx,pendingId:bad.pending!.id})).rejects.toThrow();await service.handleMessage({...ctx,text:'3'});
 }
 expect(inventory.rows('a')[0].left).toBe(5);
});
it('derives seven Lagos-day insight totals and customer payments in code without pretending visits/product revenue are known',async()=>{
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(Date.UTC(2026,10,2,12));
 const {service,store,ctx,provider}=book();store.sqlite.exec("INSERT INTO customers VALUES('c','a','Ada'),('d','b','Secret Other')");
 store.seedConfirmed('a',Date.now()-86400000,'fictional',[{customerId:'c',kind:'sale',amountKobo:500000},{customerId:'c',kind:'payment',amountKobo:200000}]);
 store.seedConfirmed('b',Date.now()-86400000,'fictional',[{customerId:'d',kind:'payment',amountKobo:900000}]);
 const reply=await service.handleMessage({...ctx,text:'insights'});expect(reply.replyText).toContain('Credit sales: *₦5,000*');expect(reply.replyText).toContain('Ada · *₦2,000* · 1 payment entries');expect(reply.replyText).not.toContain('Secret Other');expect(reply.replyText).toContain('not customer visits');expect(provider.requestToolResponse).not.toHaveBeenCalled();
 const history=await service.handleMessage({...ctx,text:'Show Ada book'});expect(history.replyText).toContain('*Ada* · owes *₦3,000*');
});
