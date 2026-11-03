import { expect,it } from 'vitest';
import { owingDays, type LedgerEvent } from './ledger';
it('counts Lagos civil days, preserves age after partial payment, resets after clearing and handles credit',()=>{
 const day=86400000,at=Date.UTC(2026,10,1,22,59);
 const e=(id:string,kind:LedgerEvent['kind'],amountKobo:number,occurredAt:number):LedgerEvent=>({id,ownerId:'a',customerId:'c',kind,amountKobo,occurredAt});
 const events=[e('1','sale',100,at),e('2','payment',20,at+1000)];
 expect(owingDays(events,'c',at+60000)).toBe(1);
 events.push(e('3','payment',80,at+day));expect(owingDays(events,'c',at+3*day)).toBeUndefined();
 events.push(e('4','sale',50,at+2*day));expect(owingDays(events,'c',at+3*day)).toBe(1);
 expect(owingDays(events,'other',at+3*day)).toBeUndefined();
});
