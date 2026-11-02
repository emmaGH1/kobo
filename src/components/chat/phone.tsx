import type { ReactNode, Ref } from "react";
import { ChevronLeft, List, Mic, Phone as PhoneIcon, Play, Plus, Video } from "lucide-react";
import { KoboMark } from "../kobo/logo";
import { CONFIRMATION_PROMPT } from "../../core/contract";
import type { ChatMessage, ReplyView } from "./types";
import { WaText } from "./wa-text";

/** WhatsApp iOS light-theme colours, used only inside the phone (it is the real channel). */
export const WA = {
  wall: "#EFE7DD",
  bar: "#F6F5F3",
  out: "#D9FDD3",
  text: "#111B21",
  meta: "#667781",
  link: "#027EB5",
  ios: "#007AFF",
};

export type Msg = ChatMessage & { time?: string };

/** An iPhone running WhatsApp, open on the chat with Kobo. Drawn in code. */
export function PhoneShell({
  children,
  composer,
  overlay,
  scrollRef,
  label,
}: {
  children: ReactNode;
  composer?: ReactNode;
  overlay?: ReactNode;
  scrollRef?: Ref<HTMLDivElement>;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      data-demo="phone"
      className="relative h-[620px] w-[300px] shrink-0 rounded-[54px] bg-[#1C1C1E] p-[9px] shadow-[0_50px_80px_-40px_rgba(45,44,42,0.45),0_0_0_1px_rgba(0,0,0,0.5)] sm:h-[660px] sm:w-[322px]"
    >
      <span aria-hidden className="absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l bg-[#2a2a2c]" />
      <span aria-hidden className="absolute -left-[3px] top-[170px] h-14 w-[3px] rounded-l bg-[#2a2a2c]" />
      <span aria-hidden className="absolute -right-[3px] top-[180px] h-20 w-[3px] rounded-r bg-[#2a2a2c]" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[45px] font-sans" style={{ background: WA.wall, color: WA.text }}>
        <span aria-hidden className="absolute left-1/2 top-[10px] z-20 h-[30px] w-[100px] -translate-x-1/2 rounded-full bg-black" />
        <div className="relative z-10 flex h-[50px] shrink-0 items-end justify-between px-7 pb-1.5 text-[15px] font-semibold" style={{ background: WA.bar }}>
          <span className="tnum">9:41</span>
          <span aria-hidden className="flex items-center gap-1.5">
            <svg width="18" height="11" viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx="1" fill="currentColor" /><rect x="5" y="5" width="3" height="6" rx="1" fill="currentColor" /><rect x="10" y="2.5" width="3" height="8.5" rx="1" fill="currentColor" /><rect x="15" y="0" width="3" height="11" rx="1" fill="currentColor" /></svg>
            <svg width="16" height="11" viewBox="0 0 16 11"><path d="M8 2.2c2.2 0 4.2.9 5.7 2.3l1.1-1.1A9.6 9.6 0 0 0 8 .6 9.6 9.6 0 0 0 1.2 3.4l1.1 1.1A8 8 0 0 1 8 2.2Zm0 3.2c1.3 0 2.5.5 3.4 1.4l1.1-1.1A6.4 6.4 0 0 0 8 3.8c-1.8 0-3.4.7-4.5 1.9l1.1 1.1c.9-.9 2.1-1.4 3.4-1.4Zm0 3.2c-.5 0-1 .2-1.3.6L8 10.4l1.3-1.2A1.8 1.8 0 0 0 8 8.6Z" fill="currentColor" /></svg>
            <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" /><rect x="24" y="4" width="1.5" height="4" rx=".75" fill="currentColor" opacity=".4" /></svg>
          </span>
        </div>
        <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-black/10 px-1.5" style={{ background: WA.bar }}>
          <ChevronLeft className="size-7" strokeWidth={2} style={{ color: WA.ios }} aria-hidden />
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
            <KoboMark className="size-7" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[16px] font-semibold">Kobo</span>
            <span className="block truncate text-[12px]" style={{ color: WA.meta }}>Business account</span>
          </span>
          <Video className="size-[22px]" strokeWidth={1.75} style={{ color: WA.ios }} aria-hidden />
          <PhoneIcon className="mx-2 size-[19px]" strokeWidth={1.75} style={{ color: WA.ios }} aria-hidden />
        </div>
        <div ref={scrollRef} role="log" aria-live="polite" className="flex flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-2.5 py-3 [scrollbar-width:none]">
          <span className="mx-auto mb-1 shrink-0 rounded-md bg-white/85 px-2 py-0.5 text-[12px] font-medium" style={{ color: WA.meta }}>Today</span>
          {children}
        </div>
        {composer ?? <StaticComposer />}
        <span aria-hidden className="absolute bottom-2 left-1/2 h-[5px] w-[118px] -translate-x-1/2 rounded-full bg-black" />
        {overlay}
      </div>
    </div>
  );
}

export function StaticComposer() {
  return (
    <div aria-hidden className="flex shrink-0 items-center gap-2 border-t border-black/10 px-2 pb-6 pt-2" style={{ background: WA.bar }}>
      <Plus className="size-6 shrink-0" strokeWidth={1.75} style={{ color: WA.ios }} />
      <span className="flex h-9 flex-1 items-center rounded-full border border-black/10 bg-white px-3.5 text-[15px] text-[#8696A0]">Message</span>
      <Mic className="size-[22px] shrink-0" strokeWidth={1.75} style={{ color: WA.ios }} />
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

const WAVE = [4, 9, 14, 7, 18, 11, 6, 15, 20, 9, 12, 5, 16, 10, 7, 13, 18, 8, 5, 11, 14, 6];

export function Outgoing({ m, playing = false, transcriptNote }: { m: Msg; playing?: boolean; transcriptNote?: string }) {
  return (
    <div className="msg-in max-w-[82%] shrink-0 self-end rounded-[14px] rounded-tr-[4px] px-2.5 pb-1 pt-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]" style={{ background: WA.out }}>
      {m.voice ? (
        <div className="flex w-[200px] items-center gap-2 py-1">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#7BA67A]/20">
            <Play className="size-3.5" fill={WA.meta} stroke={WA.meta} />
          </span>
          <span aria-hidden className="relative flex h-6 flex-1 items-center gap-[2px]">
            {WAVE.map((h, i) => (
              <span
                key={i}
                className={`w-[3px] rounded-full ${playing ? "wave-play" : ""}`}
                style={{ height: h, background: playing ? undefined : "rgba(92,127,91,0.7)", animationDelay: `${i * 90}ms` }}
              />
            ))}
          </span>
          <span className="tnum text-[11px]" style={{ color: WA.meta }}>{m.text && m.text.length > 40 ? "0:09" : "0:03"}</span>
        </div>
      ) : (
        <p className="text-[14.5px] leading-[1.35]">{m.text}</p>
      )}
      {m.voice && transcriptNote && (
        <p className="mt-1 border-t border-black/10 pt-1 text-[12.5px] italic leading-[1.35]" style={{ color: WA.meta }}>
          {transcriptNote}: {m.text}
        </p>
      )}
      <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px]" style={{ color: WA.meta }}>
        <span className="tnum">{m.time}</span>
        <Ticks />
      </p>
    </div>
  );
}

export function Typing() {
  return (
    <div aria-label="Kobo is typing" className="msg-in flex h-9 w-[62px] shrink-0 items-center justify-center gap-1 self-start rounded-[14px] rounded-tl-[4px] bg-white shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot size-[7px] rounded-full bg-[#8696A0]" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </div>
  );
}

export function Incoming({
  view,
  time,
  live = false,
  pressed,
  onTap,
  onList,
  msgId,
  marks,
}: {
  view: ReplyView;
  /** Film only: lets the signature motion find this bubble. */
  msgId?: string;
  /** Film only: bold words Kobo picked out, shown with the lavender mark. */
  marks?: string[];
  time?: string;
  live?: boolean;
  /** Film only: the button being "tapped" right now. */
  pressed?: string;
  onTap?: (b: { id: string; title: string }) => void;
  onList?: () => void;
}) {
  return (
    <div data-msg={msgId} data-demo={view.footer === CONFIRMATION_PROMPT ? "review-card" : "kobo-message"} className="msg-in flex max-w-[86%] shrink-0 flex-col gap-[3px] self-start">
      <div className="rounded-[14px] rounded-tl-[4px] bg-white px-2.5 pb-1 pt-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
        <WaText body={view.body} marks={marks} className="text-[14.5px] leading-[1.38] [&_strong]:font-semibold" />
        {view.footer && <p className="mt-1 text-[12.5px]" style={{ color: WA.meta }}>{view.footer}</p>}
        {time && <p className="tnum text-right text-[11px]" style={{ color: WA.meta }}>{time}</p>}
        {view.list && (
          <button
            type="button"
            onClick={onList}
            disabled={!live || !onList}
            className="mt-1 flex w-full items-center justify-center gap-1.5 border-t border-black/10 pb-0.5 pt-2 text-[14.5px] font-medium disabled:cursor-default"
            style={{ color: WA.link, opacity: live ? 1 : 0.5 }}
          >
            <List className="size-4" strokeWidth={2} /> {view.list.button}
          </button>
        )}
      </div>
      {view.buttons?.map((b) => (
        <button
          key={b.id}
          type="button"
          disabled={!live || !onTap}
          onClick={() => onTap?.(b)}
          className={`tnum rounded-[10px] py-2 text-center text-[14.5px] font-medium shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] transition-[background-color,transform] duration-150 disabled:cursor-default ${
            pressed === b.id ? "scale-[0.97] bg-[#E2E8EC]" : "bg-white"
          }`}
          style={{ color: WA.link, opacity: live || pressed === b.id ? 1 : 0.55 }}
        >
          {b.title}
        </button>
      ))}
    </div>
  );
}
