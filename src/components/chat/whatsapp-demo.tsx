"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, List, Mic, Phone, Play, Plus, RotateCcw, SendHorizontal, Video } from "lucide-react";
import { KoboMark } from "@/components/kobo/logo";
import { CHIPS, MESSAGE_LIMIT, SAMPLE_VOICE, createDemo, step, type DemoInput, type DemoState } from "./demo-engine";
import type { ChatMessage, Lang, ReplyView } from "./types";
import { WaText } from "./wa-text";

/*
 * The landing hero's live demo: Kobo inside WhatsApp on an iPhone. The phone chrome imitates
 * WhatsApp's iOS light theme so judges see the real channel; the replies come from the SCRIPTED
 * demo engine until core ships /api/demo/* (docs/DESIGN.md section 9).
 */

type Msg = ChatMessage & { time?: string };

const WA = {
  wall: "#EFE7DD",
  bar: "#F6F5F3",
  out: "#D9FDD3",
  text: "#111B21",
  meta: "#667781",
  link: "#027EB5",
  ios: "#007AFF",
};

function clock(d = new Date()) {
  const h = d.getHours();
  return `${((h + 11) % 12) + 1}:${d.getMinutes().toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

let seq = 0;
const nid = () => `m${++seq}`;

const opening = (lang: Lang): Msg => ({
  id: "open",
  from: "kobo",
  view: {
    lang,
    kind: "text",
    body:
      lang === "pcm"
        ? "I be your book. Tell me who buy, who pay, or ask *who dey owe me*."
        : "I keep your book. Tell me who bought, who paid, or ask *who owes me*.",
  },
});

export function WhatsAppDemo() {
  const [lang, setLang] = useState<Lang>("pcm");
  const [demo, setDemo] = useState<DemoState>(() => createDemo("pcm"));
  const [messages, setMessages] = useState<Msg[]>(() => [opening("pcm")]);
  const [used, setUsed] = useState(0);
  const [draft, setDraft] = useState("");
  const [sheet, setSheet] = useState<{ msgId: string; view: ReplyView } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const left = MESSAGE_LIMIT - used;
  const atLimit = left <= 0;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function run(input: DemoInput, shown?: Msg) {
    const isChoice = Boolean(input.action) || /^[123]$/.test((input.text ?? "").trim());
    if (atLimit && !isChoice) return;
    const r = step(demo, input);
    const time = clock();
    setDemo(r.state);
    if (r.counted) setUsed((u) => u + 1);
    setSheet(null);
    setMessages((prev) => [
      ...prev.map((m) => (m.view && (m.view.buttons || m.view.list) && !m.settled ? { ...m, settled: true } : m)),
      ...(shown ? [{ ...shown, time }] : []),
      ...r.replies.map((view) => ({ id: nid(), from: "kobo" as const, view, time })),
    ]);
  }

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setDraft("");
    run({ text: t }, { id: nid(), from: "you", text: t });
  };
  const tap = (b: { id: string; title: string }) => run({ action: b.id }, { id: nid(), from: "you", text: b.title });
  const voice = () =>
    run({ text: SAMPLE_VOICE.transcript, voice: true }, { id: nid(), from: "you", text: SAMPLE_VOICE.transcript, voice: true });

  function reset() {
    setDemo(createDemo(lang));
    setMessages([opening(lang)]);
    setUsed(0);
    setDraft("");
    setSheet(null);
  }
  function switchLang(next: Lang) {
    setLang(next);
    setDemo((d) => ({ ...d, lang: next }));
    setMessages((m) => (m.length === 1 ? [opening(next)] : m));
  }

  const lastKobo = [...messages].reverse().find((m) => m.from === "kobo")?.id;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* iPhone */}
      <div
        className="relative h-[620px] w-[300px] shrink-0 rounded-[54px] bg-[#1C1C1E] p-[9px] shadow-[0_30px_60px_-30px_rgba(45,44,42,0.55)] ring-1 ring-black/40 sm:h-[640px] sm:w-[316px]"
        aria-label="Kobo in WhatsApp, interactive demo"
        role="group"
      >
        <span aria-hidden className="absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l bg-[#2a2a2c]" />
        <span aria-hidden className="absolute -left-[3px] top-[170px] h-14 w-[3px] rounded-l bg-[#2a2a2c]" />
        <span aria-hidden className="absolute -right-[3px] top-[180px] h-20 w-[3px] rounded-r bg-[#2a2a2c]" />
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-[45px] font-sans"
          style={{ background: WA.wall, color: WA.text }}
        >
          <span aria-hidden className="absolute left-1/2 top-[10px] z-20 h-[30px] w-[100px] -translate-x-1/2 rounded-full bg-black" />

          {/* status bar */}
          <div className="relative z-10 flex h-[50px] shrink-0 items-end justify-between px-7 pb-1.5 text-[15px] font-semibold" style={{ background: WA.bar }}>
            <span className="tnum">9:41</span>
            <span aria-hidden className="flex items-center gap-1.5">
              <svg width="18" height="11" viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx="1" fill="currentColor" /><rect x="5" y="5" width="3" height="6" rx="1" fill="currentColor" /><rect x="10" y="2.5" width="3" height="8.5" rx="1" fill="currentColor" /><rect x="15" y="0" width="3" height="11" rx="1" fill="currentColor" /></svg>
              <svg width="16" height="11" viewBox="0 0 16 11"><path d="M8 2.2c2.2 0 4.2.9 5.7 2.3l1.1-1.1A9.6 9.6 0 0 0 8 .6 9.6 9.6 0 0 0 1.2 3.4l1.1 1.1A8 8 0 0 1 8 2.2Zm0 3.2c1.3 0 2.5.5 3.4 1.4l1.1-1.1A6.4 6.4 0 0 0 8 3.8c-1.8 0-3.4.7-4.5 1.9l1.1 1.1c.9-.9 2.1-1.4 3.4-1.4Zm0 3.2c-.5 0-1 .2-1.3.6L8 10.4l1.3-1.2A1.8 1.8 0 0 0 8 8.6Z" fill="currentColor" /></svg>
              <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" /><rect x="24" y="4" width="1.5" height="4" rx=".75" fill="currentColor" opacity=".4" /></svg>
            </span>
          </div>

          {/* chat header */}
          <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-black/10 px-1.5" style={{ background: WA.bar }}>
            <ChevronLeft className="size-7" strokeWidth={2} style={{ color: WA.ios }} aria-hidden />
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper">
              <KoboMark className="size-7" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[16px] font-semibold">Kobo</span>
              <span className="block truncate text-[12px]" style={{ color: WA.meta }}>
                Business account
              </span>
            </span>
            <Video className="size-[22px]" strokeWidth={1.75} style={{ color: WA.ios }} aria-hidden />
            <Phone className="mx-2 size-[19px]" strokeWidth={1.75} style={{ color: WA.ios }} aria-hidden />
          </div>

          {/* messages */}
          <div ref={scroller} role="log" aria-live="polite" className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-2.5 py-3">
            <span className="mx-auto mb-1 rounded-md bg-white/85 px-2 py-0.5 text-[12px] font-medium" style={{ color: WA.meta }}>
              Today
            </span>
            {messages.map((m) =>
              m.from === "you" ? (
                <Outgoing key={m.id} m={m} />
              ) : (
                <Incoming
                  key={m.id}
                  view={m.view!}
                  time={m.time}
                  live={!m.settled && m.id === lastKobo}
                  onTap={tap}
                  onList={() => setSheet({ msgId: m.id, view: m.view! })}
                />
              ),
            )}
          </div>

          {/* composer */}
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
            {draft.trim() ? (
              <button type="submit" aria-label="Send" className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ background: WA.ios }}>
                <SendHorizontal className="size-[18px] text-white" strokeWidth={2} />
              </button>
            ) : (
              <button
                type="button"
                onClick={voice}
                disabled={atLimit}
                aria-label="Send the sample voice note"
                title="Send the sample voice note"
                className="flex size-9 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
              >
                <Mic className="size-[22px]" strokeWidth={1.75} style={{ color: WA.ios }} />
              </button>
            )}
          </form>
          <span aria-hidden className="absolute bottom-2 left-1/2 h-[5px] w-[118px] -translate-x-1/2 rounded-full bg-black" />

          {/* list message sheet */}
          {sheet && (
            <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/30" onClick={() => setSheet(null)}>
              <div className="rounded-t-[14px] bg-white pb-8" onClick={(e) => e.stopPropagation()}>
                <div className="relative border-b border-black/10 py-3 text-center text-[16px] font-semibold">
                  {sheet.view.list!.button}
                  <button type="button" onClick={() => setSheet(null)} className="absolute left-3 top-3 text-[15px] font-normal" style={{ color: WA.ios }}>
                    Close
                  </button>
                </div>
                <ul className="max-h-[300px] overflow-y-auto">
                  {sheet.view.list!.rows.map((r) => (
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
          )}
        </div>
      </div>

      {/* controls outside the phone */}
      <div className="w-full max-w-[460px] font-sans">
        <p className="mb-2 text-center text-[13px] text-ink-2">Tap one to try it on the phone</p>
        <div className="flex flex-wrap justify-center gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={atLimit}
              onClick={() => send(c)}
              className="h-9 rounded-full border border-ink/70 bg-transparent px-3.5 text-[13.5px] text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            disabled={atLimit}
            onClick={voice}
            className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13.5px] text-paper disabled:opacity-40"
          >
            <Play className="size-3.5" strokeWidth={2} /> Sample voice note
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 text-[12px] text-ink-2">
          <div role="group" aria-label="Reply language" className="flex rounded-full border border-ink/30 p-0.5">
            {(["pcm", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => switchLang(l)}
                className={`h-7 rounded-full px-3 ${lang === l ? "bg-ink text-paper" : ""}`}
              >
                {l === "pcm" ? "Pidgin" : "English"}
              </button>
            ))}
          </div>
          <span className="tnum">
            Scripted preview · {Math.max(left, 0)}/{MESSAGE_LIMIT} left
          </span>
          <button type="button" onClick={reset} className="flex items-center gap-1 underline-offset-4 hover:underline">
            <RotateCcw className="size-3" strokeWidth={2} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function Ticks() {
  return (
    <svg aria-label="Read" width="16" height="11" viewBox="0 0 16 11" className="inline-block">
      <path d="M11.1 1 5.3 7.9 2.8 5.6 1.9 6.6l3.5 3.2L12 1.9z M15 1.1 9.2 8 8.6 7.5l-.9 1 1.5 1.3L15.9 2z" fill="#53BDEB" />
    </svg>
  );
}

function Outgoing({ m }: { m: Msg }) {
  return (
    <div className="msg-in max-w-[82%] self-end rounded-[14px] rounded-tr-[4px] px-2.5 pb-1 pt-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]" style={{ background: WA.out }}>
      {m.voice ? (
        <div className="flex w-[210px] items-center gap-2 py-1">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#7BA67A]/20">
            <Play className="size-3.5" fill={WA.meta} stroke={WA.meta} />
          </span>
          <span aria-hidden className="flex h-6 flex-1 items-center gap-[2px]">
            {[4, 9, 14, 7, 18, 11, 6, 15, 20, 9, 12, 5, 16, 10, 7, 13, 18, 8, 5, 11, 14, 6].map((h, i) => (
              <span key={i} className="w-[3px] rounded-full bg-[#5C7F5B]/70" style={{ height: h }} />
            ))}
          </span>
          <span className="tnum text-[11px]" style={{ color: WA.meta }}>0:09</span>
        </div>
      ) : (
        <p className="text-[14.5px] leading-[1.35]">{m.text}</p>
      )}
      {m.voice && (
        <p className="mt-1 border-t border-black/10 pt-1 text-[12.5px] italic leading-[1.35]" style={{ color: WA.meta }}>
          Sample transcript (audio not recorded yet): {m.text}
        </p>
      )}
      <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px]" style={{ color: WA.meta }}>
        <span className="tnum">{m.time}</span>
        <Ticks />
      </p>
    </div>
  );
}

function Incoming({
  view,
  time,
  live,
  onTap,
  onList,
}: {
  view: ReplyView;
  time?: string;
  live: boolean;
  onTap: (b: { id: string; title: string }) => void;
  onList: () => void;
}) {
  return (
    <div className="msg-in flex max-w-[86%] flex-col gap-[3px] self-start">
      <div className="rounded-[14px] rounded-tl-[4px] bg-white px-2.5 pb-1 pt-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
        <WaText body={view.body} className="text-[14.5px] leading-[1.38] [&_strong]:font-semibold" />
        {view.footer && (
          <p className="mt-1 text-[12.5px]" style={{ color: WA.meta }}>
            {view.footer}
          </p>
        )}
        {time && (
          <p className="tnum text-right text-[11px]" style={{ color: WA.meta }}>
            {time}
          </p>
        )}
        {view.list && (
          <button
            type="button"
            onClick={onList}
            disabled={!live}
            className="mt-1 flex w-full items-center justify-center gap-1.5 border-t border-black/10 pb-0.5 pt-2 text-[14.5px] font-medium disabled:opacity-50"
            style={{ color: WA.link }}
          >
            <List className="size-4" strokeWidth={2} /> {view.list.button}
          </button>
        )}
      </div>
      {view.buttons?.map((b) => (
        <button
          key={b.id}
          type="button"
          disabled={!live}
          onClick={() => onTap(b)}
          className="tnum rounded-[10px] bg-white py-2 text-center text-[14.5px] font-medium shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] disabled:opacity-55"
          style={{ color: WA.link }}
        >
          {b.title}
        </button>
      ))}
    </div>
  );
}
