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
 * Replies must arrive as ReplyView (src/components/chat/types.ts).
 */
import { CHIPS, MESSAGE_LIMIT, SAMPLE_VOICE, createDemo, step, type DemoState } from "./demo-engine";
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
export interface ChatBackend {
  readonly limit: number;
  readonly suggestions: readonly string[];
  readonly sampleVoice: { label: string; transcript: string };
  greeting(lang: Lang): ReplyView;
  send(input: ChatInput): Promise<ChatResult>;
  setLanguage(lang: Lang): void;
  reset(): Promise<{ remaining: number }>;
}

const GREETING: Record<Lang, string> = {
  pcm: "You don come! I be Kobo, your book.\nTell me wetin you buy or sell, who pay you, or ask *who dey owe me*.",
  en: "Welcome. I'm Kobo, your book.\nTell me what you bought or sold, who paid you, or ask *who owes me*.",
};

/** Plain 1/2/3 replies and button taps never count toward the message limit. */
const isChoice = (input: ChatInput) => Boolean(input.action) || /^[123]$/.test((input.text ?? "").trim());

export function createScriptedBackend(lang: Lang = "pcm"): ChatBackend {
  let state: DemoState = createDemo(lang);
  let used = 0;
  return {
    limit: MESSAGE_LIMIT,
    suggestions: CHIPS,
    sampleVoice: SAMPLE_VOICE,
    greeting: (l) => ({ lang: l, kind: "text", body: GREETING[l] }),
    async send(input) {
      if (used >= MESSAGE_LIMIT && !isChoice(input)) return { replies: [], remaining: 0, limited: true };
      const r = step(state, input);
      state = r.state;
      if (r.counted) used++;
      return { replies: r.replies, remaining: MESSAGE_LIMIT - used };
    },
    setLanguage(l) {
      state = { ...state, lang: l };
    },
    async reset() {
      state = createDemo(state.lang);
      used = 0;
      return { remaining: MESSAGE_LIMIT };
    },
  };
}

/** Swap this line for the real API backend when core's /api/demo/* lands. */
export const createChatBackend: (lang?: Lang) => ChatBackend = createScriptedBackend;
