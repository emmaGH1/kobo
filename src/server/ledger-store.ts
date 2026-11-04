import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Inventory } from './inventory';
import { add, balances, money, type Customer, type LedgerEvent } from '../core/ledger';

export interface EntryDraft {
  kind: 'sale' | 'payment' | 'opening_debt' | 'reversal' | 'purchase' | 'stock_movement';
  stockName?: string;
  stockUnit?: string;
  quantityDelta?: number;
  reorderAt?: number;
  description?: string;
  customerId?: string;
  /** Source-checked proposed new customer; created only inside confirmation transaction. */
  customerName?: string;
  calculatedFromBalance?: boolean;
  amountKobo?: number;
  /** Deterministic candidates for this entry only; absent for missing amounts. */
  amountQuestion?: { source?: string; candidatesKobo: number[]; flag: string };
  reversalOf?: string;
  dueDate?: string;
  /** Unresolved source date, tracked per entry until answered. */
  needsDueDate?: boolean;
  /** Literal unresolved promise, retained for date choices without inventing a day. */
  dueDateSource?: string;
  /** Candidate IDs frozen at proposal time; selection remains explicit. */
  customerCandidates?: string[];
}
export interface PendingDraft {
  ownerId: string; channel: string; senderId: string; idempotencyKey: string;
  rawInput: string; entries: EntryDraft[]; flags?: string[];
}
export interface Pending extends PendingDraft {
  id: string; flags: string[]; status: string; createdAt: number; expiresAt: number;
}
interface PendingRow {
  id: string; owner_id: string; channel: string; sender_id: string; idempotency_key: string;
  raw_input: string; proposal_json: string; flags_json: string; status: string; created_at: number; expires_at: number;
}
export function validDueDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export class LedgerStore {
  readonly sqlite: Database.Database;
  readonly db: ReturnType<typeof drizzle>;
  constructor(path = resolve('private/kobo.sqlite')) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.sqlite = new Database(path);
    this.sqlite.pragma('foreign_keys = ON');
    this.sqlite.pragma('journal_mode = WAL');
    this.sqlite.pragma('busy_timeout = 5000');
    this.sqlite.exec(readFileSync(resolve('db/schema.sql'), 'utf8'));
    this.sqlite.transaction(() => {
      const columns = this.sqlite.pragma('table_info(ledger_events)') as {name: string}[];
      if (!columns.some(column => column.name === 'due_date')) this.sqlite.exec('ALTER TABLE ledger_events ADD COLUMN due_date TEXT');
      const pendingColumns = this.sqlite.pragma('table_info(pending_actions)') as {name: string}[];
      if (!pendingColumns.some(column => column.name === 'confirm_ref')) this.sqlite.exec('ALTER TABLE pending_actions ADD COLUMN confirm_ref INTEGER');
      if (!pendingColumns.some(column => column.name === 'confirmed_at')) this.sqlite.exec('ALTER TABLE pending_actions ADD COLUMN confirmed_at INTEGER');
    }).immediate();
    this.db = drizzle(this.sqlite);
  }
  customers(ownerId: string): Customer[] {
    return this.sqlite.prepare('SELECT id, owner_id AS ownerId, name FROM customers WHERE owner_id=? ORDER BY name').all(ownerId) as Customer[];
  }
  findCustomer(ownerId: string, name: string): Customer | undefined {
    const matches = this.sqlite.prepare(`SELECT c.id,c.owner_id AS ownerId,c.name FROM customers c
      WHERE c.owner_id=? AND (c.name=? COLLATE NOCASE OR c.id IN
      (SELECT customer_id FROM customer_aliases WHERE owner_id=? AND alias=? COLLATE NOCASE))`).all(ownerId, name, ownerId, name) as Customer[];
    // A name and another customer's alias can collide: never choose arbitrarily.
    return matches.length === 1 ? matches[0] : undefined;
  }
  events(ownerId: string): LedgerEvent[] {
    return this.sqlite.prepare(`SELECT id,owner_id AS ownerId,customer_id AS customerId,kind,amount_kobo AS amountKobo,
      reversal_of AS reversalOf,due_date AS dueDate,pending_id AS batchId,occurred_at AS occurredAt FROM ledger_events WHERE owner_id=? ORDER BY occurred_at,rowid`).all(ownerId) as LedgerEvent[];
  }
  spent(ownerId: string, start: number, end: number): number {
    const rows = this.sqlite.prepare('SELECT amount_kobo AS amount FROM stock_purchases WHERE owner_id=? AND occurred_at>=? AND occurred_at<?').all(ownerId, start, end) as {amount:number}[];
    return rows.reduce((total, row) => add(total, money(row.amount)), 0);
  }
  /** Number of stock purchases in a window, for the day summary's entry count. */
  purchaseCount(ownerId: string, start: number, end: number): number {
    return (this.sqlite.prepare('SELECT COUNT(*) AS n FROM stock_purchases WHERE owner_id=? AND occurred_at>=? AND occurred_at<?').get(ownerId, start, end) as {n: number}).n;
  }
  /** Customer-facing `K-0001` reference numbers of confirmed entries, by event id. */
  eventRefs(ownerId: string): Map<string, number> {
    const rows = this.sqlite.prepare(`SELECT e.id AS id, p.confirm_ref AS ref FROM ledger_events e JOIN pending_actions p ON p.id=e.pending_id AND p.owner_id=e.owner_id WHERE e.owner_id=? AND p.confirm_ref IS NOT NULL`).all(ownerId) as {id: string; ref: number}[];
    return new Map(rows.map(r => [r.id, r.ref]));
  }
  pending(ownerId: string, id: string): Pending | undefined {
    const row = this.sqlite.prepare('SELECT * FROM pending_actions WHERE owner_id=? AND id=?').get(ownerId, id) as PendingRow | undefined;
    if (!row) return;
    return { id: row.id, ownerId: row.owner_id, channel: row.channel, senderId: row.sender_id,
      idempotencyKey: row.idempotency_key, rawInput: row.raw_input, entries: JSON.parse(row.proposal_json),
      flags: JSON.parse(row.flags_json), status: row.status, createdAt: row.created_at, expiresAt: row.expires_at };
  }
  current(ownerId: string, channel: string, senderId: string): Pending[] {
    const ids = this.sqlite.prepare(`SELECT id FROM pending_actions WHERE owner_id=? AND channel=? AND sender_id=?
      AND status IN ('review','editing') AND expires_at>?`).all(ownerId, channel, senderId, Date.now()) as {id: string}[];
    return ids.map(({id}) => this.pending(ownerId, id)!);
  }
  validate(ownerId: string, entries: EntryDraft[]): string[] {
    const flags: string[] = [];
    if (!entries.length) flags.push('No ledger entries supplied');
    for (const entry of entries) {
      if (entry.needsDueDate) flags.push('Which day will they pay?');
      if (entry.customerCandidates?.length) flags.push('Choose the customer or confirm a new customer.');
      if (entry.kind === 'stock_movement') {
        if(entries.length!==1) flags.push('Stock movements need a separate review');
        try{new Inventory(this.sqlite).preview(ownerId,entry);}catch(error){flags.push(error instanceof Error?error.message:'Invalid stock movement');}
        continue;
      }
      if (entry.kind === 'purchase') {
        if (entries.length !== 1 || !entry.description?.trim() || entry.description.length > 200 || entry.customerId || entry.dueDate || entry.reversalOf) flags.push('Invalid stock purchase');
        try { money(entry.amountKobo); } catch { flags.push('Missing or invalid amount'); }
        continue;
      }
      if (entry.customerName) {
        if (entry.customerId || entry.customerName.length > 200 || !entry.customerName.trim() || entry.kind === 'reversal') flags.push('Invalid new customer');
        // Re-check at confirmation; never silently bind a newly conflicting name or alias.
        const matches = this.sqlite.prepare(`SELECT c.id FROM customers c WHERE c.owner_id=? AND (c.name=? COLLATE NOCASE OR c.id IN (SELECT customer_id FROM customer_aliases WHERE owner_id=? AND alias=? COLLATE NOCASE))`).all(ownerId, entry.customerName, ownerId, entry.customerName);
        if (matches.length) flags.push('Customer name now exists or is ambiguous; edit review');
      } else if (!this.customers(ownerId).some(c => c.id === entry.customerId)) flags.push('Unknown customer');
      try { money(entry.amountKobo); } catch { flags.push('Missing or invalid amount'); }
      if (entry.dueDate !== undefined && (entry.kind !== 'sale' || !validDueDate(entry.dueDate))) flags.push('Invalid due date');
      if (entry.kind === 'reversal') {
        const target = this.events(ownerId).find(e => e.id === entry.reversalOf);
        if (!target || target.kind === 'reversal' || target.customerId !== entry.customerId || target.amountKobo !== entry.amountKobo) flags.push('Invalid reversal target');
      } else if (!['sale','payment','opening_debt'].includes(entry.kind)) flags.push('Invalid event kind');
    }
    return [...new Set(flags)];
  }
  propose(input: PendingDraft): Pending {
    return this.sqlite.transaction(() => {
      const existing = this.sqlite.prepare('SELECT id FROM pending_actions WHERE owner_id=? AND idempotency_key=?').get(input.ownerId, input.idempotencyKey) as {id: string} | undefined;
      if (existing) {
        const pending = this.pending(input.ownerId, existing.id)!;
        if (pending.channel !== input.channel || pending.senderId !== input.senderId) throw new Error('Idempotency key belongs to another conversation');
        return pending;
      }
      const id = randomUUID();
      const now = Date.now();
      const flags = [...new Set([...(input.flags ?? []), ...this.validate(input.ownerId, input.entries)])];
      this.sqlite.prepare(`INSERT INTO pending_actions
        (id,owner_id,channel,sender_id,idempotency_key,raw_input,proposal_json,flags_json,status,created_at,expires_at)
        VALUES (?,?,?,?,?,?,?,?, 'review',?,?)`).run(id,input.ownerId,input.channel,input.senderId,input.idempotencyKey,input.rawInput,JSON.stringify(input.entries),JSON.stringify(flags),now,now+30*60*1000);
      return this.pending(input.ownerId, id)!;
    }).immediate();
  }
  private owned(ownerId: string, id: string, channel: string, senderId: string): Pending {
    const pending = this.pending(ownerId, id);
    if (!pending || pending.channel !== channel || pending.senderId !== senderId) throw new Error('Pending action not found');
    return pending;
  }
  confirm(ownerId: string, id: string, channel: string, senderId: string): LedgerEvent[] {
    return this.sqlite.transaction(() => {
      const pending = this.owned(ownerId,id,channel,senderId);
      // A retry acknowledges only this already-consumed version; it cannot append again.
      if (pending.status === 'confirmed') {
        const rows = this.sqlite.prepare('SELECT id FROM ledger_events WHERE owner_id=? AND pending_id=?').all(ownerId,id) as {id: string}[];
        const ids = new Set(rows.map(row => row.id));
        return this.events(ownerId).filter(event => ids.has(event.id));
      }
      if (pending.status !== 'review' || pending.expiresAt <= Date.now()) throw new Error('Pending action is stale or expired');
      if (pending.flags.length || this.validate(ownerId,pending.entries).length) throw new Error('Resolve all flags before saving');
      const now = Date.now();
      if (pending.entries[0]?.kind === 'stock_movement') {
        new Inventory(this.sqlite).confirm(ownerId,id,pending.entries[0],now);
        this.markConfirmed(ownerId,id,now);
        return [];
      }
      if (pending.entries[0]?.kind === 'purchase') {
        const entry = pending.entries[0];
        this.sqlite.prepare('INSERT INTO stock_purchases(id,owner_id,description,amount_kobo,pending_id,occurred_at) VALUES(?,?,?,?,?,?)').run(randomUUID(),ownerId,entry.description!,entry.amountKobo!,id,now);
        this.spent(ownerId, 0, Number.MAX_SAFE_INTEGER); // Reject aggregate overflow transactionally.
        this.markConfirmed(ownerId, id, now);
        return [];
      }
      const created = new Map<string, string>();
      for (const entry of pending.entries) {
        if (!entry.customerName) continue;
        const key = entry.customerName.toLocaleLowerCase();
        let customerId = created.get(key);
        if (!customerId) {
          customerId = randomUUID();
          this.sqlite.prepare('INSERT INTO customers(id,owner_id,name) VALUES(?,?,?)').run(customerId, ownerId, entry.customerName);
          created.set(key, customerId);
        }
        entry.customerId = customerId;
      }
      const insert = this.sqlite.prepare(`INSERT INTO ledger_events (id,owner_id,customer_id,kind,amount_kobo,reversal_of,pending_id,sequence,occurred_at,due_date) VALUES (?,?,?,?,?,?,?,?,?,?)`);
      const ids: string[] = pending.entries.map((entry, sequence) => {
        const eventId = randomUUID();
        insert.run(eventId,ownerId,entry.customerId!,entry.kind,entry.amountKobo!,entry.reversalOf ?? null,id,sequence,now,entry.dueDate ?? null);
        this.sqlite.prepare('INSERT INTO evidence(id,owner_id,event_id,transcript,audio_path) VALUES(?,?,?,?,NULL)').run(randomUUID(),ownerId,eventId,pending.rawInput);
        return eventId;
      });
      // Roll back the complete transaction if aggregate arithmetic exceeds safe integer bounds.
      balances(this.events(ownerId));
      this.markConfirmed(ownerId, id, now);
      return this.events(ownerId).filter(e => ids.includes(e.id));
    }).immediate();
  }
  /**
   * Appends already-decided entries as one confirmed batch with an explicit time. Only for seeding a fictional demo
   * book (and tests); real entries always arrive through propose/confirm. Same ledger tables and triggers apply.
   */
  seedConfirmed(ownerId: string, at: number, rawInput: string, entries: { customerId: string; kind: 'sale' | 'payment' | 'opening_debt'; amountKobo: number; dueDate?: string }[]): string[] {
    return this.sqlite.transaction(() => {
      const id = randomUUID();
      this.sqlite.prepare(`INSERT INTO pending_actions(id,owner_id,channel,sender_id,idempotency_key,raw_input,proposal_json,flags_json,status,created_at,expires_at,confirm_ref,confirmed_at)
        VALUES (?,?,'seed','seed',?,?,'[]','[]','confirmed',?,?,(SELECT COALESCE(MAX(confirm_ref),0)+1 FROM pending_actions WHERE owner_id=?),?)`).run(id, ownerId, randomUUID(), rawInput, at, at, ownerId, at);
      return entries.map((entry, sequence) => {
        const eventId = randomUUID();
        this.sqlite.prepare('INSERT INTO ledger_events (id,owner_id,customer_id,kind,amount_kobo,reversal_of,pending_id,sequence,occurred_at,due_date) VALUES (?,?,?,?,?,NULL,?,?,?,?)').run(eventId, ownerId, entry.customerId, entry.kind, money(entry.amountKobo), id, sequence, at, entry.dueDate ?? null);
        this.sqlite.prepare('INSERT INTO evidence(id,owner_id,event_id,transcript,audio_path) VALUES(?,?,?,?,NULL)').run(randomUUID(), ownerId, eventId, rawInput);
        return eventId;
      });
    }).immediate();
  }
  /** Sequential per-owner reference, assigned once inside the confirming transaction so retries show the same one. */
  private markConfirmed(ownerId: string, id: string, now: number) {
    this.sqlite.prepare("UPDATE pending_actions SET status='confirmed', confirm_ref=(SELECT COALESCE(MAX(confirm_ref),0)+1 FROM pending_actions WHERE owner_id=?), confirmed_at=? WHERE owner_id=? AND id=?").run(ownerId, now, ownerId, id);
  }
  confirmation(ownerId: string, id: string): {ref: number; at: number} | undefined {
    const row = this.sqlite.prepare("SELECT confirm_ref AS ref, confirmed_at AS at FROM pending_actions WHERE owner_id=? AND id=? AND status='confirmed'").get(ownerId, id) as {ref: number | null; at: number | null} | undefined;
    return row && row.ref !== null && row.at !== null ? {ref: row.ref, at: row.at} : undefined;
  }
  language(ownerId: string, channel: string, senderId: string): {language: 'en' | 'pg'; explicit: boolean} | undefined {
    const row = this.sqlite.prepare('SELECT language, explicit_choice AS explicit FROM sender_prefs WHERE owner_id=? AND channel=? AND sender_id=?').get(ownerId, channel, senderId) as {language: 'en' | 'pg'; explicit: number} | undefined;
    return row && {language: row.language, explicit: !!row.explicit};
  }
  setLanguage(ownerId: string, channel: string, senderId: string, language: 'en' | 'pg', explicit: boolean) {
    this.sqlite.prepare('INSERT INTO sender_prefs VALUES(?,?,?,?,?) ON CONFLICT(owner_id,channel,sender_id) DO UPDATE SET language=excluded.language, explicit_choice=excluded.explicit_choice').run(ownerId, channel, senderId, language, explicit ? 1 : 0);
  }
  setStatus(ownerId: string,id: string,channel: string,senderId: string,status: 'editing'|'cancelled') {
    return this.sqlite.transaction(() => {
      const pending = this.owned(ownerId,id,channel,senderId);
      if (!['review','editing'].includes(pending.status) || pending.expiresAt <= Date.now()) throw new Error('Pending action is stale or expired');
      this.sqlite.prepare('UPDATE pending_actions SET status=? WHERE id=?').run(status,id);
    }).immediate();
  }
  replace(ownerId: string,id: string,channel: string,senderId: string,input: PendingDraft): Pending {
    return this.sqlite.transaction(() => {
      const old = this.owned(ownerId,id,channel,senderId);
      if (!['review','editing'].includes(old.status) || old.expiresAt <= Date.now()) throw new Error('Pending action is stale or expired');
      if (input.ownerId !== ownerId || input.channel !== channel || input.senderId !== senderId || input.idempotencyKey === old.idempotencyKey) throw new Error('Invalid replacement');
      const next = this.propose(input);
      if (next.id === old.id || next.status !== 'review') throw new Error('Invalid replacement version');
      this.sqlite.prepare("UPDATE pending_actions SET status='superseded' WHERE id=?").run(id);
      return next;
    }).immediate();
  }
  close() { this.sqlite.close(); }
}
