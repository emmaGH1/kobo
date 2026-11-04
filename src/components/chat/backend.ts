/**
 * THE ONE SWAP POINT for "Your turn". The chat UI (whatsapp-demo.tsx) talks only to ChatBackend.
 *
 * Live: createApiBackend, a thin client of core's /api/demo/* (docs/DESIGN.md section 9). Every
 * reply comes from the same handleMessage a real trader uses, on a fresh fictional book per visitor.
 * createScriptedBackend (the in-browser demo engine) stays for the film and offline tests.
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
  /** null when no consented, server-owned sample clip exists; the UI hides the voice note then. */
  readonly sampleVoice: { label: string; transcript: string } | null;
  greeting(lang: Lang): ReplyView;
  send(input: ChatInput): Promise<ChatResult>;
  setLanguage(lang: Lang): void;
  reset(): Promise<{ remaining: number }>;
  /** Demo only: jump to Friday 8:00 AM and get the messages Kobo sends by itself then. Free. */
  skipToFriday(): Promise<SkipResult>;
  /**
   * What the server says is left, asked once when the page loads. Never creates a session for a
   * visitor who hasn't started one. Resolves to the current known count either way.
   */
  sync(): Promise<number>;
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
    sync: async () => MESSAGE_LIMIT - used,
  };
}

/** Core's demo allowance: model calls per visitor session (DEMO_LIMIT in src/server/demo.ts). */
export const API_MESSAGE_LIMIT = 12;

const BUSY: Record<Lang, string> = {
  pcm: "I still dey work on your last message. Wait small.",
  en: "I'm still working on your last message. One moment.",
};

const lagos = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", ...opts }).format(d);

/** Thrown for server errors the UI shows as its "nothing was saved" failure reply. */
export class DemoApiError extends Error {
  constructor(readonly status: number) {
    super(`Demo API request failed (HTTP ${status})`);
    this.name = "DemoApiError";
  }
}

interface ApiReply {
  replies?: ReplyView[];
  remaining?: number;
  limited?: boolean;
  simulatedAt?: number;
}

/** When the visitor's demo session expires (ms epoch), remembered so a reload can ask for the count. */
const SESSION_UNTIL_KEY = "kobo_demo_until";
type FlagStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
function browserStorage(): FlagStorage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null; // storage blocked (private mode, etc.)
  }
}

/**
 * `remaining` is always core's number: read from the session response (new or existing), from every
 * reply, and from reset. The counter counts real model calls (DEMO_LIMIT in src/server/demo.ts):
 * lookups, saves and button taps are free; a model call that fails still costs one; reset clears
 * the conversation but never refills it.
 */
export function createApiBackend(
  lang: Lang = "pcm",
  fetchImpl: typeof fetch = (...a) => fetch(...a),
  base = "/api/demo",
  storage: FlagStorage | null = browserStorage(),
): ChatBackend {
  let current: Lang = lang;
  const remember = (expiresAt: unknown) => {
    if (typeof expiresAt !== "number") return;
    try {
      storage?.setItem(SESSION_UNTIL_KEY, String(expiresAt));
    } catch {
      /* the flag is a convenience; losing it only means the count isn't restored on reload */
    }
  };
  const forget = () => {
    try {
      storage?.removeItem(SESSION_UNTIL_KEY);
    } catch {
      /* see remember */
    }
  };
  const hasLiveSession = () => {
    try {
      const until = Number(storage?.getItem(SESSION_UNTIL_KEY));
      return Number.isFinite(until) && until > Date.now();
    } catch {
      return false;
    }
  };
  let session: Promise<void> | null = null;
  let clock: Date | null = null;
  let remaining = API_MESSAGE_LIMIT;

  async function request(op: string, body: Record<string, unknown>) {
    return fetchImpl(`${base}/${op}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  function ensureSession() {
    session ??= request("session", { lang: current }).then(async (r) => {
      if (!r.ok) {
        session = null;
        throw new DemoApiError(r.status);
      }
      // New or existing session: either way the response carries what is left.
      const a = (await r.json().catch(() => ({}))) as ApiReply & { expiresAt?: number };
      if (typeof a.remaining === "number") remaining = a.remaining;
      remember(a.expiresAt);
    });
    return session;
  }
  /** Runs an operation, recreating an expired session once (cookie TTL is 30 minutes). */
  async function call(op: string, body: Record<string, unknown>): Promise<ApiReply> {
    await ensureSession();
    let r = await request(op, body);
    if (r.status === 401) {
      session = null;
      forget();
      await ensureSession();
      r = await request(op, body);
    }
    if (r.status === 429) return { replies: [], remaining: 0, limited: true };
    if (r.status === 409) return { replies: [{ lang: current, kind: "text", body: BUSY[current] }] };
    if (!r.ok) throw new DemoApiError(r.status);
    return (await r.json()) as ApiReply;
  }
  const result = (a: ApiReply): ChatResult => {
    if (typeof a.remaining === "number") remaining = a.remaining;
    return { replies: a.replies ?? [], remaining, ...(a.limited ? { limited: true } : {}) };
  };

  return {
    limit: API_MESSAGE_LIMIT,
    suggestions: CHIPS,
    sampleVoice: null,
    greeting: (l) => ({ lang: l, kind: "text", body: GREETING[l] }),
    async send(input) {
      const text = input.text?.trim();
      if (!input.action && !text) return { replies: [], remaining };
      const r = result(await call(input.action ? "action" : "message", input.action ? { action: input.action } : { text }));
      if (clock) clock = new Date(clock.getTime() + 60_000);
      return r;
    },
    setLanguage(l) {
      current = l;
      // Before the first message the language travels with session creation instead.
      if (session) void session.then(() => request("language", { lang: l })).catch(() => {});
    },
    async reset() {
      clock = null;
      const r = await request("reset", { lang: current });
      if (r.status === 429) return { remaining: (remaining = 0) };
      if (!r.ok) throw new DemoApiError(r.status);
      session = Promise.resolve();
      const a = (await r.json()) as ApiReply & { expiresAt?: number };
      remember(a.expiresAt);
      return { remaining: result(a).remaining };
    },
    async skipToFriday() {
      const a = await call("clock", { to: "friday" });
      if (a.limited) return { dateLabel: "", ...result(a) };
      if (typeof a.simulatedAt === "number") clock = new Date(a.simulatedAt);
      const replies = a.replies?.length ? a.replies : [{ lang: current, kind: "text" as const, body: NOTHING_DUE[current] }];
      return { dateLabel: lagos(clock ?? new Date(), { weekday: "long" }), ...result({ ...a, replies }) };
    },
    clockLabel: () => (clock ? lagos(clock, { hour: "numeric", minute: "2-digit" }) : null),
    async sync() {
      // Only a visitor who already started a session has a cookie, so asking is read-only for
      // them. Anyone else would get a brand-new session (and use core's per-IP allowance).
      if (!hasLiveSession()) return remaining;
      try {
        await ensureSession();
      } catch {
        /* offline or refused: keep showing the last known count */
      }
      return remaining;
    },
  };
}

/** "Your turn" talks to core's real demo API. Use createScriptedBackend for the film/offline. */
export const createChatBackend: (lang?: Lang) => ChatBackend = createApiBackend;
