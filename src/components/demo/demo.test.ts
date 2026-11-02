import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BookPanel, KoboBubble, Phone, ReviewCard, SummaryCard, TraderBubble, WaText } from "./index";

const SRC = resolve(__dirname, "../..");
function resolveImport(from: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? join(SRC, spec.slice(2)) : spec.startsWith(".") ? join(dirname(from), spec) : null;
  if (!base) return null;
  for (const ext of ["", ".ts", ".tsx", "/index.ts"]) if (existsSync(base + ext) && !(base + ext).endsWith("/")) {
    try { readFileSync(base + ext); return base + ext; } catch { /* directory */ }
  }
  return null;
}
function walk(file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file)) return seen;
  seen.add(file);
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/from\s+["']([^"']+)["']/g)) {
    const next = resolveImport(file, m[1]);
    if (next) walk(next, seen);
  }
  return seen;
}

describe("camera-ready components", () => {
  it("never import the scripted engine or the film script", () => {
    const files = [...walk(join(__dirname, "index.ts"))].map((f) => f.slice(SRC.length));
    expect(files.length).toBeGreaterThan(5);
    expect(files.filter((f) => /demo-engine|chat\/film\.ts|landing\/film/.test(f))).toEqual([]);
  });

  it("render from props alone, with data-demo hooks", () => {
    const review = {
      lang: "pcm" as const,
      kind: "buttons" as const,
      body: "Make I write am like this?\n\n*Stock wey you buy*\n- *5 bag rice*, from Alhaji: *₦290,000*",
      footer: "1 save / 2 edit / 3 cancel",
      buttons: [{ id: "save", title: "1 Save" }, { id: "edit", title: "2 Edit" }, { id: "cancel", title: "3 Cancel" }],
    };
    const phone = renderToStaticMarkup(
      h(Phone, {
        label: "demo",
        children: [
          h(TraderBubble, { key: "a", m: { id: "a", from: "you", text: "I buy 5 bag rice", time: "7:52 AM" } }),
          h(KoboBubble, { key: "b", view: review, marks: ["5 bag rice"] }),
        ],
      }),
    );
    expect(phone).toContain('data-demo="phone"');
    expect(phone).toContain('data-demo="review-card"');
    expect(phone).toContain('data-fly="5 bag rice"');

    expect(renderToStaticMarkup(h(ReviewCard, { view: review, pressed: "save" }))).toContain('data-demo="review-card"');
    expect(renderToStaticMarkup(h(WaText, { body: "*₦290,000*" }))).toContain("₦290,000");

    const book = renderToStaticMarkup(
      h(BookPanel, {
        date: "Mon 2 Nov",
        stats: { owed: "₦66,300", collected: "₦0", stock: "₦290,000" },
        rows: [{ id: "r0", time: "7:53 AM", name: "5 bag rice · Alhaji", entry: "stock", amount: "₦290,000" }],
        reminders: [{ date: "Fri 6 Nov", name: "Mama Chidi", amount: "₦25,000" }],
      }),
    );
    expect(book).toContain('data-demo="book"');
    expect(book).toContain('data-row="r0"');

    const card = renderToStaticMarkup(
      h(SummaryCard, {
        data: { date: "MON 2 NOV", shop: "Nkechi Provisions", owedKobo: 8_750_000, creditKobo: 4_500_000, collectedKobo: 2_380_000, stockKobo: 29_000_000, entries: 4, biggest: [], sample: true },
      }),
    );
    expect(card).toContain('data-demo="summary-card"');
    expect(card).toContain("₦87,500");
  });
});
