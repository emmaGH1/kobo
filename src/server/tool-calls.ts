import { z } from 'zod';

/** A model may identify stated facts, but it cannot authorize or calculate a ledger write. */
const factSchema = z.object({
  kind: z.enum(['sale', 'payment', 'opening_debt']),
  customer_name: z.string().trim().min(1).max(200).nullable(),
  // This is the exact amount text from the message, not a model-computed number.
  amount_text: z.string().trim().min(1).max(100).nullable(),
}).strict();
const entrySchema = z.object({
  kind: z.enum(['sale', 'payment', 'opening_debt', 'purchase']),
  customer_name: z.string().trim().min(1).max(200).nullable(),
  description: z.string().trim().min(1).max(200).nullable(),
  amount_text: z.string().trim().min(1).max(100).nullable(),
  evidence_text: z.string().trim().min(1).max(1000),
  due_date_text: z.string().trim().min(1).max(100).nullable(),
}).strict();
const args = {
  record_entries: z.object({ entries: z.array(entrySchema).min(1).max(20) }).strict(),
  record_facts: z.object({ facts: z.array(factSchema).min(1).max(20) }).strict(),
  record_purchase: z.object({ description: z.string().trim().min(1).max(200).nullable(), amount_text: z.string().trim().min(1).max(100).nullable() }).strict(),
  list_debtors: z.object({}).strict(),
  get_balance: z.object({ customer_name: z.string().trim().min(1).max(200) }).strict(),
  daily_summary: z.object({}).strict(),
} as const;
export type ParsedToolCall =
  | { name: 'record_entries'; args: z.infer<typeof args.record_entries> }
  | { name: 'record_facts'; args: z.infer<typeof args.record_facts> }
  | { name: 'record_purchase'; args: z.infer<typeof args.record_purchase> }
  | { name: 'list_debtors'; args: z.infer<typeof args.list_debtors> }
  | { name: 'get_balance'; args: z.infer<typeof args.get_balance> }
  | { name: 'daily_summary'; args: z.infer<typeof args.daily_summary> };

/** Accept exactly one completed known call; never act on partial, malformed or multiple calls. */
export function parseToolResponse(response: unknown): ParsedToolCall {
  const result = z.object({ status: z.literal('completed'), output: z.array(z.unknown()) }).safeParse(response);
  if (!result.success) throw new Error('Invalid or incomplete model response');
  const calls = result.data.output.filter(item => typeof item === 'object' && item !== null && 'type' in item && item.type === 'function_call');
  if (calls.length !== 1) throw new Error('Expected exactly one tool call');
  const call = z.object({ name: z.string(), arguments: z.string().max(10000), status: z.literal('completed') }).safeParse(calls[0]);
  if (!call.success || !(call.data.name in args)) throw new Error('Invalid tool call');
  let raw: unknown;
  try { raw = JSON.parse(call.data.arguments); } catch { throw new Error('Invalid tool arguments'); }
  switch (call.data.name) {
    case 'record_entries': return { name: 'record_entries', args: args.record_entries.parse(raw) };
    case 'record_facts': return { name: 'record_facts', args: args.record_facts.parse(raw) };
    case 'record_purchase': return { name: 'record_purchase', args: args.record_purchase.parse(raw) };
    case 'list_debtors': return { name: 'list_debtors', args: args.list_debtors.parse(raw) };
    case 'get_balance': return { name: 'get_balance', args: args.get_balance.parse(raw) };
    case 'daily_summary': return { name: 'daily_summary', args: args.daily_summary.parse(raw) };
    default: throw new Error('Unknown tool');
  }
}

/** Strict numeric naira only, directly present in input; all shorthand remains unresolved. */
export function statedAmountKobo(amountText: string | null, input: string): number | undefined {
  if (!amountText || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amountText)) return;
  const escaped = amountText.replace('.', '\\.');
  if (!new RegExp(`(?<![\\d.])${escaped}(?![\\d.])`).test(input)) return;
  const [whole, fraction = ''] = amountText.split('.');
  const amount = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, '0'));
  if (amount <= BigInt(0) || amount > BigInt(Number.MAX_SAFE_INTEGER)) return;
  return Number(amount);
}

/** Preliminary flags only: presence does not establish meaning or authorize a ledger write. */
export function factFlags(fact: z.infer<typeof factSchema>, input: string): string[] {
  const flags: string[] = [];
  if (!fact.customer_name || !input.toLocaleLowerCase().includes(fact.customer_name.toLocaleLowerCase())) flags.push('Customer missing or not stated');
  if (statedAmountKobo(fact.amount_text, input) === undefined) flags.push('Amount missing, ambiguous or not stated');
  return flags;
}
