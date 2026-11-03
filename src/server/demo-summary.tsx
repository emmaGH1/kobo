import { ImageResponse } from 'next/og';
import { add, dailySummary, debtors } from '../core/ledger';
import { formatNaira } from './copy';
import type { LedgerStore } from './ledger-store';

/** Authenticated fictional demo book only; no public/customer identifiers in the image. */
export function demoSummaryCard(store: LedgerStore, owner: string) {
  const now = Date.now();
  const d = new Date(now + 3600000);
  const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - 3600000;
  const events = store.events(owner);
  const today = dailySummary(events, start, start + 86400000);
  const owing = debtors(events, store.customers(owner)).reduce((n,c)=>add(n,c.balanceKobo),0);
  const rows = [['People owe you',owing],['Credit sales today',today.salesKobo],['Collected today',today.collectionsKobo],['Stock bought today',store.spent(owner,start,start+86400000)]] as const;
  return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',padding:80,background:'#F4F0E6',color:'#1B1A17',fontFamily:'sans-serif'}}>
    <div style={{fontSize:64,display:'flex'}}>kobo · demo book</div>
    <div style={{fontSize:28,marginTop:20,display:'flex'}}>Fictional sample data · {d.toISOString().slice(0,10)}</div>
    {rows.map(([label,value])=><div key={label} style={{display:'flex',flexDirection:'column',borderBottom:'2px solid #ccc7bb',paddingTop:64,paddingBottom:32}}><div style={{fontSize:32,display:'flex'}}>{label}</div><div style={{fontSize:72,display:'flex',marginTop:16}}>{formatNaira(value).replace('₦', 'NGN ')}</div></div>)}
  </div>, {width:1080,height:1350,headers:{'Cache-Control':'private, no-store'}});
}
