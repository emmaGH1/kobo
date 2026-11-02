import {randomUUID} from 'node:crypto';
import type Database from 'better-sqlite3';
import type {EntryDraft} from './ledger-store';

/** Explicit integer unit movements, independent of purchase money. Never infer quantity from cost. */
export class Inventory {
 constructor(private db:Database.Database){
  db.exec(`CREATE TABLE IF NOT EXISTS stock_items(id TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES owners(id),name TEXT NOT NULL COLLATE NOCASE,unit TEXT NOT NULL COLLATE NOCASE,reorder_at INTEGER NOT NULL CHECK(reorder_at>=0),UNIQUE(owner,name,unit));
   CREATE TABLE IF NOT EXISTS stock_movements(id TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES owners(id),item TEXT NOT NULL REFERENCES stock_items(id),delta INTEGER NOT NULL CHECK(delta<>0),pending TEXT NOT NULL UNIQUE REFERENCES pending_actions(id),at INTEGER NOT NULL);
   CREATE TRIGGER IF NOT EXISTS stock_movements_owner BEFORE INSERT ON stock_movements WHEN NOT EXISTS(SELECT 1 FROM stock_items i JOIN pending_actions p ON p.id=NEW.pending WHERE i.id=NEW.item AND i.owner=NEW.owner AND p.owner_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'stock owner mismatch'); END;
   CREATE TRIGGER IF NOT EXISTS stock_movements_no_update BEFORE UPDATE ON stock_movements BEGIN SELECT RAISE(ABORT,'stock movements are append-only'); END;
   CREATE TRIGGER IF NOT EXISTS stock_movements_no_delete BEFORE DELETE ON stock_movements BEGIN SELECT RAISE(ABORT,'stock movements are append-only'); END;`);
 }
 rows(owner:string){
  const items=this.db.prepare('SELECT id,name,unit,reorder_at AS reorderAt FROM stock_items WHERE owner=? ORDER BY name').all(owner) as {id:string;name:string;unit:string;reorderAt:number}[];
  return items.map(i=>{
   const moves=this.db.prepare('SELECT delta FROM stock_movements WHERE owner=? AND item=? ORDER BY at,rowid').all(owner,i.id) as {delta:number}[];
   const left=moves.reduce((n,m)=>{const v=n+m.delta;if(!Number.isSafeInteger(v)||v<0)throw new Error('Invalid stock total');return v;},0);
   return {...i,left,low:left<=i.reorderAt};
  }).sort((a,b)=>Number(b.low)-Number(a.low)||a.name.localeCompare(b.name));
 }
 preview(owner:string,e:EntryDraft){
  if(e.kind!=='stock_movement'||!e.stockName?.trim()||!e.stockUnit?.trim()||e.stockName.length>100||e.stockUnit.length>30||!Number.isSafeInteger(e.quantityDelta)||e.quantityDelta===0||e.amountKobo!==undefined||e.customerId||e.customerName||e.reversalOf||e.dueDate)throw new Error('Invalid stock movement');
  const row=this.rows(owner).find(r=>r.name.toLocaleLowerCase()===e.stockName!.toLocaleLowerCase()&&r.unit.toLocaleLowerCase()===e.stockUnit!.toLocaleLowerCase());
  if(!row && (e.quantityDelta ?? 0)<0)throw new Error('Record stock in before stock out');
  if(e.reorderAt!==undefined&&(!Number.isSafeInteger(e.reorderAt)||e.reorderAt<0))throw new Error('Invalid reorder threshold');
  const before=row?.left??0,after=before+e.quantityDelta!;
  if(!Number.isSafeInteger(after)||after<0)throw new Error('Not enough recorded stock');
  return {id:row?.id,name:row?.name??e.stockName,unit:row?.unit??e.stockUnit,before,after,reorderAt:e.reorderAt??row?.reorderAt??0,delta:e.quantityDelta!};
 }
 confirm(owner:string,pending:string,e:EntryDraft,at:number){
  const p=this.preview(owner,e),id=p.id??randomUUID();
  if(!p.id)this.db.prepare('INSERT INTO stock_items VALUES(?,?,?,?,?)').run(id,owner,p.name,p.unit,p.reorderAt);
  else if(e.reorderAt!==undefined)this.db.prepare('UPDATE stock_items SET reorder_at=? WHERE owner=? AND id=?').run(p.reorderAt,owner,id);
  this.db.prepare('INSERT INTO stock_movements VALUES(?,?,?,?,?,?)').run(randomUUID(),owner,id,p.delta,pending,at);
 }
}
