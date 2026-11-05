import { randomUUID } from 'node:crypto';
import { balances, type Customer } from '../core/ledger';
import type { MessageReply } from '../core/contract';
import { LedgerStore } from './ledger-store';
import * as copy from './copy';
import type { Language } from './copy';

type Conversation = { channel: string; senderId: string };
export const CUSTOMER_CONTEXT_TTL = 5 * 60 * 1000;

/** Deliberately bounded grammar, shared by typed and transcribed text. Unsupported wording asks
 * for a name, rather than asking a model to select a customer or invent reminder facts. */
export function draftTarget(text: string): { name?: string; pronoun?: boolean } | undefined {
  if (!/\b(?:draft|write|compose)\b/i.test(text) || !/\b(?:message|reminder|text)\b/i.test(text)) return;
  const tail = /\b(?:message|reminder|text)\b\s*(.*)$/i.exec(text)?.[1] ?? '';
  const target = tail.replace(/^(?:(?:to remind|asking|ask|to|for|give|tell|reminding)\s+)+/i, '')
    .split(/[,!?;\n]|\.{2,}|\b(?:to\s+(?:pay|repay|settle)|asking|about|because|that|say|make|his|her debt|their|im debt|debt|wey)\b/i)[0]
    .replace(/[.\s]+$/, '').trim();
  if (/^(?:him|her|them|am|im)$/i.test(target)) return { pronoun: true };
  // Never treat a bare request or unparsed instruction as a fuzzy customer search.
  if (!target || target.length > 200 || !/^[\p{L}][\p{L} .'-]*$/u.test(target)) return {};
  return { name: target };
}

/** Read-only money path. Context is workflow metadata, not a ledger event or a send instruction. */
export class ReminderDrafts {
  constructor(private store: LedgerStore, private ownerId: string) {}

  /** Consume on EVERY incoming turn, including unrelated messages and interactive actions.
   * Persistence permits a new Service instance per request; TTL is not renewed by pronoun use. */
  take(input: Conversation): { customerId?: string; token: string } {
    return this.store.sqlite.transaction(() => {
      const row = this.store.sqlite.prepare(`SELECT customer_id AS id, mentioned_at AS at FROM recent_customer_context
        WHERE owner_id=? AND channel=? AND sender_id=?`).get(this.ownerId, input.channel, input.senderId) as { id: string | null; at: number } | undefined;
      const now = Date.now(), token = randomUUID();
      this.store.sqlite.prepare(`INSERT INTO recent_customer_context VALUES(?,?,?,NULL,?,?)
        ON CONFLICT(owner_id,channel,sender_id) DO UPDATE SET customer_id=NULL, mentioned_at=excluded.mentioned_at, turn_token=excluded.turn_token`)
        .run(this.ownerId, input.channel, input.senderId, now, token);
      const age = row ? now - row.at : -1;
      return { token, customerId: row?.id && age >= 0 && age < CUSTOMER_CONTEXT_TTL && this.store.customers(this.ownerId).some(c => c.id === row.id) ? row.id : undefined };
    }).immediate();
  }

  /** Call only after an explicit, unambiguous single-customer read/selection. A slow model read
   * cannot overwrite newer turns. Overlapping completions invalidate reference rather than guess. */
  remember(input: Conversation, customer: Customer, token: string) {
    if (customer.ownerId !== this.ownerId) throw new Error('Invalid customer context');
    this.store.sqlite.transaction(() => {
      const result = this.store.sqlite.prepare(`UPDATE recent_customer_context SET customer_id=?, mentioned_at=?
        WHERE owner_id=? AND channel=? AND sender_id=? AND turn_token=?`)
        .run(customer.id, Date.now(), this.ownerId, input.channel, input.senderId, token);
      if (!result.changes) this.store.sqlite.prepare('UPDATE recent_customer_context SET customer_id=NULL WHERE owner_id=? AND channel=? AND sender_id=?')
        .run(this.ownerId, input.channel, input.senderId);
    }).immediate();
  }

  /** A model choosing get_balance is not itself evidence of an explicit single-customer read.
   * Only these complete read forms may establish a reference; other read copy stays unchanged. */
  rememberBalance(input: Conversation, text: string, customer: Customer, token: string) {
    const balance = /^(?:what(?:'s| is)?\s+|show(?: me)?\s+|check\s+)?(?:the\s+)?(?:balance\s+(?:of|for)\s+(.+?)|(.+?)(?:'s)?\s+balance)\??$/i.exec(text);
    const owing = /^(?:how much (?:does|do) (.+?) owe(?: me)?|how much (.+?) (?:dey )?owe(?: me)?|what does (.+?) owe(?: me)?)\??$/i.exec(text);
    const name = balance?.[1] ?? balance?.[2] ?? owing?.[1] ?? owing?.[2] ?? owing?.[3];
    if (!name) return;
    const found = this.matches(name.trim());
    if (found.length === 1 && found[0].id === customer.id) this.remember(input, customer, token);
  }

  private matches(name: string): Customer[] {
    // Unlike findCustomer's singular result, retain ALL name/alias collisions for clarification.
    const exact = this.store.findCustomers(this.ownerId, name);
    if (exact.length) return exact;
    const words = name.toLocaleLowerCase().split(/\s+/);
    return this.store.customers(this.ownerId).filter(c => words.every(w => c.name.toLocaleLowerCase().split(/[\s()]+/).some(n => n.startsWith(w))));
  }

  reply(text: string, recentId: string | undefined, lang: Language): MessageReply | undefined {
    const target = draftTarget(text);
    if (!target) return;
    const found = target.name ? this.matches(target.name) : target.pronoun && recentId ? this.store.customers(this.ownerId).filter(c => c.id === recentId) : [];
    if (!found.length) return { replyText: copy.pick(lang,
      'Which saved customer should I draft the reminder for? Please give their name as it appears in your book.',
      'Which customer for your book make I draft reminder for? Abeg give the name as e dey for your book.') };
    if (found.length !== 1) return { replyText: [copy.whichCustomer(lang, target.name ?? ''),
      ...found.slice(0, 10).map(c => `- ${c.name}`),
      copy.pick(lang, 'Please ask for the draft again with the full saved name. If names or aliases clash, use a unique saved name.',
        'Abeg ask for the draft again with the full name for your book. If name or alias clash, use name wey no clash.')].join('\n') };
    const customer = found[0];
    const amount = balances(this.store.events(this.ownerId))[customer.id] ?? 0;
    if (amount <= 0) return { replyText: copy.pick(lang,
      `${customer.name} has no outstanding debt in your saved book. Is there another customer you meant?`,
      `${customer.name} no get debt wey remain for your saved book. Na another customer you mean?`) };
    return { replyText: copy.outstandingDraftText(lang, customer.name, amount) };
  }
}
