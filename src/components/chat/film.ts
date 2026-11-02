/**
 * The hero film: a fixed script played through the scripted demo engine, so every message,
 * balance and total on screen is produced by the same tested code as the interactive demo.
 * Sample data only.
 */
import { SAMPLE_VOICE, createDemo, formatNaira, naira, step, type DemoState } from "./demo-engine";
import type { Msg } from "./phone";

export type Stage = 0 | 1 | 2 | 3 | 4;
export type Caption =
  | { kind: "idle" }
  | { kind: "heard"; text: string; marks: { text: string; doubt?: boolean }[] }
  | { kind: "proposal"; name: string; lines: { label: string; value: string; tone?: "owed" | "paid" }[] }
  | { kind: "ask"; heard: string; options: string[] }
  | { kind: "tap"; label: string }
  | { kind: "saved"; name: string; owes: string; ref: string };
export interface BookRow {
  id: string;
  time: string;
  name: string;
  entry: "credit" | "paid" | "fix";
  amount: string;
  owes: string;
}
export interface Frame {
  msgs: Msg[];
  typing: boolean;
  pressed?: string;
  playing?: string;
  stage: Stage;
  caption: Caption;
  book: BookRow[];
  owed: string;
  dur: number;
}

export function buildFilm(): Frame[] {
  let st: DemoState = createDemo("pcm");
  const msgs: Msg[] = [];
  const book: BookRow[] = [];
  const frames: Frame[] = [];
  let n = 0;
  const t = (m: number) => `4:${String(12 + m).padStart(2, "0")} PM`;
  const owed = () => formatNaira(st.customers.reduce((a, c) => a + c.balance, 0));
  const frame = (f: Omit<Frame, "msgs" | "book" | "owed" | "typing"> & { typing?: boolean }) =>
    frames.push({ msgs: [...msgs], book: [...book], owed: owed(), typing: false, ...f });
  const settle = () => {
    msgs.forEach((m, i) => {
      if (m.view && (m.view.buttons || m.view.list) && !m.settled) msgs[i] = { ...m, settled: true };
    });
  };
  const you = (text: string, time: string, voice = false) => {
    settle();
    const m: Msg = { id: `f${n++}`, from: "you", text, voice, time };
    msgs.push(m);
    return m;
  };
  const run = (input: Parameters<typeof step>[1], minute: number) => {
    const r = step(st, { ...input, now: new Date(2026, 10, 1, 16, 12 + minute) });
    st = r.state;
    return r;
  };
  const kobo = (r: ReturnType<typeof step>, time: string) =>
    r.replies.forEach((view) => msgs.push({ id: `f${n++}`, from: "kobo", view, time }));
  const proposal = (): Caption => {
    const p = st.pending!;
    const c = st.customers.find((x) => x.id === p.customer)!;
    const lines: Extract<Caption, { kind: "proposal" }>["lines"] = [];
    if (p.sale) lines.push({ label: "Credit sale", value: formatNaira(p.sale), tone: "owed" });
    if (p.paid) lines.push({ label: "Paid", value: formatNaira(p.paid), tone: "paid" });
    lines.push({ label: "Will owe", value: formatNaira(c.balance + p.sale - p.paid) });
    return { kind: "proposal", name: c.name, lines };
  };
  const write = (customerId: string, count: number, time: string) => {
    const c = st.customers.find((x) => x.id === customerId)!;
    c.entries
      .slice(0, count)
      .reverse()
      .forEach((e) => book.push({ id: `r${book.length}`, time, name: c.name, entry: e.kind, amount: formatNaira(e.amount), owes: formatNaira(e.owes) }));
  };
  const saved = (customerId: string): Caption => {
    const c = st.customers.find((x) => x.id === customerId)!;
    return { kind: "saved", name: c.name, owes: formatNaira(c.balance), ref: `K-${String(st.refCounter).padStart(4, "0")}` };
  };

  frame({ stage: 0, caption: { kind: "idle" }, dur: 1200 });

  // Scene A: a sale on credit with a part payment.
  const a = SAMPLE_VOICE.transcript;
  const va = you(a, t(0), true);
  const heardA: Caption = { kind: "heard", text: a, marks: [{ text: "Mama Chidi" }, { text: "two bag rice" }, { text: "forty five thousand" }, { text: "twenty thousand" }] };
  frame({ stage: 1, caption: heardA, playing: va.id, dur: 3400 });
  frame({ stage: 1, caption: heardA, typing: true, dur: 900 });
  kobo(run({ text: a, voice: true }, 0), t(0));
  frame({ stage: 2, caption: proposal(), dur: 3600 });
  frame({ stage: 3, caption: { kind: "tap", label: "1 Save" }, pressed: "save", dur: 900 });
  you("1 Save", t(1));
  const ra = run({ action: "save" }, 1);
  frame({ stage: 3, caption: { kind: "tap", label: "1 Save" }, typing: true, dur: 700 });
  kobo(ra, t(1));
  write("mama-chidi", 2, t(1));
  frame({ stage: 4, caption: saved("mama-chidi"), dur: 3600 });

  // Scene B: an ambiguous amount. Kobo asks instead of guessing.
  const b = "Bayo pay me three eight";
  const vb = you(b, t(2), true);
  const heardB: Caption = { kind: "heard", text: b, marks: [{ text: "Bayo" }, { text: "three eight", doubt: true }] };
  frame({ stage: 1, caption: heardB, playing: vb.id, dur: 2800 });
  frame({ stage: 1, caption: heardB, typing: true, dur: 900 });
  const askR = run({ text: b, voice: true }, 2);
  kobo(askR, t(2));
  const options = askR.replies[0].buttons!.filter((x) => x.id.startsWith("amount:")).map((x) => x.title);
  frame({ stage: 2, caption: { kind: "ask", heard: "three eight", options }, dur: 4200 });
  const pick = `amount:${naira(3800)}`;
  frame({ stage: 3, caption: { kind: "tap", label: formatNaira(naira(3800)) }, pressed: pick, dur: 900 });
  you(formatNaira(naira(3800)), t(3));
  const rb = run({ action: pick }, 3);
  frame({ stage: 3, caption: { kind: "tap", label: formatNaira(naira(3800)) }, typing: true, dur: 700 });
  kobo(rb, t(3));
  frame({ stage: 2, caption: proposal(), dur: 3000 });
  frame({ stage: 3, caption: { kind: "tap", label: "1 Save" }, pressed: "save", dur: 900 });
  you("1 Save", t(3));
  const rs = run({ action: "save" }, 3);
  frame({ stage: 3, caption: { kind: "tap", label: "1 Save" }, typing: true, dur: 700 });
  kobo(rs, t(3));
  write("bayo", 1, t(3));
  frame({ stage: 4, caption: saved("bayo"), dur: 6000 });

  return frames;
}
