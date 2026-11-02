/**
 * The hero film: a trader's day in six chapters, played through the scripted demo engine so
 * every message, balance and total on screen comes from the same tested code. Sample data only.
 */
import {
  SAMPLE_VOICE,
  STOCK_VOICE,
  createDemo,
  dayTotals,
  dueReminders,
  formatNaira,
  naira,
  reminderDraft,
  step,
  withOpening,
  type DemoState,
  type OpeningBalance,
} from "./demo-engine";
import type { Msg } from "./phone";

export const CHAPTERS = [
  { t: "Stock bought", when: "7:52 AM" },
  { t: "Sold on credit", when: "12:10 PM" },
  { t: "Unclear amount", when: "3:40 PM" },
  { t: "Who owes me", when: "6:05 PM" },
  { t: "Day’s summary", when: "8:00 PM" },
  { t: "Reminder", when: "Friday" },
] as const;

export type Caption =
  | { kind: "idle" }
  | { kind: "opening"; rows: { name: string; amount: string }[]; total: string }
  | { kind: "heard"; text: string; marks: { text: string; doubt?: boolean }[] }
  | { kind: "proposal"; title: string; lines: { label: string; value: string; tone?: "owed" | "paid" | "out" }[] }
  | { kind: "ask"; heard: string; options: string[] }
  | { kind: "tap"; label: string }
  | { kind: "saved"; line: string; tone?: "owed" | "out"; amount: string; note?: string }
  | { kind: "debtors"; rows: { name: string; amount: string }[]; total: string }
  | { kind: "summary"; figures: { label: string; value: string; tone?: "owed" | "paid" | "out" }[] }
  | { kind: "reminder"; name: string; amount: string; date: string }
  | { kind: "draft"; to: string; text: string };

import type { BookRow } from "@/components/demo/types";
export type { BookRow };
/** The signature motion: marked words in Kobo's review bubble fly into the new book rows. */
export interface Fly {
  msg: string;
  items: { text: string; row: string; part: "name" | "amount" }[];
}
export interface Frame {
  chapter: number;
  /** Bold words Kobo picked out in the review bubble `msg`, shown with the lavender mark. */
  marks?: { msg: string; words: string[] };
  /** Set on the frame where confirmed rows are written. */
  fly?: Fly;
  msgs: Msg[];
  typing: boolean;
  pressed?: string;
  playing?: string;
  caption: Caption;
  book: BookRow[];
  stats: { collected: string; stock: string; owed: string };
  reminders: { date: string; name: string; amount: string }[];
  dur: number;
}

const DAY = (h: number, m: number) => new Date(2026, 10, 2, h, m); // Monday 2 Nov 2026
const FRI = (h: number, m: number) => new Date(2026, 10, 6, h, m);
const clock = (d: Date) => `${((d.getHours() + 11) % 12) + 1}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() < 12 ? "AM" : "PM"}`;

/** What the trader carried over from the paper notebook, confirmed once before the day starts. */
export const FILM_OPENING: OpeningBalance[] = [
  { id: "mama-chidi", name: "Mama Chidi", amount: naira(8500) },
  { id: "bayo", name: "Bayo", amount: naira(31800) },
  { id: "iya-basira", name: "Iya Basira", amount: naira(26000) },
];

export function buildFilm(): Frame[] {
  // The book starts empty at ₦0. Every total on screen is backed by confirmed rows.
  let st: DemoState = createDemo("pcm", []);
  const msgs: Msg[] = [];
  const book: BookRow[] = [];
  const frames: Frame[] = [];
  let n = 0;
  let chapter = 0;

  const stats = () => {
    const t = dayTotals(st, DAY(12, 0));
    return { collected: formatNaira(t.collected), stock: formatNaira(t.stock), owed: formatNaira(t.owed) };
  };
  const reminders = () =>
    st.customers.filter((c) => c.due && c.balance > 0).map((c) => ({ date: c.due!.label, name: c.name, amount: formatNaira(c.due!.amount) }));
  const frame = (f: { caption: Caption; dur: number; typing?: boolean; pressed?: string; playing?: string; marks?: Frame["marks"]; fly?: Fly }) =>
    frames.push({ chapter, msgs: [...msgs], book: [...book], stats: stats(), reminders: reminders(), typing: false, ...f });
  const settle = () =>
    msgs.forEach((m, i) => {
      if (m.view && (m.view.buttons || m.view.list) && !m.settled) msgs[i] = { ...m, settled: true };
    });
  const you = (text: string, at: Date, voice = false) => {
    settle();
    const m: Msg = { id: `f${n++}`, from: "you", text, voice, time: clock(at) };
    msgs.push(m);
    return m;
  };
  const run = (input: Parameters<typeof step>[1], at: Date) => {
    const r = step(st, { ...input, now: at });
    st = r.state;
    return r;
  };
  const kobo = (views: ReturnType<typeof step>["replies"], at: Date) => views.forEach((view) => msgs.push({ id: `f${n++}`, from: "kobo", view, time: clock(at) }));
  const customer = (id: string) => st.customers.find((c) => c.id === id)!;
  /** The last Kobo message: the review bubble the trader is about to confirm. */
  const lastKoboId = () => [...msgs].reverse().find((m) => m.from === "kobo")!.id;
  type Plan = { marks: NonNullable<Frame["marks"]>; items: { text: string; part: "name" | "amount"; rowOffset: number }[] };
  /** Confirm, then write the book rows in the same frame the totals change; the marked words fly in. */
  const tapSave = (at: Date, write: () => void, plan: Plan) => {
    frame({ caption: { kind: "tap", label: "1 Save" }, pressed: "save", marks: plan.marks, dur: 900 });
    you("1 Save", at);
    const r = run({ action: "save" }, at);
    const before = book.length;
    write();
    const fly: Fly = { msg: plan.marks.msg, items: plan.items.map((it) => ({ text: it.text, part: it.part, row: book[before + it.rowOffset].id })) };
    frame({ caption: { kind: "tap", label: "1 Save" }, typing: true, marks: plan.marks, fly, dur: 700 });
    kobo(r.replies, at);
    return r;
  };

  frame({ caption: { kind: "idle" }, dur: 1200 });

  // Opening balances: carried in from the notebook and confirmed, shown as rows first.
  st = withOpening(st, FILM_OPENING);
  for (const o of FILM_OPENING)
    book.push({ id: `r${book.length}`, time: "Sun 1 Nov", name: o.name, entry: "opening", amount: formatNaira(o.amount), owes: formatNaira(o.amount) });
  frame({
    caption: { kind: "opening", rows: FILM_OPENING.map((o) => ({ name: o.name, amount: formatNaira(o.amount) })), total: formatNaira(FILM_OPENING.reduce((a, o) => a + o.amount, 0)) },
    dur: 3400,
  });

  // 1. Stock bought: money out.
  let at = DAY(7, 52);
  const v1 = you(STOCK_VOICE, at, true);
  const heard1: Caption = { kind: "heard", text: STOCK_VOICE, marks: [{ text: "five bag rice" }, { text: "Alhaji" }, { text: "two hundred and ninety thousand" }, { text: "cash" }] };
  frame({ caption: heard1, playing: v1.id, dur: 3400 });
  frame({ caption: heard1, typing: true, dur: 800 });
  kobo(run({ text: STOCK_VOICE, voice: true }, at).replies, at);
  const m1 = { msg: lastKoboId(), words: ["5 bag rice", formatNaira(naira(290000))] };
  frame({ caption: { kind: "proposal", title: "Stock bought", lines: [{ label: "5 bag rice · Alhaji", value: formatNaira(naira(290000)), tone: "out" }, { label: "Paid", value: "Cash, in full" }] }, marks: m1, dur: 3000 });
  at = DAY(7, 53);
  tapSave(at, () => book.push({ id: `r${book.length}`, time: clock(at), name: "5 bag rice · Alhaji", entry: "stock", amount: formatNaira(naira(290000)) }), {
    marks: m1,
    items: [
      { text: "5 bag rice", part: "name", rowOffset: 0 },
      { text: formatNaira(naira(290000)), part: "amount", rowOffset: 0 },
    ],
  });
  frame({ caption: { kind: "saved", line: "Stock bought today", amount: stats().stock, tone: "out" }, dur: 2800 });

  // 2. Sold on credit with a promised date.
  chapter = 1;
  at = DAY(12, 10);
  const v2 = you(SAMPLE_VOICE.transcript, at, true);
  const heard2: Caption = { kind: "heard", text: SAMPLE_VOICE.transcript, marks: [{ text: "Mama Chidi" }, { text: "two bag rice" }, { text: "forty five thousand" }, { text: "twenty thousand" }, { text: "Friday" }] };
  frame({ caption: heard2, playing: v2.id, dur: 3800 });
  frame({ caption: heard2, typing: true, dur: 800 });
  kobo(run({ text: SAMPLE_VOICE.transcript, voice: true }, at).replies, at);
  const p2 = st.pending as Extract<DemoState["pending"], { kind: "entry" }>;
  const m2 = { msg: lastKoboId(), words: ["Mama Chidi", formatNaira(p2.sale), formatNaira(p2.paid)] };
  frame({
    marks: m2,
    caption: {
      kind: "proposal",
      title: "Mama Chidi",
      lines: [
        { label: "Credit sale", value: formatNaira(p2.sale), tone: "owed" },
        { label: "Paid now", value: formatNaira(p2.paid), tone: "paid" },
        { label: `Due ${p2.due!.label}`, value: formatNaira(p2.due!.amount) },
      ],
    },
    dur: 3600,
  });
  at = DAY(12, 11);
  tapSave(
    at,
    () =>
      customer("mama-chidi")
        .entries.slice(0, 2)
        .reverse()
        .forEach((e) => book.push({ id: `r${book.length}`, time: clock(at), name: "Mama Chidi", entry: e.kind, amount: formatNaira(e.amount), owes: formatNaira(e.owes) })),
    {
      marks: m2,
      items: [
        { text: "Mama Chidi", part: "name", rowOffset: 0 },
        { text: formatNaira(p2.sale), part: "amount", rowOffset: 0 },
        { text: formatNaira(p2.paid), part: "amount", rowOffset: 1 },
      ],
    },
  );
  frame({ caption: { kind: "saved", line: "Mama Chidi now owes", amount: formatNaira(customer("mama-chidi").balance), tone: "owed", note: `Reminder set for ${p2.due!.label}` }, dur: 3200 });

  // 3. Unclear amount: Kobo asks instead of guessing.
  chapter = 2;
  at = DAY(15, 40);
  const b = "Bayo pay me three eight";
  const v3 = you(b, at, true);
  const heard3: Caption = { kind: "heard", text: b, marks: [{ text: "Bayo" }, { text: "three eight", doubt: true }] };
  frame({ caption: heard3, playing: v3.id, dur: 2600 });
  frame({ caption: heard3, typing: true, dur: 800 });
  const ask = run({ text: b, voice: true }, at);
  kobo(ask.replies, at);
  const options = ask.replies[0].buttons!.filter((x) => x.id.startsWith("amount:")).map((x) => x.title);
  frame({ caption: { kind: "ask", heard: "three eight", options }, dur: 4000 });
  const pick = `amount:${naira(3800)}`;
  frame({ caption: { kind: "tap", label: formatNaira(naira(3800)) }, pressed: pick, dur: 900 });
  you(formatNaira(naira(3800)), at);
  const r3 = run({ action: pick }, at);
  frame({ caption: { kind: "tap", label: formatNaira(naira(3800)) }, typing: true, dur: 700 });
  kobo(r3.replies, at);
  const m3 = { msg: lastKoboId(), words: ["Bayo", formatNaira(naira(3800))] };
  frame({ marks: m3, caption: { kind: "proposal", title: "Bayo", lines: [{ label: "Paid", value: formatNaira(naira(3800)), tone: "paid" }, { label: "Will owe", value: formatNaira(customer("bayo").balance - naira(3800)) }] }, dur: 2400 });
  at = DAY(15, 41);
  tapSave(at, () => book.push({ id: `r${book.length}`, time: clock(at), name: "Bayo", entry: "paid", amount: formatNaira(naira(3800)), owes: formatNaira(customer("bayo").balance) }), {
    marks: m3,
    items: [
      { text: "Bayo", part: "name", rowOffset: 0 },
      { text: formatNaira(naira(3800)), part: "amount", rowOffset: 0 },
    ],
  });
  frame({ caption: { kind: "saved", line: "Bayo now owes", amount: formatNaira(customer("bayo").balance), tone: "owed" }, dur: 2600 });

  // 4. Who owes me.
  chapter = 3;
  at = DAY(18, 5);
  settle();
  you("Who dey owe me", at);
  frame({ caption: { kind: "tap", label: "Who dey owe me" }, typing: true, dur: 1100 });
  kobo(run({ text: "Who dey owe me" }, at).replies, at);
  const debtors = [...st.customers].filter((c) => c.balance > 0).sort((x, y) => y.balance - x.balance);
  frame({ caption: { kind: "debtors", rows: debtors.slice(0, 4).map((c) => ({ name: c.name, amount: formatNaira(c.balance) })), total: formatNaira(dayTotals(st, at).owed) }, dur: 4200 });

  // 5. Day's summary, sent by Kobo in the evening.
  chapter = 4;
  at = DAY(20, 0);
  settle();
  frame({ caption: { kind: "idle" }, typing: true, dur: 900 });
  kobo(run({ action: "summary" }, at).replies, at);
  const t = dayTotals(st, at);
  frame({
    caption: {
      kind: "summary",
      figures: [
        { label: "Credit sales", value: formatNaira(t.credit), tone: "owed" },
        { label: "Collected", value: formatNaira(t.collected), tone: "paid" },
        { label: "Stock bought", value: formatNaira(t.stock), tone: "out" },
        { label: "People owe you", value: formatNaira(t.owed) },
      ],
    },
    dur: 4600,
  });

  // 6. Friday morning: Kobo reminds the trader and drafts a message for them to send.
  chapter = 5;
  at = FRI(8, 0);
  settle();
  msgs.push({ id: `f${n++}`, from: "date", text: "Friday" });
  frame({ caption: { kind: "idle" }, typing: true, dur: 1000 });
  kobo(dueReminders(st, at), at);
  const due = customer("mama-chidi").due!;
  frame({ caption: { kind: "reminder", name: "Mama Chidi", amount: formatNaira(due.amount), date: due.label }, dur: 3600 });
  frame({ caption: { kind: "tap", label: "Draft message" }, pressed: "remind-draft:mama-chidi", dur: 900 });
  you("Draft message", at);
  const r6 = run({ action: "remind-draft:mama-chidi" }, at);
  frame({ caption: { kind: "tap", label: "Draft message" }, typing: true, dur: 800 });
  kobo(r6.replies, at);
  frame({ caption: { kind: "draft", to: "Mama Chidi", text: reminderDraft(st, "mama-chidi") }, dur: 6500 });

  return frames;
}

/** Index of the first frame of each chapter, for the chapter buttons. */
export function chapterStarts(frames: Frame[]): number[] {
  return CHAPTERS.map((_, c) => frames.findIndex((f) => f.chapter === c));
}
