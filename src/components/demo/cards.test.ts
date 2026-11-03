import { createElement as h, type FC } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomerHistoryCard } from "./customer-history-card";
import { DebtorsCard } from "./debtors-card";
import { InsightsCard } from "./insights-card";
import { StockCard } from "./stock-card";
import { SAMPLE_DEBTORS, SAMPLE_HISTORY, SAMPLE_INSIGHTS, SAMPLE_STOCK } from "./samples";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const html = <T,>(C: FC<{ data: T }>, data: T) => renderToStaticMarkup(h(C as FC<any>, { data }));
const order = (out: string, words: string[]) => words.map((w) => out.indexOf(w));

describe("DebtorsCard", () => {
  it("lists biggest first with days owed and the total", () => {
    const out = html(DebtorsCard, SAMPLE_DEBTORS);
    expect(out).toContain('data-demo="debtors-card"');
    expect(out).toContain("₦87,500");
    expect(out).toContain("Owing 20 days");
    const [chidi, bayo, basira] = order(out, ["Mama Chidi", "Bayo", "Iya Basira"]);
    expect(chidi).toBeLessThan(bayo);
    expect(bayo).toBeLessThan(basira);
  });
  it("refuses a total that its rows don't add up to", () => {
    expect(() => html(DebtorsCard, { ...SAMPLE_DEBTORS, totalOwedKobo: 8_000_000 })).toThrow(/add up/);
    expect(html(DebtorsCard, { ...SAMPLE_DEBTORS, totalOwedKobo: 9_100_000, others: { count: 2, owedKobo: 350_000 } })).toContain("2 others");
  });
});

describe("CustomerHistoryCard", () => {
  it("shows balance, sales, payments and promised dates", () => {
    const out = html(CustomerHistoryCard, SAMPLE_HISTORY);
    expect(out).toContain('data-demo="customer-history-card"');
    for (const s of ["Mama Chidi", "₦33,500", "2 Nov · Credit sale", "2 bags rice", "2 Nov · Paid", "Fri 6 Nov", "₦25,000", "DUE"]) expect(out).toContain(s);
  });
  it("rejects too many rows and bad amounts", () => {
    const many = Array.from({ length: 8 }, () => SAMPLE_HISTORY.entries[0]);
    expect(() => html(CustomerHistoryCard, { ...SAMPLE_HISTORY, entries: many })).toThrow();
    expect(() => html(CustomerHistoryCard, { ...SAMPLE_HISTORY, owedKobo: -1 })).toThrow();
  });
});

describe("StockCard", () => {
  it("flags low items and lists them first", () => {
    const out = html(StockCard, SAMPLE_STOCK);
    expect(out).toContain('data-demo="stock-card"');
    expect(out).toContain("2 items");
    expect(out).toContain("Low · reorder at 5 tins");
    const [oil, indomie, rice] = order(out, ["Groundnut oil", "Indomie", ">Rice<"]);
    expect(Math.max(oil, indomie)).toBeLessThan(rice);
  });
  it("says Nothing when no item is low", () => {
    expect(html(StockCard, { ...SAMPLE_STOCK, items: [SAMPLE_STOCK.items[1]] })).toContain(">Nothing<");
  });
});

describe("InsightsCard", () => {
  it("shows the best seller, top products and best customers by money", () => {
    const out = html(InsightsCard, SAMPLE_INSIGHTS);
    expect(out).toContain('data-demo="insights-card"');
    for (const s of ["BEST SELLER", ">Rice<", "7 bags", "₦157,500", "Aunty Ngozi", "4 visits"]) expect(out).toContain(s);
    const [chidi, ngozi, tunde] = order(out, ["Mama Chidi", "Aunty Ngozi", "Tunde"]);
    expect(chidi).toBeLessThan(ngozi);
    expect(ngozi).toBeLessThan(tunde);
  });
});
