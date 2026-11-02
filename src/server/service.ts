import { randomUUID } from 'node:crypto';
import { balances, dailySummary, debtors } from '../core/ledger';
import { CONFIRMATION_PROMPT, type BookkeepingService, type MessageReply, type PendingActionInput, type EditPendingInput, type MessageInput } from '../core/contract';
import { LedgerStore, validDueDate, type Pending, type PendingDraft } from './ledger-store';
import { type ModelProvider, type ToolRequest } from './model-provider';
import { parseToolResponse, statedAmountKobo } from './tool-calls';

const empty = { type: 'object', properties: {}, required: [], additionalProperties: false };
export const tools: ToolRequest['tools'] = [
  { type: 'function', name: 'record_facts', description: 'Extract stated transaction facts, never calculate or infer missing facts.', parameters: { type: 'object', properties: { facts: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['sale', 'payment', 'opening_debt'] }, customer_name: { type: ['string', 'null'] }, amount_text: { type: ['string', 'null'] } }, required: ['kind', 'customer_name', 'amount_text'], additionalProperties: false } } }, required: ['facts'], additionalProperties: false } },
  { type: 'function', name: 'record_purchase', description: 'Extract a stated purchase of stock and its total price; do not infer.', parameters: { type: 'object', properties: { description: { type: ['string', 'null'] }, amount_text: { type: ['string', 'null'] } }, required: ['description', 'amount_text'], additionalProperties: false } },
  { type: 'function', name: 'list_debtors', description: 'List customers who owe money.', parameters: empty },
  { type: 'function', name: 'get_balance', description: 'Get a customer balance.', parameters: { type: 'object', properties: { customer_name: { type: 'string' } }, required: ['customer_name'], additionalProperties: false } },
  { type: 'function', name: 'daily_summary', description: 'Get today’s sales and collections.', parameters: empty },
];
const format = (n: number) => `₦${Math.floor(Math.abs(n) / 100)}.${String(Math.abs(n) % 100).padStart(2, '0')}`;
function review(p: Pending, store: LedgerStore): MessageReply {
  const customers = store.customers(p.ownerId);
  const summary = p.entries.map(e => `${e.kind}: ${e.kind === 'purchase' ? e.description ?? 'unknown stock' : customers.find(c => c.id === e.customerId)?.name ?? 'unknown customer'} — ${e.amountKobo ? format(e.amountKobo) : 'unknown amount'}${e.dueDate ? `, due ${e.dueDate}` : ''}`).join('\n');
  return { replyText: `${summary}\n${p.flags.length ? `Resolve: ${p.flags.join('; ')}\n` : ''}${CONFIRMATION_PROMPT}`, pending: { id: p.id, summary, flags: p.flags } };
}
/** Deliberately narrow deterministic grammar. Model output alone never clears transaction ambiguity. */
function independentlyMatched(text: string, kind: string, name: string | null, amount: string | null): boolean {
  if (!name || !amount) return false;
  const match = /^(credit sale|payment|opening debt)\s*:\s*([^:\n]+?)\s*:\s*(\d+(?:\.\d{1,2})?)(?:\s*:\s*due\s+(\d{4}-\d{2}-\d{2}))?\s*$/i.exec(text.trim());
  return !!match && (!match[4] || (kind === 'sale' && validDueDate(match[4]))) && (match[1].toLowerCase() === 'credit sale' ? 'sale' : match[1].toLowerCase().replace(' ', '_')) === kind && match[2].trim().toLocaleLowerCase() === name.toLocaleLowerCase() && match[3] === amount;
}
export class Service implements BookkeepingService {
  constructor(private ownerId: string, private store: LedgerStore, private provider: ModelProvider) {}
  private check(input: MessageInput | PendingActionInput) {
    if (!['web', 'whatsapp'].includes(input.channel) || !input.senderId || input.senderId.length > 200) throw new Error('Invalid sender');
  }
  async handleMessage(input: MessageInput): Promise<MessageReply> {
    this.check(input);
    if (input.audioPath || !input.text?.trim() || input.text.length > 4000) throw new Error('Only bounded text is supported');
    const text = input.text.trim();
    const current = this.store.current(this.ownerId, input.channel, input.senderId);
    if (current.length > 1) return { replyText: 'Multiple pending reviews need attention; use their review IDs.' };
    const p = current[0];
    if (p && /^(1(?: save)?|2(?: edit)?|3(?: cancel)?)$/i.test(text)) {
      const action = { channel: input.channel, senderId: input.senderId, pendingId: p.id };
      if (text[0] === '1') return this.confirm(action);
      if (text[0] === '2') return this.edit(action);
      return this.cancel(action);
    }
    if (p && p.status !== 'editing') return review(p, this.store);
    // An exact, explicit command does not need a model to reinterpret it.
    const purchase = /^stock purchase\s*:\s*([^:\n]+?)\s*:\s*(\d+(?:\.\d{1,2})?)\s*$/i.exec(text);
    if (purchase) {
      const amountKobo = statedAmountKobo(purchase[2], text);
      const draft: PendingDraft = { ownerId: this.ownerId, channel: input.channel, senderId: input.senderId, idempotencyKey: randomUUID(), rawInput: text, entries: [{kind:'purchase', description: purchase[1].trim(), amountKobo}], flags: amountKobo ? [] : ['Missing or invalid amount'] };
      return review(p ? this.store.replace(this.ownerId, p.id, input.channel, input.senderId, draft) : this.store.propose(draft), this.store);
    }
    const response = await this.provider.requestToolResponse({ input: `Extract the user's stated facts or requested read operation. Do not infer missing amounts. User message:\n${text}`, tools });
    const call = parseToolResponse(response);
    if (call.name === 'list_debtors') {
      const rows = debtors(this.store.events(this.ownerId), this.store.customers(this.ownerId));
      return { replyText: rows.length ? rows.map(c => `${c.name}: ${format(c.balanceKobo)}`).join('\n') : 'No debtors.' };
    }
    if (call.name === 'get_balance') {
      const c = this.store.findCustomer(this.ownerId, call.args.customer_name);
      if (!c) return { replyText: 'Customer not found.' };
      const amount = balances(this.store.events(this.ownerId))[c.id] ?? 0;
      return { replyText: `${c.name}: ${amount < 0 ? 'credit ' : ''}${format(amount)}` };
    }
    if (call.name === 'daily_summary') {
      const now = new Date(); const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const result = dailySummary(this.store.events(this.ownerId), start, start + 86400000);
      return { replyText: `Today (UTC): sales ${format(result.salesKobo)}, collections ${format(result.collectionsKobo)}, stock spent ${format(this.store.spent(this.ownerId, start, start + 86400000))}` };
    }
    if (call.name === 'record_purchase') {
      const match = /^stock purchase\s*:\s*([^:\n]+?)\s*:\s*(\d+(?:\.\d{1,2})?)\s*$/i.exec(text);
      const amountKobo = statedAmountKobo(call.args.amount_text, text);
      const flags: string[] = [];
      if (!match || !call.args.description || match[1].trim().toLocaleLowerCase() !== call.args.description.toLocaleLowerCase() || match[2] !== call.args.amount_text || !amountKobo) flags.push('Use exact format: stock purchase: description: amount');
      const draft: PendingDraft = { ownerId: this.ownerId, channel: input.channel, senderId: input.senderId, idempotencyKey: randomUUID(), rawInput: text, entries: [{kind:'purchase', description: call.args.description ?? undefined, amountKobo}], flags };
      return review(p ? this.store.replace(this.ownerId, p.id, input.channel, input.senderId, draft) : this.store.propose(draft), this.store);
    }
    const flags: string[] = [];
    if (call.args.facts.length !== 1) flags.push('Multiple transactions require separate messages');
    const entries = call.args.facts.map(f => {
      const customer = f.customer_name ? this.store.findCustomer(this.ownerId, f.customer_name) : undefined;
      if (!customer) flags.push('Unknown customer');
      const amountKobo = statedAmountKobo(f.amount_text, text);
      if (!amountKobo) flags.push('Missing or ambiguous amount');
      if (!independentlyMatched(text, f.kind, f.customer_name, f.amount_text)) flags.push('Use exact format: credit sale: customer: amount, payment: customer: amount, or opening debt: customer: amount');
      const dueDate = /:\s*due\s+(\d{4}-\d{2}-\d{2})\s*$/i.exec(text)?.[1];
      return { kind: f.kind, customerId: customer?.id, amountKobo, ...(dueDate ? { dueDate } : {}) };
    });
    const draft: PendingDraft = { ownerId: this.ownerId, channel: input.channel, senderId: input.senderId, idempotencyKey: randomUUID(), rawInput: text, entries, flags };
    return review(p ? this.store.replace(this.ownerId, p.id, input.channel, input.senderId, draft) : this.store.propose(draft), this.store);
  }
  async confirm(input: PendingActionInput): Promise<MessageReply> {
    this.check(input); this.store.confirm(this.ownerId, input.pendingId, input.channel, input.senderId); return { replyText: 'Saved.' };
  }
  async edit(input: EditPendingInput): Promise<MessageReply> {
    this.check(input);
    if (input.audioPath) throw new Error('Audio is not supported');
    this.store.setStatus(this.ownerId, input.pendingId, input.channel, input.senderId, 'editing');
    if (input.text?.trim()) return this.handleMessage(input);
    return { replyText: 'Send replacement details for a new review.' };
  }
  async cancel(input: PendingActionInput): Promise<MessageReply> {
    this.check(input); this.store.setStatus(this.ownerId, input.pendingId, input.channel, input.senderId, 'cancelled'); return { replyText: 'Cancelled.' };
  }
}
