import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { add, balances, money, type Customer, type LedgerEvent } from '../core/ledger';

export interface EntryDraft {
  kind: 'sale' | 'payment' | 'opening_debt' | 'reversal' | 'purchase';
  description?: string;
  customerId?: string;
  /** Source-checked proposed new customer; created only inside confirmation transaction. */
  customerName?: string;
  calculatedFromBalance?: boolean;
  amountKobo?: number;
  reversalOf?: string;
  dueDate?: string;
  /** Unresolved source date, tracked per entry until answered. */
  needsDueDate?: boolean;
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
      reversal_of AS reversalOf,due_date AS dueDate,occurred_at AS occurredAt FROM ledger_events WHERE owner_id=? ORDER BY occurred_at,rowid`).all(ownerId) as LedgerEvent[];
  }
  spent(ownerId: string, start: number, end: number): number {
    const rows = this.sqlite.prepare('SELECT amount_kobo AS amount FROM stock_purchases WHERE owner_id=? AND occurred_at>=? AND occurred_at<?').all(ownerId, start, end) as {amount:number}[];
    return rows.reduce((total, row) => add(total, money(row.amount)), 0);
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
      if (entry.needsDueDate) flags.push('Which day will they pay? Use YYYY-MM-DD, today, tomorrow or a weekday.');
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
      if (pending.entries[0]?.kind === 'purchase') {
        const entry = pending.entries[0];
        this.sqlite.prepare('INSERT INTO stock_purchases(id,owner_id,description,amount_kobo,pending_id,occurred_at) VALUES(?,?,?,?,?,?)').run(randomUUID(),ownerId,entry.description!,entry.amountKobo!,id,now);
        this.spent(ownerId, 0, Number.MAX_SAFE_INTEGER); // Reject aggregate overflow transactionally.
        this.sqlite.prepare("UPDATE pending_actions SET status='confirmed' WHERE id=?").run(id);
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
      this.sqlite.prepare("UPDATE pending_actions SET status='confirmed' WHERE id=?").run(id);
      return this.events(ownerId).filter(e => ids.includes(e.id));
    }).immediate();
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
