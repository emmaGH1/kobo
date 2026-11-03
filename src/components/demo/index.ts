/**
 * Camera-ready components for the demo video (Remotion). Every export renders from props only:
 * nothing here imports the scripted demo engine or the film script.
 *
 * Hooks for capture: data-demo="phone" | "review-card" | "kobo-message" | "book" | "summary-card".
 * Styles come from src/app/globals.css (Tailwind tokens) and the Geist fonts in src/app/fonts.
 */
export { PhoneShell as Phone, StaticComposer, Incoming as KoboBubble, Outgoing as TraderBubble, Typing, WA } from "../chat/phone";
export { WaText } from "../chat/wa-text";
export { BookPanel } from "./book-panel";
export { ReviewCard } from "./review-card";
export { SummaryCard, formatNaira, type SummaryCardData } from "./summary-card";
export { ReceiptCard, type ReceiptCardData } from "./receipt-card";
export { DebtorsCard, type DebtorsCardData } from "./debtors-card";
export { CustomerHistoryCard, type CustomerHistoryCardData } from "./customer-history-card";
export { StockCard, type StockCardData } from "./stock-card";
export { InsightsCard, type InsightsCardData } from "./insights-card";
export { NotebookImportCard, type NotebookImportCardData, type NotebookLine } from "./notebook-import-card";
export { ReminderCard, DraftMessageCard, type ReminderCardData } from "./reminder-cards";
export * as REMINDER_COPY from "./reminder-copy";
export * as SAMPLES from "./samples";
export { CardFrame, Hero, Label, Line, Tag, C as CARD_COLORS, CARD } from "./card-kit";
export { KoboLogo, KoboMark } from "../kobo/logo";
export type { BookRow, BookStats, BookReminder } from "./types";
export type { ReplyView, ChatMessage } from "../chat/types";
