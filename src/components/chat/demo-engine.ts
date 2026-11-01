/**
 * SCRIPTED landing-chat engine. Not the real Kobo core.
 *
 * It exists so the design probe can show the real message formats (docs/DESIGN.md section 4)
 * before core ships /api/demo/*. It understands only the tap-to-try phrases; anything else gets
 * the "unknown request" reply. Money is integer kobo and every total is calculated here in code.
 * Swap this module for a client of /api/demo/message when core provides it.
 */
import type { Lang, ReplyView } from "./types";

export const CONFIRMATION_PROMPT = "1 save / 2 edit / 3 cancel";
export const MESSAGE_LIMIT = 12;

const KOBO_PER_NAIRA = 100;
export const naira = (n: number) => n * KOBO_PER_NAIRA;

/** DESIGN.md naira rules: ₦, comma groups, fraction only when non-zero, never abbreviated. */
export function formatNaira(kobo: number): string {
  if (!Number.isSafeInteger(kobo) || kobo < 0) throw new RangeError("invalid kobo amount");
  const whole = Math.floor(kobo / KOBO_PER_NAIRA);
  const frac = kobo % KOBO_PER_NAIRA;
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₦${grouped}${frac ? "." + frac.toString().padStart(2, "0") : ""}`;
}
const plain = (kobo: number) => formatNaira(kobo).slice(1);

interface Entry {
  date: string;
  kind: "credit" | "paid" | "fix";
  amount: number;
  owes: number;
  ref?: string;
}
interface Customer {
  id: string;
  name: string;
  balance: number;
  entries: Entry[];
  lastPaid?: string;
}
type Pending =
  | { kind: "entry"; version: number; customer: string; sale: number; paid: number; heard?: string }
  | { kind: "reversal"; version: number; customer: string; sale: number; paid: number; ref: string };
interface Saved {
  customer: string;
  sale: number;
  paid: number;
  ref: string;
}

export interface DemoState {
  lang: Lang;
  customers: Customer[];
  pending: Pending | null;
  awaiting: { customer: string; heard: string; options: number[]; version: number } | null;
  lastSaved: Saved | null;
  version: number;
  refCounter: number;
}

export function createDemo(lang: Lang = "pcm"): DemoState {
  const c = (id: string, name: string, bal: number, entries: Entry[] = [], lastPaid?: string): Customer => ({
    id,
    name,
    balance: naira(bal),
    entries,
    lastPaid,
  });
  return {
    lang,
    customers: [
      c(
        "mama-chidi",
        "Mama Chidi",
        8500,
        [
          { date: "24 Oct", kind: "paid", amount: naira(5000), owes: naira(8500) },
          { date: "20 Oct", kind: "credit", amount: naira(13500), owes: naira(13500) },
        ],
        "24 Oct",
      ),
      c("bayo", "Bayo", 31800, [], "26 Oct"),
      c("iya-basira", "Iya Basira", 26000, [], "18 Oct"),
      c("emeka", "Emeka (spare parts)", 19800, [], "12 Oct"),
      c("ngozi", "Aunty Ngozi", 12000, [], "30 Oct"),
      c("tunde", "Tunde", 3500, [], "28 Oct"),
    ],
    pending: null,
    awaiting: null,
    lastSaved: null,
    version: 0,
    refCounter: 0,
  };
}

export interface DemoInput {
  text?: string;
  /** True when the text is the transcript of the sample voice note. */
  voice?: boolean;
  /** A button or list row id. */
  action?: string;
  now?: Date;
}
export interface DemoResult {
  state: DemoState;
  replies: ReplyView[];
  /** Counts toward the per-session message limit (plain 1/2/3 and taps do not). */
  counted: boolean;
}

const pick = <T,>(lang: Lang, pcm: T, en: T): T => (lang === "pcm" ? pcm : en);
const totalOwed = (s: DemoState) => s.customers.reduce((a, c) => a + c.balance, 0);
const find = (s: DemoState, id: string) => s.customers.find((c) => c.id === id)!;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
function stamp(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${day(d)}, ${((h + 11) % 12) + 1}:${m}${h < 12 ? "am" : "pm"}`;
}

// ---- views ----------------------------------------------------------------------------------

function text(lang: Lang, body: string, extra: Partial<ReplyView> = {}): ReplyView {
  return { lang, kind: "text", body, ...extra };
}

function reviewView(s: DemoState, p: Pending): ReplyView {
  const lang = s.lang;
  const c = find(s, p.customer);
  const isRev = p.kind === "reversal";
  const lines: string[] = [];
  if (p.sale) lines.push(`- ${pick(lang, "Credit sale", "Credit sale")}: *${formatNaira(p.sale)}*`);
  if (p.paid) lines.push(`- ${pick(lang, "Payment", "Paid now")}: *${formatNaira(p.paid)}*`);
  const heading = isRev
    ? pick(lang, "Make I cancel this entry?", "Reverse this entry?")
    : pick(lang, "Make I write am like this?", "Shall I write it like this?");
  const quote = !isRev && p.heard ? `\n> "${p.heard}"\n` : "";
  // Reversal pending items carry the ORIGINAL amounts; applying one removes their net effect.
  const next = isRev ? c.balance - p.sale + p.paid : c.balance + p.sale - p.paid;
  const balanceLine =
    next === 0
      ? pick(lang, `Before, ${c.name} owe ${formatNaira(c.balance)}. After this, ${c.name} go clear everything.`, `${c.name} owed ${formatNaira(c.balance)} before. After this, ${c.name} will owe nothing.`)
      : pick(
          lang,
          `Before, ${c.name} owe ${formatNaira(c.balance)}. After this, ${c.name} go owe *${formatNaira(next)}*.`,
          `${c.name} owed ${formatNaira(c.balance)} before. After this, ${c.name} will owe *${formatNaira(next)}*.`,
        );
  return {
    lang,
    kind: "buttons",
    body: `${heading}\n${quote}\n*${c.name}*\n${lines.join("\n")}\n\n${balanceLine}`,
    footer: CONFIRMATION_PROMPT,
    buttons: [
      { id: "save", title: "1 Save" },
      { id: "edit", title: "2 Edit" },
      { id: "cancel", title: "3 Cancel" },
    ],
    pendingVersion: p.version,
  };
}

function debtorsView(s: DemoState): ReplyView {
  const lang = s.lang;
  const rows = s.customers.filter((c) => c.balance > 0).sort((a, b) => b.balance - a.balance);
  const list = rows.map((c, i) => `${i + 1}. ${c.name} · *${formatNaira(c.balance)}*`).join("\n");
  if (!rows.length)
    return text(lang, pick(lang, "Nobody owe you now. Your book clean.", "Nobody owes you right now."));
  return {
    lang,
    kind: "list",
    body:
      `*${pick(lang, "Who dey owe you", "Who owes you")}* · ${rows.length} ${pick(lang, "people", "people")}\n` +
      `Total: *${formatNaira(totalOwed(s))}*\n\n${list}\n\n` +
      `_${pick(lang, "Biggest first. Total na from your saved entries.", "Largest first. Totals come from your saved entries.")}_`,
    list: {
      button: pick(lang, "See person", "See customer"),
      rows: rows.map((c) => ({
        id: `customer:${c.id}`,
        title: c.name,
        description: pick(
          lang,
          `Owe ${formatNaira(c.balance)} · last pay ${c.lastPaid ?? "-"}`,
          `Owes ${formatNaira(c.balance)} · last paid ${c.lastPaid ?? "-"}`,
        ),
      })),
    },
  };
}

function historyView(s: DemoState, id: string): ReplyView {
  const lang = s.lang;
  const c = find(s, id);
  const head =
    c.balance === 0
      ? `*${c.name}* · ${pick(lang, "no owe you again", "owes nothing")}`
      : `*${c.name}* · ${pick(lang, "owe", "owes")} *${formatNaira(c.balance)}*`;
  if (!c.entries.length)
    return text(
      lang,
      `${head}\n\n${pick(lang, "The demo book only has entries for Mama Chidi.", "The demo book only has entries for Mama Chidi.")}`,
    );
  const rows = c.entries.slice(0, 8).map((e) => {
    const k = e.kind === "credit" ? "credit" : e.kind === "paid" ? "paid" : "fix";
    return `${e.date.padEnd(6)} ${k.padEnd(6)} ${plain(e.amount).padStart(7)} ${plain(e.owes).padStart(7)}`;
  });
  const header = `${"".padEnd(6)} ${"".padEnd(6)} ${"AMOUNT".padStart(7)} ${"OWES".padStart(7)}`;
  const hasFix = c.entries.some((e) => e.kind === "fix");
  return {
    lang,
    kind: "buttons",
    body:
      `${head}\n\n\`\`\`\n${header}\n${rows.join("\n")}\n\`\`\`\n` +
      (hasFix ? `fix = ${pick(lang, "undo of an entry", "reversal of an entry")}\n` : "") +
      `_${pick(lang, "Last 8 entries. Full book: link to the web book.", "Last 8 entries. Full history: link to the web book.")}_`,
    buttons: [{ id: "debtors", title: pick(lang, "Who dey owe me", "Who owes me") }],
  };
}

// ---- parsing (scripted, deliberately narrow) -------------------------------------------------

const AMOUNT_45 = /(?:\b45\s?k\b|45,?000|forty[\s-]?five\s+thousand)/i;
const AMOUNT_20 = /(?:\b20\s?k\b|20,?000|twenty\s+thousand)/i;

function newPending(s: DemoState, p: Omit<Extract<Pending, { kind: "entry" }>, "version" | "kind">): [DemoState, Pending] {
  const version = s.version + 1;
  const pending: Pending = { kind: "entry", version, ...p };
  return [{ ...s, version, pending, awaiting: null }, pending];
}

function unknown(s: DemoState): ReplyView {
  return text(
    s.lang,
    pick(
      s.lang,
      'I be your book. Tell me who buy, who pay, or ask "who dey owe me".',
      'I keep your book. Tell me who bought, who paid, or ask "who owes me".',
    ),
  );
}

export function step(state: DemoState, input: DemoInput): DemoResult {
  const now = input.now ?? new Date();
  const s = state;
  const lang = s.lang;
  const done = (st: DemoState, replies: ReplyView[], counted = false): DemoResult => ({ state: st, replies, counted });

  // 1. buttons, list rows and plain 1/2/3 choices
  let action = input.action;
  const raw = (input.text ?? "").trim().toLowerCase();
  if (!action) {
    if (/^(1|1 save|save)$/.test(raw)) action = "save";
    else if (/^(2|2 edit|edit)$/.test(raw)) action = "edit";
    else if (/^(3|3 cancel|cancel)$/.test(raw)) action = "cancel";
  }
  if (action === "save" || action === "edit" || action === "cancel") {
    if (s.awaiting)
      return done(s, [text(lang, pick(lang, "Answer the amount question first. I never save anything yet.", "Please answer the amount question first. Nothing is saved yet."))]);
    if (!s.pending)
      return done(s, [
        text(lang, pick(lang, 'Nothing dey wait to save. Tell me wetin happen, like "Bayo pay 5,000".', 'There\'s nothing waiting to save. Tell me what happened, e.g. "Bayo paid 5,000".')),
      ]);
    const p = s.pending;
    if (action === "cancel")
      return done({ ...s, pending: null }, [text(lang, pick(lang, "I no save am. Nothing change for your book.", "Cancelled. Nothing was saved."))]);
    if (action === "edit")
      return done({ ...s, pending: null }, [text(lang, pick(lang, "Okay. Tell me the correct one, talk am or type am.", "Okay. Send the correct details, by voice or text."))]);
    // save: the only place the book changes
    const refCounter = s.refCounter + 1;
    const ref = `K-${refCounter.toString().padStart(4, "0")}`;
    const customers = s.customers.map((c) => {
      if (c.id !== p.customer) return c;
      const dt = day(now);
      if (p.kind === "reversal") {
        const owes = c.balance - p.sale + p.paid;
        return { ...c, balance: owes, entries: [{ date: dt, kind: "fix" as const, amount: p.sale || p.paid, owes, ref }, ...c.entries] };
      }
      let bal = c.balance;
      const entries = [...c.entries];
      if (p.sale) {
        bal += p.sale;
        entries.unshift({ date: dt, kind: "credit", amount: p.sale, owes: bal, ref });
      }
      if (p.paid) {
        bal -= p.paid;
        entries.unshift({ date: dt, kind: "paid", amount: p.paid, owes: bal, ref });
      }
      return { ...c, balance: bal, entries, lastPaid: p.paid ? dt : c.lastPaid };
    });
    const st: DemoState = {
      ...s,
      customers,
      pending: null,
      refCounter,
      lastSaved: p.kind === "reversal" ? null : { customer: p.customer, sale: p.sale, paid: p.paid, ref },
    };
    const cust = find(st, p.customer);
    const saved = p.kind === "reversal" ? pick(lang, "*E don reverse.*", "*Reversed.*") : pick(lang, "*E don enter book.*", "*Saved to your book.*");
    const now2 =
      cust.balance === 0
        ? pick(lang, `${cust.name} don clear everything. E no owe you again.`, `${cust.name} has cleared the balance.`)
        : pick(lang, `${cust.name} now owe you *${formatNaira(cust.balance)}*.`, `${cust.name} now owes you *${formatNaira(cust.balance)}*.`);
    return done(st, [
      {
        lang,
        kind: "buttons",
        body: `${saved}\n${now2}\n\n_Ref ${ref} · ${stamp(now)}_`,
        buttons: [
          { id: "debtors", title: pick(lang, "Who dey owe me", "Who owes me") },
          ...(p.kind === "reversal" ? [] : [{ id: "undo", title: "Undo this" }]),
        ],
      },
    ]);
  }

  if (action === "undo") {
    if (!s.lastSaved) return done(s, [text(lang, pick(lang, "Nothing to undo.", "Nothing to undo."))]);
    const l = s.lastSaved;
    const version = s.version + 1;
    const pending: Pending = { kind: "reversal", version, customer: l.customer, sale: l.sale, paid: l.paid, ref: l.ref };
    return done({ ...s, version, pending }, [reviewView(s, pending)]);
  }

  if (action === "debtors") return done(s, [debtorsView(s)]);
  if (action?.startsWith("customer:")) return done(s, [historyView(s, action.slice(9))]);

  if (action === "amount-other")
    return done(s, [text(lang, pick(lang, "Type the amount with numbers, like 3800.", "Type the amount in numbers, e.g. 3800."))]);

  if (action?.startsWith("amount:") && s.awaiting) {
    const kobo = Number(action.slice(7));
    if (!s.awaiting.options.includes(kobo)) return done(s, [unknown(s)]);
    const [st, p] = newPending(s, { customer: s.awaiting.customer, sale: 0, paid: kobo, heard: undefined });
    return done(st, [reviewView(st, p)]);
  }

  // 2. free text
  const t = input.text ?? "";
  if (!t.trim()) return done(s, [unknown(s)]);

  // typed amount while the flagged question is open
  if (s.awaiting && /^\s*₦?\s*[\d,]+\s*$/.test(t)) {
    const n = Number(t.replace(/[^\d]/g, ""));
    if (Number.isSafeInteger(n) && n > 0) {
      const [st, p] = newPending(s, { customer: s.awaiting.customer, sale: 0, paid: naira(n) });
      return done(st, [reviewView(st, p)], true);
    }
  }

  if (/who\s+(dey\s+)?owe(s)?\s+me|debtors/i.test(t)) return done(s, [debtorsView(s)], true);

  if (/(mama\s+chidi).*(book|history)|(book|history).*(mama\s+chidi)/i.test(t)) return done(s, [historyView(s, "mama-chidi")], true);

  if (/\bbayo\b.*\bthree\s+eight\b/i.test(t)) {
    const heard = "three eight";
    const version = s.version + 1;
    const options = [naira(3800), naira(38000)];
    const st: DemoState = { ...s, version, pending: null, awaiting: { customer: "bayo", heard, options, version } };
    return done(
      st,
      [
        {
          lang,
          kind: "buttons",
          body: pick(
            lang,
            `I ${input.voice ? "hear" : "see"} *"${heard}"* for Bayo payment.\nWhich one be am?`,
            `I ${input.voice ? "heard" : "read"} *"${heard}"* for Bayo's payment.\nWhich amount is it?`,
          ),
          footer: pick(lang, "I never save anything.", "Nothing is saved yet."),
          buttons: [
            ...options.map((o) => ({ id: `amount:${o}`, title: formatNaira(o) })),
            { id: "amount-other", title: "Another amount" },
          ],
          pendingVersion: version,
        },
      ],
      true,
    );
  }

  if (/mama\s+chidi/i.test(t) && AMOUNT_45.test(t) && AMOUNT_20.test(t)) {
    const [st, p] = newPending(s, {
      customer: "mama-chidi",
      sale: naira(45000),
      paid: naira(20000),
      heard: input.voice ? t.trim() : undefined,
    });
    return done(st, [reviewView(st, p)], true);
  }

  if (/iya\s+basira/i.test(t) && /(pay|paid)/i.test(t) && /(everything|all)/i.test(t)) {
    const c = find(s, "iya-basira");
    const [st, p] = newPending(s, { customer: "iya-basira", sale: 0, paid: c.balance });
    return done(st, [reviewView(st, p)], true);
  }

  return done(s, [unknown(s)], true);
}

export const SAMPLE_VOICE = {
  label: "Play a sample voice note",
  transcript: "Mama Chidi carry two bag rice, forty five thousand. She pay twenty thousand now.",
};

export const CHIPS = [
  "Bayo pay me three eight",
  "Mama Chidi carry rice 45k, she pay 20k",
  "Who dey owe me",
  "Show Mama Chidi book",
  "Iya Basira don pay everything",
];
