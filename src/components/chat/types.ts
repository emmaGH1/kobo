/** Render hint shared by the WhatsApp adapter and the landing chat (docs/DESIGN.md section 9). */
export interface ReplyView {
  lang: "pcm" | "en";
  kind: "text" | "buttons" | "list";
  /** WhatsApp-formatted: *bold*, _italic_, > quote, - bullets, ``` blocks. */
  body: string;
  footer?: string;
  buttons?: { id: string; title: string }[];
  list?: { button: string; rows: { id: string; title: string; description?: string }[] };
  pendingVersion?: number;
}

export type Lang = "pcm" | "en";

export interface ChatMessage {
  id: string;
  from: "kobo" | "you";
  /** Trader messages. */
  text?: string;
  voice?: boolean;
  /** Kobo messages. */
  view?: ReplyView;
  /** Buttons on this message were used or superseded. */
  settled?: boolean;
}
