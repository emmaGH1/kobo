import { randomUUID } from 'node:crypto';
import { outstandingDebts } from '../core/ledger';
import type { MessageReply } from '../core/contract';
import { LedgerStore } from './ledger-store';
import * as copy from './copy';

interface Reminder {id:string;owner:string;channel:string;sender:string;sale:string;not_before:number;status:string}
/** Persistent due-job/outbox boundary. Does NOT send WhatsApp/customer messages. */
export class Reminders {
  constructor(private store: LedgerStore) {
    store.sqlite.exec(`CREATE TABLE IF NOT EXISTS reminder_prefs(owner TEXT NOT NULL REFERENCES owners(id),channel TEXT NOT NULL,sender TEXT NOT NULL,enabled INTEGER NOT NULL,PRIMARY KEY(owner,channel,sender));
      CREATE TABLE IF NOT EXISTS due_reminders(id TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES owners(id),channel TEXT NOT NULL,sender TEXT NOT NULL,sale TEXT NOT NULL REFERENCES ledger_events(id),not_before INTEGER NOT NULL,status TEXT NOT NULL,UNIQUE(owner,channel,sender,sale));`);
  }
  opt(owner:string,channel:string,sender:string,enabled:boolean) {
    this.store.sqlite.prepare('INSERT INTO reminder_prefs VALUES(?,?,?,?) ON CONFLICT(owner,channel,sender) DO UPDATE SET enabled=excluded.enabled').run(owner,channel,sender,+enabled);
    if (!enabled) this.store.sqlite.prepare("UPDATE due_reminders SET status='stopped' WHERE owner=? AND channel=? AND sender=?").run(owner,channel,sender);
  }
  /** Safe to call repeatedly from a scheduler. Due at 08:00 Africa/Lagos = 07:00 UTC. */
  tick(now=Date.now(), only?:{owner:string;channel:string;sender:string}, simulated=false): number {
    return this.store.sqlite.transaction(()=>{
      let count=0;
      const prefs = only ? [{...only,enabled:1}] : this.store.sqlite.prepare('SELECT owner,channel,sender,enabled FROM reminder_prefs WHERE enabled=1').all() as {owner:string;channel:string;sender:string;enabled:number}[];
      for(const p of prefs) {
        if (simulated && !this.store.sqlite.prepare('SELECT 1 FROM owners WHERE id=? AND is_demo=1').get(p.owner)) throw new Error('Simulation requires demo owner');
        if (only && !simulated && !this.store.sqlite.prepare('SELECT 1 FROM reminder_prefs WHERE owner=? AND channel=? AND sender=? AND enabled=1').get(p.owner,p.channel,p.sender)) continue;
        const debts=outstandingDebts(this.store.events(p.owner));
        const remaining = new Set(debts.map(d=>d.id));
        const jobs=this.store.sqlite.prepare('SELECT * FROM due_reminders WHERE owner=? AND channel=? AND sender=?').all(p.owner,p.channel,p.sender) as Reminder[];
        for(const job of jobs) if(!remaining.has(job.sale)) this.store.sqlite.prepare("UPDATE due_reminders SET status='settled' WHERE id=?").run(job.id);
        for(const sale of debts.filter(d=>d.kind==='sale'&&d.dueDate)) {
          const due=Date.parse(`${sale.dueDate}T07:00:00.000Z`);
          if(due>now) continue;
          count+=this.store.sqlite.prepare("INSERT OR IGNORE INTO due_reminders VALUES(?,?,?,?,?,?,'ready')").run(randomUUID(),p.owner,p.channel,p.sender,sale.id,due).changes;
        }
        count+=this.store.sqlite.prepare("UPDATE due_reminders SET status='ready' WHERE owner=? AND channel=? AND sender=? AND status='snoozed' AND not_before<=?").run(p.owner,p.channel,p.sender,now).changes;
      }
      return count;
    }).immediate();
  }
  private owned(owner:string,channel:string,sender:string,id:string) {
    return this.store.sqlite.prepare('SELECT * FROM due_reminders WHERE id=? AND owner=? AND channel=? AND sender=?').get(id,owner,channel,sender) as Reminder|undefined;
  }
  facts(owner:string,channel:string,sender:string,id:string) {
    const row=this.owned(owner,channel,sender,id);
    if(!row || row.status==='stopped'||row.status==='settled') return;
    const debt=outstandingDebts(this.store.events(owner)).find(d=>d.id===row.sale);
    if(!debt?.dueDate) return;
    const name=this.store.customers(owner).find(c=>c.id===debt.customerId)?.name;
    if(!name) return;
    const total=this.store.events(owner); // balance is computed from the same owner's ledger.
    return {row,debt,name,total};
  }
  reply(owner:string,channel:string,sender:string,id:string,lang:copy.Language,draft=false):MessageReply|undefined {
    const f=this.facts(owner,channel,sender,id);if(!f)return;
    const customerTotal=outstandingDebts(f.total).filter(d=>d.customerId===f.debt.customerId).reduce((n,d)=>n+d.remainingKobo,0);
    const body=draft?copy.draftedReminder(lang,f.name,f.debt.remainingKobo,f.debt.dueDate!):copy.dueReminder(lang,f.name,f.debt.remainingKobo,customerTotal,f.debt.dueDate!,f.debt.occurredAt);
    return draft?{replyText:body}:{replyText:body,interactive:{kind:'buttons',body:body.slice(0,1024),buttons:[copy.button(`reminder:${id}:draft`,'Draft message'),copy.button(`reminder:${id}:paid`,lang==='pg'?'E don pay':'Already paid'),copy.button(`reminder:${id}:later`,'Remind me later')]}};
  }
  /** Adapter consumes owner-bound outbox, with a stable idempotency ID. No send is implied. */
  queued(owner:string,channel:string,sender:string,lang:copy.Language) {
    const rows=this.store.sqlite.prepare("SELECT * FROM due_reminders WHERE owner=? AND channel=? AND sender=? AND status='ready' ORDER BY not_before,id").all(owner,channel,sender) as Reminder[];
    return rows.flatMap(row=>{const reply=this.reply(owner,channel,sender,row.id,lang);return reply?[{id:row.id,reply}]:[];});
  }
  markPresented(owner:string,channel:string,sender:string,id:string) {this.store.sqlite.prepare("UPDATE due_reminders SET status='presented' WHERE id=? AND owner=? AND channel=? AND sender=? AND status='ready'").run(id,owner,channel,sender);}
  later(owner:string,channel:string,sender:string,id:string,now=Date.now()) {
    if(!this.facts(owner,channel,sender,id))throw new Error('Reminder not found');
    // Repeated tap doesn't keep postponing the same reminder.
    this.store.sqlite.prepare("UPDATE due_reminders SET status='snoozed',not_before=? WHERE id=? AND status IN ('ready','presented')").run(now+86400000,id);
  }
}
