/**
 * The exact wording of DESIGN.md 4.10 (due-date reminder) and 4.11 (drafted customer message),
 * shared by the WhatsApp replies (demo engine, later core) and the image cards so they never
 * drift. Text uses WhatsApp formatting (*bold*). No engine imports.
 */
import type { Lang } from "../chat/types";
import { assertCount, formatNaira } from "./card-kit";

export type ReminderData = {
  lang: Lang;
  shop: string;
  customer: string;
  /** e.g. "Fri 6 Nov" */
  dueLabel: string;
  /** The amount promised for this date (from the confirmed sale). */
  dueKobo: number;
  /** Everything the customer owes now (from the ledger). */
  totalOwedKobo: number;
  /** As written in the trader's language, e.g. "2 bag rice" / "2 bags of rice". */
  item: string;
  /** e.g. "2 Nov" */
  soldOn: string;
};

export function validateReminder(d: ReminderData) {
  assertCount(d.dueKobo, "due amount");
  assertCount(d.totalOwedKobo, "total owed");
  if (d.dueKobo === 0) throw new Error("Nothing is due");
  if (d.dueKobo > d.totalOwedKobo) throw new Error("A reminder can't ask for more than the customer owes");
}

const pcm = (d: ReminderData) => d.lang === "pcm";

/** 4.10 heading, e.g. "*Reminder* · Fri 6 Nov" */
export const reminderHeading = (d: ReminderData) => `*Reminder* · ${d.dueLabel}`;

/** 4.10 body lines. */
export function reminderBody(d: ReminderData): string[] {
  return pcm(d)
    ? [`${d.customer} suppose pay *${formatNaira(d.dueKobo)}* today, for the ${d.item} wey e carry on ${d.soldOn}.`, `E still owe you *${formatNaira(d.totalOwedKobo)}* for total.`]
    : [`${d.customer} is due to pay *${formatNaira(d.dueKobo)}* today, for the ${d.item} taken on ${d.soldOn}.`, `Total still owed: *${formatNaira(d.totalOwedKobo)}*.`];
}

export const reminderFooter = (lang: Lang) => (lang === "pcm" ? "Kobo no dey message your customers by itself." : "Kobo never messages your customers itself.");

/** 4.10 quick replies, in order. */
export const reminderButtons = (lang: Lang) => ({
  draft: "Draft message",
  paid: lang === "pcm" ? "E don pay" : "Already paid",
  later: "Remind me later",
});

/** 4.11 intro line. */
export const draftIntro = (d: Pick<ReminderData, "lang" | "customer">) => (d.lang === "pcm" ? `Copy am send to ${d.customer}:` : `Copy this and send it to ${d.customer}:`);

/** 4.11 the message the trader forwards. Built from ledger facts only. */
export function draftMessage(d: ReminderData): string {
  return pcm(d)
    ? `Good morning ${d.customer}, na ${d.shop}. Small reminder say the ${formatNaira(d.dueKobo)} balance for the ${d.item} wey you carry on ${d.soldOn} dey due today. Thank you, God bless.`
    : `Good morning ${d.customer}, this is ${d.shop}. A small reminder that the ${formatNaira(d.dueKobo)} balance for the ${d.item} you took on ${d.soldOn} is due today. Thank you.`;
}

export const draftFooter = (lang: Lang) => (lang === "pcm" ? "Na you go send am. Nothing go out without you." : "You send it. Nothing goes out without you.");
