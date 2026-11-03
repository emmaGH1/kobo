import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DraftMessageCard, ReminderCard, richWords, type ReminderCardData } from "./reminder-cards";
import { draftMessage, reminderBody, reminderHeading } from "./reminder-copy";
import { SAMPLE_REMINDER } from "./samples";

const english: ReminderCardData = { ...SAMPLE_REMINDER, lang: "en", item: "2 bags of rice" };
const design = readFileSync(join(__dirname, "../../../docs/DESIGN.md"), "utf8");
const html = (C: typeof ReminderCard, d: ReminderCardData) => renderToStaticMarkup(h(C, { data: d }));
const text = (out: string) => out.replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/\s+/g, " ");

describe("reminder wording matches DESIGN.md 4.10 / 4.11 exactly", () => {
  it("4.10 Pidgin heading and body", () => {
    expect(design).toContain(`\`${reminderHeading(SAMPLE_REMINDER)}\``);
    for (const line of reminderBody(SAMPLE_REMINDER)) expect(design).toContain(`\`${line}\``);
  });
  it("4.11 drafted message, Pidgin and English", () => {
    expect(design).toContain(`> ${draftMessage(SAMPLE_REMINDER)}\``);
    expect(design).toContain(`> ${draftMessage(english)}\``);
  });
});

describe("ReminderCard", () => {
  it("shows the due amount, the 4.10 lines, quick replies in order and the footer", () => {
    const out = html(ReminderCard, SAMPLE_REMINDER);
    expect(out).toContain('data-demo="reminder-card"');
    const t = text(out);
    for (const s of ["REMINDER · FRI 6 NOV", "MAMA CHIDI · DUE TODAY", "suppose pay ₦25,000 today", "E still owe you ₦33,500 for total.", "Kobo no dey message your customers by itself."]) expect(t).toContain(s);
    const order = ["Draft message", "E don pay", "Remind me later"].map((b) => out.indexOf(`>${b}<`));
    expect(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1]))).toBe(true);
  });
  it("uses the English quick reply and footer", () => {
    const out = html(ReminderCard, english);
    expect(out).toContain(">Already paid<");
    expect(out).toContain("Kobo never messages your customers itself.");
  });
  it("refuses a reminder for more than is owed, or for nothing", () => {
    expect(() => html(ReminderCard, { ...SAMPLE_REMINDER, dueKobo: 4_000_000 })).toThrow(/more than/);
    expect(() => html(ReminderCard, { ...SAMPLE_REMINDER, dueKobo: 0 })).toThrow();
  });
  it("keeps punctuation attached to bold amounts", () => {
    const words = richWords("E still owe you *₦33,500* for total.").map((w) => w.map((p) => p.t).join(""));
    expect(words).toEqual(["E", "still", "owe", "you", "₦33,500", "for", "total."]);
    expect(richWords("pay *₦25,000*.").map((w) => w.map((p) => p.t).join(""))).toEqual(["pay", "₦25,000."]);
  });
});

describe("DraftMessageCard", () => {
  it("shows the 4.11 intro, the exact message and the footer", () => {
    const out = html(DraftMessageCard, SAMPLE_REMINDER);
    expect(out).toContain('data-demo="draft-message-card"');
    const t = text(out);
    expect(t).toContain("Copy am send to Mama Chidi:");
    expect(t).toContain(draftMessage(SAMPLE_REMINDER));
    expect(t).toContain("Na you go send am. Nothing go out without you.");
    expect(t).toContain("To Mama Chidi · from your own WhatsApp");
  });
  it("in English", () => {
    const t = text(html(DraftMessageCard, english));
    expect(t).toContain("Copy this and send it to Mama Chidi:");
    expect(t).toContain("You send it. Nothing goes out without you.");
  });
});
