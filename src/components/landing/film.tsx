"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { buildFilm, type Caption, type Frame } from "@/components/chat/film";
import { Incoming, Outgoing, PhoneShell, Typing } from "@/components/chat/phone";

const STAGES = [
  { n: "01", t: "Heard", who: "The AI listens" },
  { n: "02", t: "Checked", who: "Kobo shows or asks" },
  { n: "03", t: "Confirmed", who: "You decide" },
  { n: "04", t: "Counted", who: "Code writes the book" },
];

/** Lavender = "Kobo noticed this". Marks the facts it pulled out of what was said. */
function Marked({ text, marks }: { text: string; marks: { text: string; doubt?: boolean }[] }) {
  const parts: React.ReactNode[] = [];
  let rest = text;
  let k = 0;
  for (const m of marks) {
    const i = rest.toLowerCase().indexOf(m.text.toLowerCase());
    if (i < 0) continue;
    parts.push(rest.slice(0, i));
    parts.push(
      <span key={k} className={m.doubt ? "kmark kmark-doubt" : "kmark"} style={{ animationDelay: `${300 + k * 350}ms` }}>
        {rest.slice(i, i + m.text.length)}
        {m.doubt && <sup className="ml-0.5 font-sans text-[12px] not-italic text-owed">?</sup>}
      </span>,
    );
    k++;
    rest = rest.slice(i + m.text.length);
  }
  parts.push(rest);
  return <>{parts}</>;
}

function CaptionView({ c }: { c: Caption }) {
  const label = "font-sans text-[12px] uppercase tracking-[0.12em] text-ink-3";
  switch (c.kind) {
    case "idle":
      return (
        <div>
          <p className={label}>A trader at the stall</p>
          <p className="mt-4 text-[30px] leading-[1.15] tracking-[-0.015em] text-ink-3 lg:text-[36px]">Opens WhatsApp and talks to Kobo…</p>
        </div>
      );
    case "heard":
      return (
        <div>
          <p className={label}>Heard · the AI picks out who, what and how much</p>
          <p className="mt-4 text-[28px] italic leading-[1.25] tracking-[-0.01em] lg:text-[34px]">
            &ldquo;<Marked text={c.text} marks={c.marks} />&rdquo;
          </p>
        </div>
      );
    case "proposal":
      return (
        <div>
          <p className={label}>Checked · what Kobo will write. Nothing saved yet</p>
          <p className="mt-4 text-[30px] leading-none tracking-[-0.015em] lg:text-[36px]">{c.name}</p>
          <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-ink/15 pt-4">
            {c.lines.map((l) => (
              <div key={l.label}>
                <dt className="font-sans text-[13px] text-ink-2">{l.label}</dt>
                <dd className={`tnum mt-1 text-[26px] leading-none lg:text-[32px] ${l.tone === "owed" ? "text-owed" : l.tone === "paid" ? "text-paid" : ""}`}>{l.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "ask":
      return (
        <div>
          <p className={label}>Checked · &ldquo;{c.heard}&rdquo; can be read two ways. Kobo asks</p>
          <p className="tnum mt-4 text-[44px] leading-none tracking-[-0.03em] lg:text-[64px]">
            {c.options[0]} <span className="text-ink-3">or</span> {c.options[1]}?
          </p>
        </div>
      );
    case "tap":
      return (
        <div>
          <p className={label}>Confirmed · only the trader can say yes</p>
          <p className="mt-4 text-[30px] leading-[1.15] tracking-[-0.015em] lg:text-[36px]">
            Tapped <span className="kmark">{c.label}</span>
          </p>
        </div>
      );
    case "saved":
      return (
        <div>
          <p className={label}>Counted · code calculated it, the book is updated</p>
          <p className="mt-4 text-[30px] leading-[1.15] tracking-[-0.015em] lg:text-[36px]">
            {c.name} now owes <span className="tnum text-owed">{c.owes}</span>
          </p>
          <p className="mt-2 font-sans text-[13px] text-ink-3">Entry {c.ref}</p>
        </div>
      );
  }
}

const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export function Film() {
  const frames = useMemo<Frame[]>(() => buildFilm(), []);
  const reduced = useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);
  const [idx, setI] = useState(0);
  const [userPlaying, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // Reduced motion: the finished film as a still until the viewer presses play.
  const [startedByUser, setStarted] = useState(false);
  const still = reduced && !startedByUser;
  const i = still ? frames.length - 1 : idx;
  const playing = userPlaying && !still;
  const f = frames[i];

  // Play only while the film is on screen.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    const id = window.setTimeout(() => setI((x) => (x + 1) % frames.length), f.dur);
    return () => window.clearTimeout(id);
  }, [i, playing, visible, f.dur, frames.length]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: i === 0 ? "auto" : "smooth" });
  }, [i]);

  const lastKobo = [...f.msgs].reverse().find((m) => m.from === "kobo")?.id;
  const elapsed = frames.slice(0, i).reduce((a, x) => a + x.dur, 0);
  const total = frames.reduce((a, x) => a + x.dur, 0);

  return (
    <div ref={root} className="grid gap-12 lg:grid-cols-12 lg:gap-8">
      <div className="flex justify-center lg:col-span-5">
        <PhoneShell label="Film: Kobo in WhatsApp, sample conversation" scrollRef={scroller}>
          {f.msgs.map((m) =>
            m.from === "you" ? (
              <Outgoing key={m.id} m={m} playing={f.playing === m.id} />
            ) : (
              <Incoming key={m.id} view={m.view!} time={m.time} live={!m.settled && m.id === lastKobo} pressed={m.id === lastKobo ? f.pressed : undefined} />
            ),
          )}
          {f.typing && <Typing />}
        </PhoneShell>
      </div>

      <div className="flex min-w-0 flex-col lg:col-span-7">
        <ol className="grid grid-cols-4 gap-2 sm:gap-3">
          {STAGES.map((s, k) => {
            const n = k + 1;
            const state = f.stage === n ? "now" : f.stage > n ? "done" : "next";
            return (
              <li key={s.n} className="relative pt-4">
                <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-ink/15" />
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-[3px] bg-lav transition-[width] duration-500 ease-out"
                  style={{ width: state === "next" ? "0%" : "100%", opacity: state === "done" ? 0.45 : 1 }}
                />
                <span className={`tnum block font-sans text-[12px] ${state === "next" ? "text-ink-3" : "text-ink-2"}`}>{s.n}</span>
                <span className={`mt-1 block text-[15px] leading-tight transition-colors sm:text-[18px] lg:text-[22px] ${state === "now" ? "text-ink" : state === "done" ? "text-ink-2" : "text-ink-3"}`}>
                  {s.t}
                </span>
                <span className="mt-0.5 hidden font-sans text-[12px] text-ink-3 sm:block">{s.who}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 min-h-[190px]" aria-live="polite" key={i}>
          <div className="msg-in">
            <CaptionView c={f.caption} />
          </div>
        </div>

        <div className="mt-10 rounded-[24px] border border-ink/12 bg-[#FAFAF8] p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-sans text-[12px] uppercase tracking-[0.12em] text-ink-3">The book · today</p>
              <p className="mt-2 font-sans text-[13px] text-ink-2">People owe you</p>
            </div>
            <p className="tnum text-[44px] leading-none tracking-[-0.03em] transition-all lg:text-[56px]">{f.owed}</p>
          </div>
          <table className="mt-6 w-full border-t border-ink/12 font-sans text-[14px]">
            <thead className="sr-only">
              <tr><th>Time</th><th>Customer</th><th>Entry</th><th>Amount</th><th>Owes</th></tr>
            </thead>
            <tbody>
              {f.book.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-5 text-ink-3">Nothing written yet. Kobo only writes after you confirm.</td>
                </tr>
              )}
              {f.book.map((r) => (
                <tr key={r.id} className="book-row border-b border-ink/8 last:border-0">
                  <td className="tnum hidden py-3 pr-3 text-ink-3 sm:table-cell">{r.time}</td>
                  <td className="py-3 pr-3 font-serif text-[17px]">{r.name}</td>
                  <td className="py-3 pr-3 text-ink-2">{r.entry === "credit" ? "Credit sale" : r.entry === "paid" ? "Paid" : "Correction"}</td>
                  <td className={`tnum py-3 pr-3 text-right ${r.entry === "credit" ? "text-owed" : "text-paid"}`}>{r.amount}</td>
                  <td className="tnum py-3 text-right text-ink-2">owes {r.owes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center gap-4 font-sans text-[12px] text-ink-3">
          <button
            type="button"
            onClick={() => {
              if (still) {
                setStarted(true);
                setI(0);
                setPlaying(true);
              } else setPlaying((p) => !p);
            }}
            aria-label={playing ? "Pause film" : "Play film"}
            className="flex size-9 items-center justify-center rounded-full border border-ink/20 text-ink hover:bg-ink hover:text-paper"
          >
            {playing ? <Pause className="size-3.5" fill="currentColor" /> : <Play className="size-3.5" fill="currentColor" />}
          </button>
          <span aria-hidden className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-ink/10">
            <span className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-300" style={{ width: `${((elapsed + f.dur) / total) * 100}%` }} />
          </span>
          <button type="button" onClick={() => {
              setStarted(true);
              setI(0);
              setPlaying(true);
            }} className="flex items-center gap-1 hover:text-ink">
            <RotateCcw className="size-3" strokeWidth={2} /> Replay
          </button>
          <span className="hidden sm:inline">Scripted film · sample data · real message formats</span>
        </div>
      </div>
    </div>
  );
}
