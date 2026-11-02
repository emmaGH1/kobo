import { CONFIRMATION_PROMPT, type InteractiveReply } from '../core/contract';

/**
 * User-facing copy from docs/DESIGN.md (design branch) section 4, plus the section 3 naira rules.
 * Display only: nothing here feeds arithmetic. Strings marked "not in design" are minimal
 * additions where the approved copy has no wording; they must be reviewed with the rest
 * (the design requires a native Pidgin speaker to check all Pidgin before launch).
 */
export type Language = 'en' | 'pg';

/** Section 3: `₦3,800`, kobo only when non-zero, never abbreviated. Negative is used only for net summaries. */
export function formatNaira(kobo: number): string {
  if (!Number.isSafeInteger(kobo)) throw new Error('Invalid amount');
  const abs = Math.abs(kobo);
  const whole = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = abs % 100;
  return `${kobo < 0 ? '-' : ''}₦${whole}${fraction ? `.${String(fraction).padStart(2, '0')}` : ''}`;
}
const bold = (s: string) => `*${s}*`;
export const pick = <T,>(lang: Language, en: T, pg: T): T => (lang === 'pg' ? pg : en);

// Confident Pidgin markers only. Anything unsure is English (section 4 general rules).
const PIDGIN = /\b(dey|wetin|abeg|wahala|wey|una|sabi|comot|pikin|nawa|abi|oya|biko|sef)\b|\b(?:e|i|im|dem) (?:don|no|go|dey)\b|\bmake i\b|\bna so\b|\bhow far\b|\b(?:pay|owe|carry|collect|give|buy|write|save) am\b/i;
/** 'pg' or 'en' when the message itself is conclusive, otherwise undefined (caller keeps the thread's language). */
export function detectLanguage(text: string): Language | undefined {
  if (PIDGIN.test(text)) return 'pg';
  const words = text.match(/\p{L}{2,}/gu) ?? [];
  return words.length >= 2 ? 'en' : undefined;
}
export function languageCommand(text: string): Language | undefined {
  const t = text.trim().toLowerCase();
  return t === 'english' ? 'en' : t === 'pidgin' ? 'pg' : undefined;
}
export const languageSet = (l: Language) => pick(l, 'Okay. I will reply in English.', 'Okay. I go reply you for Pidgin.'); // not in design

const cut = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);
export const button = (id: string, title: string) => ({ id, title: cut(title, 20) });

// ---- 4.1 review ----
export interface ReviewLine { kind: 'sale' | 'payment' | 'opening_debt' | 'purchase'; amount: string; due?: string; calculated?: boolean; description?: string }
export interface ReviewGroup { name: string; isNew: boolean; lines: ReviewLine[]; before?: number; after?: number }
function lineText(l: Language, line: ReviewLine): string {
  const label = line.kind === 'sale' ? pick(l, 'Credit sale', 'Credit sale')
    : line.kind === 'payment' ? pick(l, 'Paid now', 'Pay now')
    : line.kind === 'opening_debt' ? pick(l, 'Debt from before', 'Old debt')
    : pick(l, `Stock bought (${line.description ?? 'unknown stock'})`, `Stock wey you buy (${line.description ?? 'unknown stock'})`); // purchase wording not in design
  const due = line.due ? pick(l, `, due ${line.due}`, `, pay day ${line.due}`) : ''; // not in design
  const calc = line.calculated ? pick(l, ' (calculated as sale total minus stated unpaid amount)', ' (I work am out: sale total minus wetin remain)') : ''; // not in design
  return `- ${label}: ${bold(line.amount)}${due}${calc}`;
}
/** The before/after sentence uses balances calculated by code. The design's "she" is replaced by neutral wording. */
function balanceSentence(l: Language, g: ReviewGroup): string {
  if (g.after === undefined) return '';
  const before = g.before ?? 0;
  const a = g.after;
  const had = before > 0 ? pick(l, `They owed ${formatNaira(before)} before. `, `Before, im owe ${formatNaira(before)}. `) : '';
  if (a > 0) return had + pick(l, `After this they will owe ${bold(formatNaira(a))}.`, `After this, im go owe ${bold(formatNaira(a))}.`);
  if (a === 0) return had + pick(l, 'After this they will owe nothing.', 'After this, e don clear.');
  return had + pick(l, `After this they will have ${bold(formatNaira(-a))} credit with you.`, `After this, im go get ${bold(formatNaira(-a))} credit with you.`); // not in design
}
export function reviewText(l: Language, groups: ReviewGroup[], note?: string): string {
  const head = pick(l, 'Shall I write it like this?', 'Make I write am like this?');
  const body = groups.map(g => [`${bold(g.name)}${g.isNew ? pick(l, ' (new customer)', ' (new customer)') : ''}`, ...g.lines.map(x => lineText(l, x)), ...(balanceSentence(l, g) ? ['', balanceSentence(l, g)] : [])].join('\n')).join('\n\n');
  return `${head}\n\n${body}\n\n${note ? `${note}\n\n` : ''}${CONFIRMATION_PROMPT}`;
}
export const blockedNote = (l: Language, flags: string[]) => pick(l,
  `I can't save this yet: ${flags.join('; ')}\nChoose 2 to edit and send the corrected details.`,
  `I no fit save am yet: ${flags.join('; ')}\nChoose 2 to edit, then send the correct details.`); // not in design
export function reviewInteractive(l: Language, id: string, body: string, blocked: boolean): InteractiveReply {
  // A blocked review has no Save button; typed `1` is refused by the same check anyway.
  return { kind: 'buttons', body: cut(body.replace(`\n\n${CONFIRMATION_PROMPT}`, ''), 1024), footer: CONFIRMATION_PROMPT, buttons: [...(blocked ? [] : [button(`save:${id}`, '1 Save')]), button(`edit:${id}`, '2 Edit'), button(`cancel:${id}`, '3 Cancel')] };
}
export const editPrompt = (l: Language) => pick(l, 'Okay. Send the correct details, by voice or text.', 'Okay. Tell me the correct one, talk am or type am.');
export const cancelled = (l: Language) => pick(l, 'Cancelled. Nothing was saved.', 'I no save am. Nothing change for your book.');

// ---- 4.2 / 4.5 questions ----
const noun = (l: Language, kind: string, name: string) => {
  const what = kind === 'sale' ? pick(l, 'sale', 'sale') : kind === 'payment' ? pick(l, 'payment', 'payment') : kind === 'opening_debt' ? pick(l, 'old debt', 'old debt') : pick(l, 'stock purchase', 'stock purchase');
  return kind === 'purchase' ? 'the stock purchase' : pick(l, `${name}'s ${what}`, `${name} ${what}`);
};
export const questionFooter = (l: Language) => pick(l, 'Nothing is saved yet.', 'I never save anything.');
export const anotherAmount = (l: Language) => pick(l, 'Another amount', 'Another amount');
export const typeAmountPrompt = (l: Language) => pick(l, 'Type the amount in numbers, e.g. 3800.', 'Type the amount with numbers, like 3800.');
export function amountQuestionText(l: Language, a: { kind: string; name: string; source?: string; candidates: number[] }): string {
  if (!a.source) {
    const ask = a.kind === 'payment' ? pick(l, `How much did ${a.name} pay?`, `How much ${a.name} pay?`) // not in design
      : a.kind === 'purchase' ? pick(l, 'How much was the stock purchase?', 'How much be the stock purchase?') // not in design
      : pick(l, `How much does ${a.name} owe?`, `How much ${a.name} owe?`);
    return `${ask} ${pick(l, 'Type or say the amount.', 'Type am or talk am.')}`;
  }
  const heard = pick(l, `I heard ${bold(`"${a.source}"`)} for ${noun(l, a.kind, a.name)}.`, `I hear ${bold(`"${a.source}"`)} for ${noun(l, a.kind, a.name)}.`);
  if (a.candidates.length === 2) {
    return `${heard}\n${pick(l, 'Which amount is it?', 'Which one be am?')}\n${a.candidates.map((c, i) => `${i + 1}. ${formatNaira(c)}`).join('\n')}\n3. ${anotherAmount(l)}`;
  }
  return `${heard}\n${typeAmountPrompt(l)}`;
}
export const dateQuestion = (l: Language, name: string) => pick(l, `Which day will ${name} pay? Use YYYY-MM-DD, today, tomorrow or a weekday.`, `Which day ${name} go pay? Use YYYY-MM-DD, today, tomorrow or weekday name.`); // not in design
export const customerQuestion = (l: Language, name: string) => pick(l, `Which ${name} do you mean?`, `Which ${name} you mean?`);
export const newCustomer = (l: Language) => pick(l, 'New customer', 'New customer');
export function questionInteractive(id: string, body: string, l: Language, options: { value: string; label: string; description?: string }[], list: boolean): InteractiveReply | undefined {
  if (!options.length) return undefined;
  if (!list) return { kind: 'buttons', body: cut(body, 1024), footer: cut(questionFooter(l), 60), buttons: options.slice(0, 3).map(o => button(`answer:${id}:${o.value}`, o.label)) };
  return { kind: 'list', body: cut(body, 1024), footer: cut(questionFooter(l), 60), listButton: pick(l, 'Choose', 'Choose'), rows: options.slice(0, 10).map(o => ({ id: `answer:${id}:${o.value}`, title: cut(o.label, 24), ...(o.description ? { description: cut(o.description, 72) } : {}) })) };
}
export const owesDescription = (l: Language, kobo: number) => kobo > 0 ? pick(l, `Owes ${formatNaira(kobo)}`, `Owe ${formatNaira(kobo)}`) : pick(l, 'Owes nothing', 'E don clear');

// ---- 4.3 saved ----
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** `1 Nov, 4:12pm` in Lagos (UTC+01:00 year-round). */
export function lagosStamp(ms: number): string {
  const d = new Date(ms + 3600000);
  const h = d.getUTCHours();
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${((h + 11) % 12) + 1}:${String(d.getUTCMinutes()).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
}
export const refLabel = (n: number) => `K-${String(n).padStart(4, '0')}`;
export function savedText(l: Language, rows: { name: string; balance: number }[], purchase: { description: string; amount: number } | undefined, ref: string, at: number): string {
  const lines = purchase
    ? [pick(l, `Stock bought: ${purchase.description} · ${bold(formatNaira(purchase.amount))}`, `Stock wey you buy: ${purchase.description} · ${bold(formatNaira(purchase.amount))}`)] // not in design
    : rows.map(r => r.balance > 0 ? pick(l, `${r.name} now owes you ${bold(formatNaira(r.balance))}.`, `${r.name} now owe you ${bold(formatNaira(r.balance))}.`)
      : r.balance === 0 ? pick(l, `${r.name} has cleared the balance.`, `${r.name} don clear everything. Im no owe you again.`)
      : pick(l, `${r.name} now has ${bold(formatNaira(-r.balance))} credit with you.`, `${r.name} now get ${bold(formatNaira(-r.balance))} credit with you.`)); // credit wording not in design
  return `${bold(pick(l, 'Saved to your book.', 'E don enter book.'))}\n${lines.join('\n')}\n\n_Ref ${ref} · ${lagosStamp(at)}_`;
}
export const whoOwesLabel = (l: Language) => pick(l, 'Who owes me', 'Who dey owe me');
export const savedInteractive = (l: Language, body: string): InteractiveReply => ({ kind: 'buttons', body: cut(body, 1024), buttons: [button('query:debtors', whoOwesLabel(l))] });

// ---- 4.4 debtors ----
export function debtorsText(l: Language, rows: { name: string; balance: number }[]): string {
  if (!rows.length) return pick(l, 'Nobody owes you right now.', 'Nobody owe you now. Your book clean.');
  const total = rows.reduce((t, r) => t + r.balance, 0);
  const people = pick(l, `${rows.length} ${rows.length === 1 ? 'person' : 'people'}`, `${rows.length} ${rows.length === 1 ? 'person' : 'people'}`);
  return [`${bold(pick(l, 'Who owes you', 'Who dey owe you'))} · ${people}`, `Total: ${bold(formatNaira(total))}`, '', ...rows.map((r, i) => `${i + 1}. ${r.name} · ${bold(formatNaira(r.balance))}`), '', pick(l, '_Largest first. Totals come from your saved entries._', '_Biggest first. Total na from your saved entries._')].join('\n');
}
// ---- 4.5 customer history ----
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** `24 Oct` in Lagos. */
export function lagosDay(ms: number): string {
  const d = new Date(ms + 3600000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
/** `Mon 2 Nov` in Lagos. */
export function lagosDayWithWeekday(ms: number): string {
  return `${WEEKDAYS[new Date(ms + 3600000).getUTCDay()]} ${lagosDay(ms)}`;
}
export interface HistoryLine { at: number; kind: 'sale' | 'payment' | 'opening_debt' | 'reversal'; amount: number; balance: number; /** Reference of the undone entry, for a reversal. */ undoes?: string }
const grouped = (kobo: number) => formatNaira(Math.abs(kobo)).replace('₦', '');
/** Section 4.5: newest first, at most 8 rows, monospace block 29 characters wide for normal amounts. */
export function historyText(l: Language, name: string, balance: number, lines: HistoryLine[]): string {
  const head = balance > 0 ? `${bold(name)} · ${pick(l, 'owes', 'owe')} ${bold(formatNaira(balance))}`
    : balance === 0 ? `${bold(name)} · ${pick(l, 'owes nothing', 'e don clear')}`
    : `${bold(name)} · ${pick(l, 'has credit', 'get credit')} ${bold(formatNaira(-balance))}`; // credit wording not in design
  const label = (k: HistoryLine['kind']) => k === 'payment' ? 'paid' : k === 'sale' ? 'credit' : k === 'opening_debt' ? 'old' : 'fix'; // "old" for opening debt is not in design
  const shown = lines.slice(-8).reverse();
  if (!shown.length) return `${head}

${pick(l, '_No entries yet._', '_Nothing dey inside yet._')}`; // not in design
  const rows = shown.map(r => `${lagosDay(r.at).padEnd(6)} ${label(r.kind).padEnd(6)}${grouped(r.amount).padStart(8)}${grouped(r.balance).padStart(8)}`);
  const fixes = [...new Set(shown.filter(r => r.kind === 'reversal' && r.undoes).map(r => r.undoes!))];
  const foot = pick(l, `_Last ${shown.length} entries._`, `_Last ${shown.length} entries._`); // design adds a web-book link; none exists yet
  return [head, '', '```', `${'AMOUNT'.padStart(21)}${'OWES'.padStart(8)}`, ...rows, '```', foot, ...fixes.map(f => `_fix = undo of ${f}_`)].join('\n');
}
export const pickLabel = (l: Language) => pick(l, 'See customer', 'See person');
export const whichCustomer = (l: Language, typed: string) => pick(l, `Which ${typed} do you mean?`, `Which ${typed} you mean?`);

// ---- 4.12 day summary in chat, 4.6 daily template body ----
export interface DaySummary { at: number; entries: number; creditKobo: number; collectedKobo: number; stockKobo: number; owedKobo: number; biggest?: { name: string; balance: number } }
export function summaryText(l: Language, s: DaySummary): string {
  const out = [`${bold(pick(l, 'Your book today', 'Your book today'))} · ${lagosDayWithWeekday(s.at)}`,
    `- ${pick(l, 'Credit sales', 'Credit sales')}: ${bold(formatNaira(s.creditKobo))}`,
    `- ${pick(l, 'Money you collected', 'Money wey you collect')}: ${bold(formatNaira(s.collectedKobo))}`,
    `- ${pick(l, 'Stock you bought', 'Stock wey you buy')}: ${bold(formatNaira(s.stockKobo))}`,
    pick(l, `People owe you ${bold(formatNaira(s.owedKobo))}`, `People owe you ${bold(formatNaira(s.owedKobo))}`)];
  if (s.biggest) out.push(`${pick(l, 'Biggest', 'Biggest')}: ${s.biggest.name} · ${bold(formatNaira(s.biggest.balance))}`);
  out.push('', pick(l, `_From the ${s.entries} ${s.entries === 1 ? 'entry' : 'entries'} you confirmed today._`, `_Na from the ${s.entries} ${s.entries === 1 ? 'entry' : 'entries'} wey you confirm today._`));
  return out.join('\n');
}
/** Section 4.6 body for the Meta utility template. Variables {{1}}..{{5}} are filled with these values. */
export function summaryTemplateBody(l: Language, s: DaySummary): string {
  return pick(l,
    `Your book for ${lagosDayWithWeekday(s.at)}: ${s.entries} entries. Credit given ${formatNaira(s.creditKobo)}, collected ${formatNaira(s.collectedKobo)}. People owe you ${formatNaira(s.owedKobo)} in total.`,
    `Your book for today, ${lagosDayWithWeekday(s.at)}: ${s.entries} entries. You give credit ${formatNaira(s.creditKobo)}, you collect ${formatNaira(s.collectedKobo)}. People still owe you ${formatNaira(s.owedKobo)}.`);
}
export const summaryButtons = (l: Language) => [button('query:debtors', whoOwesLabel(l))];

export const balanceText = (l: Language, name: string, balance: number) =>
  balance > 0 ? `${bold(name)} · ${pick(l, 'owes', 'owe')} ${bold(formatNaira(balance))}`
  : balance === 0 ? `${bold(name)} · ${pick(l, 'owes nothing', 'e don clear')}`
  : `${bold(name)} · ${pick(l, 'has credit', 'get credit')} ${bold(formatNaira(-balance))}`; // not in design

/** Recorded debt age, not a claim about lateness or the original age of imported debt. */
export function customerMemory(l: Language, balance: number, days?: number, paid?: number): string {
  const age = balance > 0 && days !== undefined ? pick(l, `Owing for ${days} ${days===1?'day':'days'} in this book`, `E don owe for ${days} ${days===1?'day':'days'} for this book`) : pick(l,'No unpaid balance','No debt remain');
  return `${age}${paid===undefined?'':pick(l, ` · last paid ${lagosDay(paid)}`, ` · last pay ${lagosDay(paid)}`)}`;
}

export function stockReview(l:Language,v:{name:string;unit:string;before:number;after:number;delta:number;reorderAt:number}) {
  return [pick(l,'Shall I record this stock movement?','Make I record this stock movement?'),`*${v.name}* · ${v.unit}`,`${pick(l,'Recorded before','Before for book')}: ${v.before}`,`${pick(l,'Change','Change')}: ${v.delta>0?'+':''}${v.delta}`,`${pick(l,'After','After')}: ${v.after}`,`${pick(l,'Low-stock threshold','Low-stock level')}: ${v.reorderAt}`,pick(l,'Quantity only. This does not record a sale or purchase amount.','Na quantity only. This one no record sale or purchase money.')].join('\n');
}
export function stockText(l:Language,rows:{name:string;unit:string;left:number;reorderAt:number;low:boolean}[]) {
  if(!rows.length)return pick(l,'No stock quantities recorded. Use "stock in: rice: bag: 5: reorder 2". Purchase spending alone does not tell me quantities left.','No stock quantity for book. Use "stock in: rice: bag: 5: reorder 2". Money wey you spend no tell me stock wey remain.');
  return [`*${pick(l,'Recorded stock left','Stock wey remain for book')}*`,...rows.map(r=>`${r.name}: *${r.left} ${r.unit}*${r.low?pick(l,' · LOW',' · LOW'):''} · ${pick(l,'reorder at','reorder at')} ${r.reorderAt}`),'',pick(l,'From confirmed quantity movements only. Purchases and sales do not adjust stock automatically.','Na confirmed quantity movements only. Purchase and sale no change stock by itself.')].join('\n');
}
export function insightsText(l:Language,s:{since:number;until:number;creditKobo:number;collectedKobo:number;stockKobo:number;payments:{name:string;paidKobo:number;payments:number}[]}) {
  return [`*${pick(l,'Last 7 days in your book','Last 7 days for your book')}* · ${lagosDay(s.since)} – ${lagosDay(s.until)}`,`Credit sales: *${formatNaira(s.creditKobo)}*`,`${pick(l,'Collected','Wetin you collect')}: *${formatNaira(s.collectedKobo)}*`,`${pick(l,'Stock bought','Stock wey you buy')}: *${formatNaira(s.stockKobo)}*`,'',pick(l,'Top customer payments (net of corrections):','Customer payments wey big pass (after corrections):'),...(s.payments.length?s.payments.map(c=>`${c.name} · *${formatNaira(c.paidKobo)}* · ${c.payments} ${pick(l,'payment entries','payment entries')}`):[pick(l,'No positive collections recorded in this period.','No positive collection for this period.')]),'',pick(l,'No product-sales ranking or profit estimate: item-level revenue and costs are not recorded. Payment entries are not customer visits.','No product-sales ranking or profit estimate: item revenue and cost no dey book. Payment entries no be customer visits.')].join('\n');
}

// ---- 4.10 / 4.11 reminders (generic purchase wording: item data isn't always recorded) ----
export function dueReminder(l:Language,name:string,amount:number,total:number,date:string,at:number):string {
  const day=lagosDayWithWeekday(Date.parse(`${date}T07:00:00Z`));
  const when = new Date(Date.now()+3600000).toISOString().slice(0,10)===date ? 'today' : `on ${day}`;
  return [pick(l,`*Reminder* · ${day}`,`*Reminder* · ${day}`),pick(l,`${name} is due to pay *${formatNaira(amount)}* ${when}, for the credit purchase recorded on ${lagosDay(at)}.`,`${name} suppose pay *${formatNaira(amount)}* ${when}, for wetin e carry wey enter book on ${lagosDay(at)}.`),pick(l,`They still owe you *${formatNaira(total)}* in total.`,`E still owe you *${formatNaira(total)}* for total.`),'',pick(l,'Kobo never messages your customers itself.','Kobo no dey message your customers by itself.')].join('\n');
}
export function draftedReminder(l:Language,name:string,amount:number,date:string):string {
  // Do not invent a shop name or description that the ledger does not hold.
  return [pick(l,`Copy this and send it to ${name}:`,`Copy am send to ${name}:`),pick(l,`> Good morning ${name}. A small reminder that the ${formatNaira(amount)} balance for your credit purchase was due on ${lagosDay(Date.parse(`${date}T07:00:00Z`))}. Thank you.`,`> Good morning ${name}. Small reminder say the ${formatNaira(amount)} balance for wetin you carry dey due on ${lagosDay(Date.parse(`${date}T07:00:00Z`))}. Thank you, God bless.`),'',pick(l,'You send it. Nothing goes out without you.','Na you go send am. Nothing go out without you.')].join('\n');
}

// ---- 4.7 errors and edge states ----
export const errors = {
  down: (l: Language) => pick(l, 'Something went wrong on my side. *Nothing was saved.* Please try again shortly.', 'Something spoil for my side. *I never save anything.* Try again small time.'),
  nothingPending: (l: Language) => pick(l, `There's nothing waiting to save. Tell me what happened, e.g. "Bayo paid 5,000".`, 'Nothing dey wait to save. Tell me wetin happen, like "Bayo pay 5,000".'),
  stale: (l: Language) => pick(l, "That draft was replaced. Here's the latest one:", 'That one don change. Na this one be the latest, check am:'),
  expired: (l: Language) => pick(l, "That draft expired, so it wasn't saved. Please send it again.", 'That entry wait too long so I no save am. Send am again.'),
  twoDrafts: (l: Language) => pick(l, 'You have two unsaved drafts. Which one?', 'You get two entries wey never save. Which one?'),
  unknown: (l: Language) => pick(l, 'I keep your book. Tell me who bought, who paid, or ask "who owes me".', 'I be your book. Tell me who buy, who pay, or ask "who dey owe me".'),
};
export const help = (l: Language) => pick(l,
  'I keep your book. For example:\n- "Bayo paid 5,000"\n- "Mama Chidi took rice, 45,000 on credit"\n- "who owes me"\nType Pidgin to switch language.',
  'I be your book. For example:\n- "Bayo pay 5,000"\n- "Mama Chidi carry rice, 45,000 for credit"\n- "who dey owe me"\nType English to switch language.'); // wording not in design
