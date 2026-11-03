export type EventKind = 'sale' | 'payment' | 'opening_debt' | 'reversal';
export interface LedgerEvent {
  id: string;
  ownerId: string;
  customerId: string;
  kind: EventKind;
  amountKobo: number;
  reversalOf?: string;
  dueDate?: string | null;
  occurredAt: number;
  /** Confirmed proposal batch; payments in a sale's own batch apply to that sale first. */
  batchId?: string;
}
export interface Customer { id: string; ownerId: string; name: string }

export function money(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Amount must be a positive safe integer in kobo');
  }
  return value;
}
export function add(a: number, b: number): number {
  const total = a + b;
  if (!Number.isSafeInteger(total)) throw new Error('Integer total overflow');
  return total;
}
function original(event: LedgerEvent, events: readonly LedgerEvent[]): LedgerEvent {
  if (event.kind !== 'reversal') return event;
  const target = events.find(e => e.id === event.reversalOf && e.ownerId === event.ownerId);
  if (!target || target.kind === 'reversal' || target.customerId !== event.customerId || target.amountKobo !== event.amountKobo) {
    throw new Error('Invalid reversal');
  }
  return target;
}
export function balances(events: readonly LedgerEvent[]): Record<string, number> {
  const result: Record<string, number> = Object.create(null);
  for (const event of events) {
    money(event.amountKobo);
    const source = original(event, events);
    const sign = (source.kind === 'payment' ? -1 : 1) * (event.kind === 'reversal' ? -1 : 1);
    result[event.customerId] = add(result[event.customerId] ?? 0, sign * event.amountKobo);
  }
  return result;
}
export function debtors(events: readonly LedgerEvent[], customers: readonly Customer[]) {
  const totals = balances(events);
  return customers.map(customer => ({ ...customer, balanceKobo: totals[customer.id] ?? 0 }))
    .filter(customer => customer.balanceKobo > 0)
    .sort((a, b) => b.balanceKobo - a.balanceKobo || a.name.localeCompare(b.name));
}
/** Explicit UTC millisecond boundaries; caller chooses its business timezone. Reversals count on correction day. */
export function dailySummary(events: readonly LedgerEvent[], start: number, end: number) {
  let salesKobo = 0;
  let collectionsKobo = 0;
  for (const event of events) {
    if (event.occurredAt < start || event.occurredAt >= end) continue;
    const source = original(event, events);
    const amount = money(event.amountKobo) * (event.kind === 'reversal' ? -1 : 1);
    if (source.kind === 'sale') salesKobo = add(salesKobo, amount);
    if (source.kind === 'payment') collectionsKobo = add(collectionsKobo, amount);
  }
  return { salesKobo, collectionsKobo };
}

/** Current unpaid principal by debt entry. Same-batch partial payments first; other payments FIFO.
 * Reversed events are excluded. This allocation is deterministic policy, not model inference.
 */
export function outstandingDebts(events: readonly LedgerEvent[]) {
  const undone = new Set(events.filter(e=>e.kind==='reversal').map(e=>e.reversalOf));
  const active = events.filter(e=>e.kind!=='reversal' && !undone.has(e.id));
  const debts = active.filter(e=>e.kind==='sale'||e.kind==='opening_debt').map(e=>({...e,remainingKobo:money(e.amountKobo)}));
  for (const payment of active.filter(e=>e.kind==='payment')) {
    let left = money(payment.amountKobo);
    const eligible = debts.filter(d=>d.ownerId===payment.ownerId && d.customerId===payment.customerId);
    const same = payment.batchId ? eligible.filter(d=>d.batchId===payment.batchId) : [];
    for (const debt of [...same,...eligible.filter(d=>!same.includes(d))]) {
      const amount = Math.min(left,debt.remainingKobo);
      debt.remainingKobo -= amount; left -= amount;
      if (!left) break;
    }
  }
  return debts.filter(d=>d.remainingKobo>0);
}

export interface HistoryRow {
  id: string;
  /** `reversal` rows keep the kind of the entry they undo in `sourceKind`. */
  kind: EventKind;
  sourceKind: 'sale' | 'payment' | 'opening_debt';
  amountKobo: number;
  occurredAt: number;
  /** What the customer owes right after this entry, calculated by code. Negative means credit. */
  balanceKobo: number;
  reversalOf?: string;
}
/** One customer's entries oldest first, each with the running balance. Display data; the ledger is untouched. */
export function history(events: readonly LedgerEvent[], customerId: string): HistoryRow[] {
  let running = 0;
  const rows: HistoryRow[] = [];
  for (const event of events) {
    if (event.customerId !== customerId) continue;
    const source = original(event, events);
    const signed = (source.kind === 'payment' ? -1 : 1) * (event.kind === 'reversal' ? -1 : 1) * money(event.amountKobo);
    running = add(running, signed);
    rows.push({ id: event.id, kind: event.kind, sourceKind: source.kind as HistoryRow['sourceKind'], amountKobo: event.amountKobo, occurredAt: event.occurredAt, balanceKobo: running, ...(event.reversalOf ? { reversalOf: event.reversalOf } : {}) });
  }
  return rows;
}
/**
 * When a customer's current debt began: the time of the entry that last moved their balance from
 * zero (or credit) to owing. Partial payments do not reset it. Undefined when they owe nothing.
 */
export function owingSince(events: readonly LedgerEvent[], customerId: string): number | undefined {
  let since: number | undefined;
  let previous = 0;
  for (const row of history(events, customerId)) {
    if (row.balanceKobo > 0 && previous <= 0) since = row.occurredAt;
    previous = row.balanceKobo;
  }
  return previous > 0 ? since : undefined;
}
/** Civil-day age of the current positive balance, from recorded entries, not an inferred overdue date. */
export function owingDays(events: readonly LedgerEvent[], customerId: string, now = Date.now()): number | undefined {
  const since = owingSince(events,customerId);
  return since === undefined ? undefined : Math.max(0,Math.floor((now+3600000)/86400000)-Math.floor((since+3600000)/86400000));
}
/** Time of the most recent payment that has not been reversed. */
export function lastPaidAt(events: readonly LedgerEvent[], customerId: string): number | undefined {
  const undone = new Set(events.filter(e => e.kind === 'reversal' && e.reversalOf).map(e => e.reversalOf));
  return events.filter(e => e.customerId === customerId && e.kind === 'payment' && !undone.has(e.id)).reduce<number | undefined>((latest, e) => (latest === undefined || e.occurredAt > latest ? e.occurredAt : latest), undefined);
}
