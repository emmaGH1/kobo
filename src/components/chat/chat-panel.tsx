"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHIPS, MESSAGE_LIMIT, SAMPLE_VOICE, createDemo, step, type DemoInput, type DemoState } from "./demo-engine";
import type { ChatMessage, Lang, ReplyView } from "./types";
import { WaText } from "./wa-text";

function opening(lang: Lang): ChatMessage {
  return {
    id: "open",
    from: "kobo",
    view: {
      lang,
      kind: "text",
      body: "Tell me who buy or who pay.\nTell me who bought or who paid.",
    },
  };
}

let seq = 0;
const nid = () => `m${++seq}`;

export function ChatPanel({ className = "" }: { className?: string }) {
  const [lang, setLang] = useState<Lang>("pcm");
  const [demo, setDemo] = useState<DemoState>(() => createDemo("pcm"));
  const [messages, setMessages] = useState<ChatMessage[]>(() => [opening("pcm")]);
  const [used, setUsed] = useState(0);
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const left = MESSAGE_LIMIT - used;
  const atLimit = left <= 0;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages]);

  function run(input: DemoInput, shown?: ChatMessage) {
    if (atLimit && !input.action && !/^[123]$/.test((input.text ?? "").trim())) return;
    const r = step(demo, input);
    setDemo(r.state);
    if (r.counted) setUsed((u) => u + 1);
    setMessages((prev) => {
      // anything answered or superseded loses its buttons
      const settled = prev.map((m) => (m.view?.buttons && !m.settled ? { ...m, settled: true } : m));
      const replies: ChatMessage[] = r.replies.map((view) => ({ id: nid(), from: "kobo", view }));
      return [...settled, ...(shown ? [shown] : []), ...replies];
    });
  }

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setDraft("");
    run({ text: t }, { id: nid(), from: "you", text: t });
  }

  function tap(btn: { id: string; title: string }) {
    run({ action: btn.id }, { id: nid(), from: "you", text: btn.title });
  }

  function playSample() {
    run(
      { text: SAMPLE_VOICE.transcript, voice: true },
      { id: nid(), from: "you", text: SAMPLE_VOICE.transcript, voice: true },
    );
  }

  function reset() {
    setDemo(createDemo(lang));
    setMessages([opening(lang)]);
    setUsed(0);
    setDraft("");
  }

  function switchLang(next: Lang) {
    setLang(next);
    setDemo((d) => ({ ...d, lang: next }));
  }

  const lastKoboId = useMemo(() => [...messages].reverse().find((m) => m.from === "kobo")?.id, [messages]);

  return (
    <section
      aria-label="Try Kobo"
      className={`flex flex-col overflow-hidden rounded-lg border border-rule bg-sunken shadow-[0_1px_0_var(--rule)] ${className}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-rule bg-paper px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold leading-5">Kobo · demo book</h2>
          <p className="font-mono text-[11px] uppercase leading-4 tracking-[0.06em] text-ink-2">
            Scripted preview · sample data
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <div role="group" aria-label="Language" className="flex rounded-[4px] border border-rule">
            {(["pcm", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => switchLang(l)}
                className={`h-9 min-w-11 px-2 text-[13px] ${lang === l ? "bg-ink text-paper" : "text-ink-2"}`}
              >
                {l === "pcm" ? "Pidgin" : "English"}
              </button>
            ))}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={reset} aria-label="Reset demo" className="size-9 rounded-[4px]">
            <RotateCcw className="size-4" strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      <div ref={scroller} className="ruled flex-1 space-y-3 overflow-y-auto px-3 py-4" role="log" aria-live="polite">
        {messages.map((m) =>
          m.from === "you" ? (
            <div key={m.id} className="msg-in ml-auto max-w-[85%] rounded-[12px_2px_12px_12px] bg-biro-soft px-3 py-2">
              {m.voice && (
                <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">
                  Voice note · sample transcript, audio not recorded yet
                </p>
              )}
              <p className="text-[16px] leading-7">{m.text}</p>
            </div>
          ) : (
            <KoboMessage
              key={m.id}
              view={m.view!}
              live={!m.settled && m.id === lastKoboId}
              onTap={tap}
            />
          ),
        )}
      </div>

      <div className="border-t border-rule bg-paper">
        <div className="flex gap-2 overflow-x-auto px-3 pt-3 [scrollbar-width:none]">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={atLimit}
              onClick={() => send(c)}
              className="h-9 shrink-0 rounded-md border border-rule bg-paper px-3 text-[14px] text-ink hover:border-ink-3 disabled:opacity-50"
            >
              {c}
            </button>
          ))}
        </div>
        {atLimit ? (
          <p className="px-4 py-4 text-[15px] leading-6">
            That&apos;s the end of the demo for this session. The real Kobo lives in WhatsApp.{" "}
            <button type="button" onClick={reset} className="text-biro underline underline-offset-4">
              Start again
            </button>
          </p>
        ) : (
          <form
            className="flex items-center gap-2 px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={lang === "pcm" ? "Tell me wetin happen…" : "Tell me what happened…"}
              aria-label="Message Kobo"
              className="h-11 flex-1 rounded-[4px] border-rule bg-paper text-[16px]"
            />
            <Button type="submit" aria-label="Send" className="size-11 rounded-[4px] bg-biro text-paper hover:bg-biro/90">
              <ArrowUp className="size-5" strokeWidth={1.75} />
            </Button>
          </form>
        )}
        <div className="flex items-center justify-between border-t border-rule px-4 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">
          <button type="button" onClick={playSample} disabled={atLimit} className="flex items-center gap-2 text-ink underline-offset-4 hover:underline disabled:opacity-50">
            <Play className="size-3.5" strokeWidth={1.75} /> {SAMPLE_VOICE.label}
          </button>
          <span className="tnum">{Math.max(left, 0)} of {MESSAGE_LIMIT} left</span>
        </div>
      </div>
    </section>
  );
}

function KoboMessage({
  view,
  live,
  onTap,
}: {
  view: ReplyView;
  live: boolean;
  onTap: (b: { id: string; title: string }) => void;
}) {
  return (
    <div className="msg-in max-w-[92%]">
      <div className="rounded-[2px_12px_12px_12px] border-l-2 border-biro bg-paper px-3 py-2">
        <WaText body={view.body} />
        {view.footer && (
          <p className="mt-2 border-t border-rule pt-2 font-mono text-[12px] tracking-[0.02em] text-ink-2">{view.footer}</p>
        )}
      </div>
      {view.buttons && (
        <div className="mt-2 flex flex-wrap gap-2">
          {view.buttons.map((b) => (
            <Button
              key={b.id}
              type="button"
              variant="outline"
              disabled={!live}
              onClick={() => onTap(b)}
              className="h-11 rounded-[4px] border-ink/60 bg-paper px-4 text-[15px] font-semibold tnum disabled:opacity-40"
            >
              {b.title}
            </Button>
          ))}
        </div>
      )}
      {view.list && (
        <ul className="mt-2 divide-y divide-rule rounded-lg border border-rule bg-paper">
          {view.list.rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                disabled={!live}
                onClick={() => onTap({ id: r.id, title: r.title })}
                className="flex min-h-11 w-full items-baseline justify-between gap-3 px-3 py-2 text-left disabled:opacity-60"
              >
                <span className="text-[15px]">{r.title}</span>
                <span className="tnum text-[14px] font-semibold text-owed">{r.description?.match(/₦[\d,.]+/)?.[0]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
