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
