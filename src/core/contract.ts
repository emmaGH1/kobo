/** Channel-neutral boundary only. No handlers or bookkeeping are implemented. */
export type Channel = "web" | "whatsapp";

/** Supplied by a trusted adapter after authentication/signature verification. */
export interface SenderContext {
  channel: Channel;
  senderId: string;
}

export interface MessageInput extends SenderContext {
  /** Runtime must require nonblank text and/or a valid server-owned audio reference. */
  text?: string;
  /** Trusted private server upload path, never an arbitrary client filesystem path. */
  audioPath?: string;
}

export interface PendingReview {
  id: string;
  summary: string;
  /** Unresolved ambiguity blocks confirmation; never silently guess missing values. */
  flags: string[];
  /** Questions that must be resolved by replacing the review; no answer saves implicitly. */
  clarifications?: { question: string; options?: { label: string; value: string }[] }[];
}

export interface MessageReply {
  replyText: string;
  pending?: PendingReview;
}

export interface PendingActionInput extends SenderContext {
  pendingId: string;
}

/** Edits create a fresh review ID/version; they cannot save a ledger event. */
export interface EditPendingInput extends PendingActionInput {
  text?: string;
  audioPath?: string;
}

/** An interactive answer must identify the exact review that supplied its options. */
export interface ClarificationInput extends PendingActionInput {
  answer: string;
}

export interface BookkeepingService {
  resolveClarification(input: ClarificationInput): Promise<MessageReply>;
  /** Also routes plain-text choices against the single current owned pending ID. */
  handleMessage(input: MessageInput): Promise<MessageReply>;
  /** Explicit save only; fail closed on flags, stale IDs, expiry or wrong owner. */
  confirm(input: PendingActionInput): Promise<MessageReply>;
  edit(input: EditPendingInput): Promise<MessageReply>;
  cancel(input: PendingActionInput): Promise<MessageReply>;
}

/** Required review footer for both adapters, not a button-only interaction. */
export const CONFIRMATION_PROMPT = "1 save / 2 edit / 3 cancel" as const;

/** Protocol specification; parsing/routing will be implemented in the core lane. */
export type PlainTextChoice = "1" | "1 save" | "2" | "2 edit" | "3" | "3 cancel";
