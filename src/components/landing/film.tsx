"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Bell, Pause, Play, RotateCcw } from "lucide-react";
import { CHAPTERS, buildFilm, chapterStarts, type Caption, type Frame } from "@/components/chat/film";
import { Incoming, Outgoing, PhoneShell, Typing, WA } from "@/components/chat/phone";
import { BookPanel } from "@/components/demo/book-panel";

const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
/** Same curve as --ease in globals.css. */
const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";
const FLY_MS = 600;

/**
 * The page's one memorable motion: on confirm, the words Kobo marked in its review bubble lift
 * out and fly into the new book row. Skipped under reduced motion or when either end is off screen.
 */
function flyIntoBook(host: HTMLElement, fly: NonNullable<Frame["fly"]>) {
  const onScreen = (r: DOMRect) => r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  const pairs = fly.items.map((it) => ({
    src: host.querySelector<HTMLElement>(`[data-msg="${fly.msg}"] [data-fly="${CSS.escape(it.text)}"]`),
    dst: host.querySelector<HTMLElement>(`[data-row="${it.row}"] [data-fly-target="${it.part}"]`),
  }));
  if (!pairs.every((p) => p.src && p.dst && onScreen(p.src.getBoundingClientRect()) && onScreen(p.dst.getBoundingClientRect()))) return false;
  for (const id of new Set(fly.items.map((x) => x.row)))
    host.querySelector<HTMLElement>(`[data-row="${id}"]`)?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.72 }, { opacity: 1 }], {
      duration: FLY_MS + 160,
      easing: EASE,
    });
  pairs.forEach(({ src, dst }, k) => {
    const a = src!.getBoundingClientRect();
    const b = dst!.getBoundingClientRect();
    const from = getComputedStyle(src!);
    const scale = parseFloat(getComputedStyle(dst!).fontSize) / parseFloat(from.fontSize);
    const dx = b.left - a.left;
    const dy = b.top - a.top + (b.height - a.height * scale) / 2;
    const ghost = document.createElement("span");
    ghost.className = "kfly";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = src!.textContent;
    Object.assign(ghost.style, {
      left: `${a.left}px`,
      top: `${a.top}px`,
      height: `${a.height}px`,
      lineHeight: `${a.height}px`,
      font: from.font,
      color: from.color,
      letterSpacing: from.letterSpacing,
    });
    document.body.appendChild(ghost);
    // The word in the bubble dims while its copy is in the air.
    src!.animate([{ opacity: 1 }, { opacity: 0.3, offset: 0.2 }, { opacity: 0.3, offset: 0.8 }, { opacity: 1 }], { duration: FLY_MS + 200, easing: EASE });
    const anim = ghost.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.12}px, ${dy * 0.12 - 18}px) scale(1.08)`, opacity: 1, offset: 0.22 },
        { transform: `translate(${dx * 0.97}px, ${dy * 0.97}px) scale(${scale})`, opacity: 1, offset: 0.82 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 },
      ],
      { duration: FLY_MS, delay: k * 60, easing: EASE, fill: "forwards" },
    );
    anim.onfinish = () => ghost.remove();
    anim.oncancel = () => ghost.remove();
  });
  return true;
}

const tone = (t?: "owed" | "paid" | "out") => (t === "owed" ? "text-owed" : t === "paid" ? "text-paid" : "");
const LABEL = "font-sans text-[12px] uppercase tracking-[0.12em] text-ink-3";

/** Lavender = "Kobo noticed this". Marks the facts it pulled out of what was said. */
function Marked({ text, marks }: { text: string; marks: { text: string; doubt?: boolean }[] }) {
  const parts: React.ReactNode[] = [];
  let rest = text;
  marks.forEach((m, k) => {
    const i = rest.toLowerCase().indexOf(m.text.toLowerCase());
    if (i < 0) return;
    parts.push(rest.slice(0, i));
    parts.push(
      <span key={k} className={m.doubt ? "kmark kmark-doubt" : "kmark"} style={{ animationDelay: `${250 + k * 300}ms` }}>
        {rest.slice(i, i + m.text.length)}
        {m.doubt && <sup className="ml-0.5 font-sans text-[12px] not-italic text-owed">?</sup>}
      </span>,
    );
    rest = rest.slice(i + m.text.length);
  });
  parts.push(rest);
  return <>{parts}</>;
}

function CaptionView({ c }: { c: Caption }) {
  const big = "mt-4 text-[28px] leading-[1.15] tracking-[-0.015em] lg:text-[34px]";
  switch (c.kind) {
    case "idle":
      return (
        <div>
          <p className={LABEL}>Kobo</p>
          <p className={`${big} text-ink-3`}>…</p>
        </div>
      );
    case "opening":
      return (
        <div>
          <p className={LABEL}>Sun 1 Nov · carried over from the notebook, confirmed once</p>
          <p className={big}>
            Opening balances <span className="tnum">{c.total}</span>
          </p>
          <p className="mt-2 font-sans text-[14px] text-ink-2">
            {c.rows.map((r) => `${r.name} ${r.amount}`).join(" · ")}
          </p>
        </div>
      );
    case "heard":
      return (
        <div>
          <p className={LABEL}>Heard · the AI picks out who, what and how much</p>
          <p className="mt-4 text-[24px] italic leading-[1.3] tracking-[-0.01em] lg:text-[30px]">
            &ldquo;<Marked text={c.text} marks={c.marks} />&rdquo;
          </p>
        </div>
      );
    case "proposal":
      return (
        <div>
          <p className={LABEL}>Checked · what Kobo will write. Nothing saved yet</p>
          <p className="mt-4 text-[28px] leading-none tracking-[-0.015em] lg:text-[34px]">{c.title}</p>
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-ink/15 pt-4 sm:grid-cols-3">
            {c.lines.map((l) => (
              <div key={l.label}>
                <dt className="font-sans text-[13px] text-ink-2">{l.label}</dt>
                <dd className={`tnum mt-1 text-[24px] leading-none lg:text-[30px] ${tone(l.tone)}`}>{l.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "ask":
      return (
        <div>
          <p className={LABEL}>Checked · &ldquo;{c.heard}&rdquo; can be read two ways. Kobo asks</p>
          <p className="tnum mt-4 text-[40px] leading-none tracking-[-0.03em] lg:text-[60px]">
            {c.options[0]} <span className="text-ink-3">or</span> {c.options[1]}?
          </p>
        </div>
      );
    case "tap":
      return (
        <div>
          <p className={LABEL}>The trader taps</p>
          <p className={big}>
            <span className="kmark">{c.label}</span>
          </p>
        </div>
      );
    case "saved":
      return (
        <div>
          <p className={LABEL}>Counted · code calculated it and wrote the book</p>
          <p className={big}>
            {c.line} <span className={`tnum ${tone(c.tone)}`}>{c.amount}</span>
          </p>
          {c.note && (
            <p className="mt-3 inline-flex items-center gap-2 font-sans text-[14px] text-ink-2">
              <Bell className="size-4" strokeWidth={1.5} /> {c.note}
            </p>
          )}
        </div>
      );
    case "debtors":
      return (
        <div>
          <p className={LABEL}>Asked · who owes, biggest first</p>
          <ol className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
            {c.rows.map((r, i) => (
              <li key={r.name} className="flex items-baseline justify-between gap-3 border-b border-ink/10 pb-2">
                <span className="text-[20px] lg:text-[24px]">
                  <span className="tnum mr-2 font-sans text-[12px] text-ink-3">{i + 1}</span>
                  {r.name}
                </span>
                <span className="tnum text-[20px] text-owed lg:text-[24px]">{r.amount}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "summary":
      return (
        <div>
          <p className={LABEL}>8:00 PM · Kobo sends the day on one page</p>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {c.figures.map((f) => (
              <div key={f.label} className="border-t border-ink/15 pt-3">
                <dt className="font-sans text-[13px] text-ink-2">{f.label}</dt>
                <dd className={`tnum mt-1 text-[24px] leading-none lg:text-[30px] ${tone(f.tone)}`}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "reminder":
      return (
        <div>
          <p className={LABEL}>{c.date} · 8:00 AM · Kobo reminds the trader</p>
          <p className={big}>
            {c.name} is due to pay <span className="tnum text-owed">{c.amount}</span> today.
          </p>
        </div>
      );
    case "draft":
      return (
        <div>
          <p className={LABEL}>Drafted for the trader to forward · Kobo never messages customers itself</p>
          <blockquote className="mt-4 border-l-2 border-lav pl-5 text-[20px] italic leading-[1.4] lg:text-[24px]">{c.text}</blockquote>
        </div>
      );
  }
}


export function Film({ intro, actions }: { intro: React.ReactNode; actions: React.ReactNode }) {
  const frames = useMemo<Frame[]>(() => buildFilm(), []);
  const starts = useMemo(() => chapterStarts(frames), [frames]);
  const reduced = useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);
  const [idx, setI] = useState(0);
  const [userPlaying, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [startedByUser, setStarted] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // Reduced motion: the finished day as a still until the viewer chooses a chapter or presses play.
  const still = reduced && !startedByUser;
  const i = still ? frames.length - 1 : idx;
  const playing = userPlaying && !still;
  const f = frames[i];

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

  // Fly only when the film advances into a confirm frame on its own (not on chapter jumps).
  const prevI = useRef(i);
  useLayoutEffect(() => {
    const was = prevI.current;
    prevI.current = i;
    if (!f.fly || reduced || i !== was + 1 || !root.current) return;
    flyIntoBook(root.current, f.fly);
  }, [i, f.fly, reduced]);
  const landing = new Set(!reduced && f.fly ? f.fly.items.map((x) => x.row) : []);

  const goTo = (frame: number) => {
    setStarted(true);
    setI(frame);
    setPlaying(true);
  };

  const lastKobo = [...f.msgs].reverse().find((m) => m.from === "kobo")?.id;
  const chapterEnd = (c: number) => (c + 1 < starts.length ? starts[c + 1] : frames.length);
  const chapterProgress = (c: number) => {
    if (c < f.chapter) return 1;
    if (c > f.chapter) return 0;
    const span = frames.slice(starts[c], chapterEnd(c)).reduce((a, x) => a + x.dur, 0);
    const done = frames.slice(starts[c], i + 1).reduce((a, x) => a + x.dur, 0);
    return done / span;
  };

  return (
    <div ref={root} className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
      {/* 1. headline (mobile: first) */}
      <div className="min-w-0 lg:col-span-6 lg:row-start-1">{intro}</div>

      {/* 2. the film's phone: second on mobile, pinned on the right on desktop */}
      <div className="flex justify-center lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1 lg:justify-end">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <PhoneShell label="Film: a trader's day with Kobo in WhatsApp" scrollRef={scroller}>
            {f.msgs.map((m) =>
              m.from === "date" ? (
                <span key={m.id} className="mx-auto my-1 shrink-0 rounded-md bg-white/85 px-2 py-0.5 text-[12px] font-medium" style={{ color: WA.meta }}>
                  {m.text}
                </span>
              ) : m.from === "you" ? (
                <Outgoing key={m.id} m={m} playing={f.playing === m.id} />
              ) : (
                <Incoming
                  key={m.id}
                  msgId={m.id}
                  view={m.view!}
                  time={m.time}
                  live={!m.settled && m.id === lastKobo}
                  pressed={m.id === lastKobo ? f.pressed : undefined}
                  marks={f.marks?.msg === m.id ? f.marks.words : undefined}
                />
              ),
            )}
            {f.typing && <Typing />}
          </PhoneShell>
        </div>
      </div>

      {/* 3. actions (mobile: after the phone) */}
      <div className="min-w-0 lg:col-span-6 lg:row-start-2 lg:pt-8">{actions}</div>

      {/* 4. chapters, caption, book */}
      <div id="film" className="flex min-w-0 scroll-mt-6 flex-col lg:col-span-6 lg:row-start-3 lg:pt-16">
        {/* chapters */}
      <ol className="grid grid-cols-3 gap-x-3 gap-y-5">
        {CHAPTERS.map((c, k) => (
          <li key={c.t}>
            <button type="button" onClick={() => goTo(starts[k])} className="group block w-full text-left" aria-current={f.chapter === k ? "step" : undefined}>
              <span aria-hidden className="relative block h-[3px] overflow-hidden rounded-full bg-ink/10">
                <span className="absolute inset-y-0 left-0 bg-lav transition-[width] duration-300 ease-linear" style={{ width: `${chapterProgress(k) * 100}%` }} />
              </span>
              <span className="mt-3 block font-sans text-[12px] text-ink-3">{c.when}</span>
              <span className={`mt-0.5 block text-[16px] leading-tight transition-colors sm:text-[18px] lg:text-[20px] ${f.chapter === k ? "text-ink" : "text-ink-3 group-hover:text-ink-2"}`}>{c.t}</span>
            </button>
          </li>
        ))}
      </ol>

        <div className="mt-10 flex min-w-0 flex-col">
          <div className="min-h-[200px]" aria-live="polite" key={i}>
            <div className="msg-in">
              <CaptionView c={f.caption} />
            </div>
          </div>

          {/* the book */}
          <BookPanel className="mt-8" date="Mon 2 Nov" stats={f.stats} rows={f.book} reminders={f.reminders} landing={landing} />

          <div className="mt-6 flex items-center gap-4 font-sans text-[12px] text-ink-3">
            <button
              type="button"
              onClick={() => (still ? goTo(0) : setPlaying((p) => !p))}
              aria-label={playing ? "Pause film" : "Play film"}
              className="flex size-9 items-center justify-center rounded-full border border-ink/20 text-ink hover:bg-ink hover:text-paper"
            >
              {playing ? <Pause className="size-3.5" fill="currentColor" /> : <Play className="size-3.5" fill="currentColor" />}
            </button>
            <button type="button" onClick={() => goTo(0)} className="flex items-center gap-1 hover:text-ink">
              <RotateCcw className="size-3" strokeWidth={2} /> Replay
            </button>
            <span>Scripted film · sample data · real message formats</span>
          </div>
        </div>
      </div>
    </div>
  );
}
