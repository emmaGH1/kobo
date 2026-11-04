"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { CalendarClock, RotateCcw, SendHorizontal, Mic, Plus } from "lucide-react";
import { createChatBackend, type ChatInput } from "./backend";
import { Incoming, Outgoing, PhoneShell, Typing, WA, type Msg } from "./phone";
import type { Lang, ReplyView } from "./types";

/*
 * "Your turn": the interactive phone. It talks only to the ChatBackend in ./backend.ts, which is
 * the single place the scripted engine gets replaced by core's /api/demo/* (docs/DESIGN.md §9).
 */

function clock(d = new Date()) {
  const h = d.getHours();
  return `${((h + 11) % 12) + 1}:${d.getMinutes().toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
let seq = 0;
const nid = () => `t${++seq}`;
const settle = (list: Msg[]) => list.map((m) => (m.view && (m.view.buttons || m.view.list) && !m.settled ? { ...m, settled: true } : m));
const failure = (lang: Lang): ReplyView => ({
  lang,
  kind: "text",
  body:
    lang === "pcm"
      ? "Something spoil for my side. *I never save anything.* Try again small time."
      : "Something went wrong on my side. *Nothing was saved.* Please try again shortly.",
});

export function WhatsAppDemo({ intro }: { intro: ReactNode }) {
  const [backend] = useState(() => createChatBackend("pcm"));
  const [lang, setLang] = useState<Lang>("pcm");
  const [messages, setMessages] = useState<Msg[]>(() => [{ id: "open", from: "kobo", view: backend.greeting("pcm") }]);
  const [remaining, setRemaining] = useState(backend.limit);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [sheet, setSheet] = useState<ReplyView | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const atLimit = remaining <= 0;
  const CHIPS = backend.suggestions;

  // Show core's count on load (a reload keeps the session's allowance), not a fresh 12.
  useEffect(() => {
    let live = true;
    void backend.sync().then((n) => live && setRemaining(n));
    return () => {
      live = false;
    };
  }, [backend]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function run(input: ChatInput, shown?: Msg) {
    const choice = Boolean(input.action) || /^[123]$/.test((input.text ?? "").trim());
    if (busy || (atLimit && !choice)) return;
    const time = backend.clockLabel() ?? clock();
    setSheet(null);
    setMessages((prev) => [...settle(prev), ...(shown ? [{ ...shown, time }] : [])]);
    setBusy(true);
    try {
      const r = await backend.send(input);
      setRemaining(r.remaining);
      setMessages((prev) => [...prev, ...r.replies.map((view) => ({ id: nid(), from: "kobo" as const, view, time }))]);
    } catch {
      setMessages((prev) => [...prev, { id: nid(), from: "kobo", view: failure(lang), time: clock() }]);
    } finally {
      setBusy(false);
    }
  }
  /** Demo only: jump to Friday morning and show what Kobo sends by itself (wired through backend.ts). */
  async function skipToFriday() {
    if (busy) return;
    setSheet(null);
    setBusy(true);
    try {
      const r = await backend.skipToFriday();
      const time = backend.clockLabel() ?? clock();
      setRemaining(r.remaining);
      setMessages((prev) => [
        ...settle(prev),
        { id: nid(), from: "date", text: r.dateLabel },
        ...r.replies.map((view) => ({ id: nid(), from: "kobo" as const, view, time })),
      ]);
    } catch {
      setMessages((prev) => [...prev, { id: nid(), from: "kobo", view: failure(lang), time: clock() }]);
    } finally {
      setBusy(false);
    }
  }
  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setDraft("");
    void run({ text: t }, { id: nid(), from: "you", text: t });
  };
  const tap = (b: { id: string; title: string }) => void run({ action: b.id }, { id: nid(), from: "you", text: b.title });
  const voice = () => {
    const sample = backend.sampleVoice;
    if (sample) void run({ text: sample.transcript, voice: true }, { id: nid(), from: "you", text: sample.transcript, voice: true });
  };
  async function reset() {
    const r = await backend.reset();
    setRemaining(r.remaining);
    setMessages([{ id: "open", from: "kobo", view: backend.greeting(lang) }]);
    setDraft("");
    setSheet(null);
  }
  function switchLang(next: Lang) {
    setLang(next);
    backend.setLanguage(next);
    setMessages((m) => (m.length === 1 ? [{ id: "open", from: "kobo", view: backend.greeting(next) }] : m));
  }
  const lastKobo = [...messages].reverse().find((m) => m.from === "kobo")?.id;

  const composer = (
    <form
      className="flex shrink-0 items-center gap-2 border-t border-black/10 px-2 pb-6 pt-2"
      style={{ background: WA.bar }}
      onSubmit={(e) => {
        e.preventDefault();
        send(draft);
      }}
    >
      <Plus className="size-6 shrink-0" strokeWidth={1.75} style={{ color: WA.ios }} aria-hidden />
      <input
        value={draft}
        disabled={atLimit}
        onChange={(e) => setDraft(e.target.value)}
        aria-label="Message Kobo"
        placeholder={atLimit ? "Demo finished" : "Message"}
        className="h-9 min-w-0 flex-1 rounded-full border border-black/10 bg-white px-3.5 text-[15px] outline-none placeholder:text-[#8696A0] focus-visible:ring-2 focus-visible:ring-[#007AFF]/40"
      />
      {draft.trim() || !backend.sampleVoice ? (
        <button type="submit" aria-label="Send" disabled={!draft.trim()} className="flex size-9 shrink-0 items-center justify-center rounded-full disabled:opacity-40" style={{ background: WA.ios }}>
          <SendHorizontal className="size-[18px] text-white" strokeWidth={2} />
        </button>
      ) : (
        <button type="button" onClick={voice} disabled={atLimit} aria-label="Send the sample voice note" className="flex size-9 shrink-0 items-center justify-center rounded-full disabled:opacity-40">
          <Mic className="size-[22px]" strokeWidth={1.75} style={{ color: WA.ios }} />
        </button>
      )}
    </form>
  );

  const overlay = sheet && (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/30" onClick={() => setSheet(null)}>
      <div className="rounded-t-[14px] bg-white pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="relative border-b border-black/10 py-3 text-center text-[16px] font-semibold">
          {sheet.list!.button}
          <button type="button" onClick={() => setSheet(null)} className="absolute left-3 top-3 text-[15px] font-normal" style={{ color: WA.ios }}>Close</button>
        </div>
        <ul className="max-h-[300px] overflow-y-auto">
          {sheet.list!.rows.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => tap({ id: r.id, title: r.title })} className="flex w-full items-center justify-between gap-3 border-b border-black/5 px-4 py-2.5 text-left">
                <span>
                  <span className="block text-[15px]">{r.title}</span>
                  <span className="block text-[12.5px]" style={{ color: WA.meta }}>{r.description}</span>
                </span>
                <span aria-hidden className="size-5 shrink-0 rounded-full border-2 border-black/20" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="grid items-center gap-12 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-6">
        {intro}
        <ul className="mt-10 border-t border-ink/15 font-sans">
          {CHIPS.map((c, i) => (
            <li key={c} className="border-b border-ink/15">
              <button
                type="button"
                disabled={atLimit}
                onClick={() => send(c)}
                className="group flex w-full items-baseline gap-5 py-4 text-left disabled:opacity-40"
              >
                <span className="tnum w-6 shrink-0 text-[13px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 font-serif text-[22px] leading-tight tracking-[-0.01em] text-ink transition-colors group-hover:text-lav-ink">
                  &ldquo;{c}&rdquo;
                </span>
                <span aria-hidden className="text-[13px] text-ink-3 transition-transform group-hover:translate-x-1">Send →</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 font-sans text-[13px] text-ink-2">
          {backend.sampleVoice && (
            <button type="button" onClick={voice} disabled={atLimit} className="h-10 rounded-full bg-ink px-4 text-paper disabled:opacity-40">
              Send the sample voice note
            </button>
          )}
          <div role="group" aria-label="Reply language" className="flex rounded-full border border-ink/25 p-0.5">
            {(["pcm", "en"] as const).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => switchLang(l)} className={`h-8 rounded-full px-3 ${lang === l ? "bg-ink text-paper" : ""}`}>
                {l === "pcm" ? "Pidgin" : "English"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void skipToFriday()}
            disabled={busy}
            title="Demo only: move the clock to Friday morning to see reminders"
            className="flex h-10 items-center gap-1.5 rounded-full border border-ink/30 px-4 text-ink hover:border-ink disabled:opacity-40"
          >
            <CalendarClock className="size-4" strokeWidth={1.5} /> Skip to Friday
          </button>
          <span className="tnum" title="Only replies that need the AI count. Lookups, saves and button taps are free.">
            {Math.max(remaining, 0)} of {backend.limit} AI replies left
          </span>
          <button type="button" onClick={reset} className="flex items-center gap-1 underline-offset-4 hover:underline">
            <RotateCcw className="size-3" strokeWidth={2} /> Reset
          </button>
        </div>
      </div>
      <div className="flex justify-center lg:col-span-5 lg:col-start-8">
        <PhoneShell label="Kobo in WhatsApp, try it yourself" scrollRef={scroller} composer={composer} overlay={overlay}>
          {messages.map((m) =>
            m.from === "date" ? (
              <span key={m.id} className="msg-in mx-auto my-1 shrink-0 rounded-md bg-white/85 px-2 py-0.5 text-[12px] font-medium" style={{ color: WA.meta }}>
                {m.text}
              </span>
            ) : m.from === "you" ? (
              <Outgoing key={m.id} m={m} transcriptNote="Sample transcript (audio not recorded yet)" />
            ) : (
              <Incoming key={m.id} view={m.view!} time={m.time} live={!m.settled && m.id === lastKobo} onTap={tap} onList={() => setSheet(m.view!)} />
            ),
          )}
          {busy && <Typing />}
          {messages.length === 1 && (
            <span className="msg-in mx-auto mt-2 shrink-0 rounded-full bg-white/70 px-3 py-1 text-center text-[12.5px]" style={{ color: WA.meta }}>
              <span className="lg:hidden">Tap a message above, or type your own</span>
              <span className="hidden lg:inline">Tap a message on the left, or type your own</span>
            </span>
          )}
        </PhoneShell>
      </div>
    </div>
  );
}
