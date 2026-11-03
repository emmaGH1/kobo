/**
 * THE ONE SWAP POINT for "Your turn". The chat UI (whatsapp-demo.tsx) talks only to ChatBackend.
 *
 * Today: createScriptedBackend, which runs the scripted demo engine in the browser.
 * When core ships /api/demo/* (docs/DESIGN.md section 9), add createApiBackend here and change
 * createChatBackend to return it, then delete demo-engine.ts once the film no longer needs it:
 *   - first send / reset  → POST /api/demo/session        (httpOnly cookie; returns remaining)
 *   - send({ text })      → POST /api/demo/message { text }
 *   - send({ voice })     → POST /api/demo/voice-sample { sampleId }   (server-owned clip, never a path)
 *   - send({ action })    → POST /api/demo/action { action, pendingId, version } using the
 *                           pendingId/pendingVersion from the latest ReplyView
 *   - 429 demo_limit      → { replies: [], remaining: 0, limited: true }
 *   - skipToFriday()      → POST /api/demo/clock { to: "friday" }: DEMO SESSIONS ONLY. Moves the
 *                           session clock to the next Friday 08:00 Lagos and returns what Kobo would
 *                           send by itself then (due reminders). A real trader's book never has a
 *                           movable clock.
 * Replies must arrive as ReplyView (src/components/chat/types.ts).
 */
import { CHIPS, MESSAGE_LIMIT, SAMPLE_VOICE, createDemo, dueReminders, nextWeekday, step, type DemoState } from "./demo-engine";
import type { Lang, ReplyView } from "./types";

export interface ChatInput {
  text?: string;
  /** True when `text` is the sample voice note's transcript. */
  voice?: boolean;
  /** A reply-button or list-row id. */
  action?: string;
}
export interface ChatResult {
  replies: ReplyView[];
  remaining: number;
  /** The session's message limit was reached; nothing was processed. */
  limited?: boolean;
}
export interface SkipResult extends ChatResult {
  /** WhatsApp date separator to show before Kobo's messages, e.g. "Friday". */
  dateLabel: string;
}
export interface ChatBackend {
  readonly limit: number;
  readonly suggestions: readonly string[];
  readonly sampleVoice: { label: string; transcript: string };
  greeting(lang: Lang): ReplyView;
  send(input: ChatInput): Promise<ChatResult>;
  setLanguage(lang: Lang): void;
  reset(): Promise<{ remaining: number }>;
  /** Demo only: jump to Friday 8:00 AM and get the messages Kobo sends by itself then. Free. */
  skipToFriday(): Promise<SkipResult>;
  /** The demo session's clock (e.g. "8:00 AM") once it has been moved; null means real time. */
  clockLabel(): string | null;
}

const GREETING: Record<Lang, string> = {
  pcm: "You don come! I be Kobo, your book.\nTell me wetin you buy or sell, who pay you, or ask *who dey owe me*.",
  en: "Welcome. I'm Kobo, your book.\nTell me what you bought or sold, who paid you, or ask *who owes me*.",
};

const NOTHING_DUE: Record<Lang, string> = {
  pcm: "Na Friday morning. Nothing dey due today.\nTry *Mama Chidi carry rice 45k, she pay 20k, remain Friday*, then skip to Friday again.",
  en: "It's Friday morning. Nothing is due today.\nTry *Mama Chidi carry rice 45k, she pay 20k, remain Friday*, then skip to Friday again.",
};

const timeLabel = (d: Date) => {
  const h = d.getHours();
  return `${((h + 11) % 12) + 1}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/** Plain 1/2/3 replies and button taps never count toward the message limit. */
const isChoice = (input: ChatInput) => Boolean(input.action) || /^[123]$/.test((input.text ?? "").trim());

export function createScriptedBackend(lang: Lang = "pcm"): ChatBackend {
  let state: DemoState = createDemo(lang);
  let used = 0;
  /** null = real time; set once the trader skips ahead. */
  let clock: Date | null = null;
  const now = () => clock ?? new Date();
  return {
    limit: MESSAGE_LIMIT,
    suggestions: CHIPS,
    sampleVoice: SAMPLE_VOICE,
    greeting: (l) => ({ lang: l, kind: "text", body: GREETING[l] }),
    async send(input) {
      if (used >= MESSAGE_LIMIT && !isChoice(input)) return { replies: [], remaining: 0, limited: true };
      const r = step(state, { ...input, now: now() });
      state = r.state;
      if (r.counted) used++;
      if (clock) clock = new Date(clock.getTime() + 60_000);
      return { replies: r.replies, remaining: MESSAGE_LIMIT - used };
    },
    setLanguage(l) {
      state = { ...state, lang: l };
    },
    async reset() {
      state = createDemo(state.lang);
      used = 0;
      clock = null;
      return { remaining: MESSAGE_LIMIT };
    },
    async skipToFriday() {
      const friday = nextWeekday(now(), 5);
      friday.setHours(8, 0, 0, 0);
      clock = friday;
      const due = dueReminders(state, friday);
      const replies: ReplyView[] = due.length ? due : [{ lang: state.lang, kind: "text", body: NOTHING_DUE[state.lang] }];
      return { dateLabel: "Friday", replies, remaining: MESSAGE_LIMIT - used };
    },
    clockLabel: () => (clock ? timeLabel(clock) : null),
  };
}

/** Swap this line for the real API backend when core's /api/demo/* lands. */
export const createChatBackend: (lang?: Lang) => ChatBackend = createScriptedBackend;
