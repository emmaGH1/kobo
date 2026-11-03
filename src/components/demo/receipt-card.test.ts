import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReceiptCard, type ReceiptCardData } from "./receipt-card";

const sale: ReceiptCardData = {
  shop: "Nkechi Provisions", date: "MON 2 NOV · 12:11 PM", ref: "K-0002", customer: "Mama Chidi",
  item: "Rice", qty: "2 bags", amountKobo: 4_500_000, paidKobo: 2_000_000, owedKobo: 2_500_000, due: "Fri 6 Nov", sample: true,
};
const html = (d: ReceiptCardData) => renderToStaticMarkup(h(ReceiptCard, { data: d }));

describe("ReceiptCard", () => {
  it("renders one sale with paid, balance and the promised date", () => {
    const out = html(sale);
    expect(out).toContain('data-demo="receipt-card"');
    for (const s of ["K-0002", "Mama Chidi", "Rice", "2 bags", "₦45,000", "₦20,000", "₦25,000", "Promised for Fri 6 Nov", "PART PAID", "NKECHI PROVISIONS", "SAMPLE DATA"]) expect(out).toContain(s);
  });
  it("labels paid-in-full and on-credit sales", () => {
    expect(html({ ...sale, paidKobo: 4_500_000, owedKobo: 0, due: undefined })).toContain("PAID IN FULL");
    expect(html({ ...sale, paidKobo: 0, owedKobo: 4_500_000 })).toContain("ON CREDIT");
  });
  it("refuses a receipt that doesn't balance or has bad amounts", () => {
    expect(() => html({ ...sale, owedKobo: 2_400_000 })).toThrow(/does not balance/);
    expect(() => html({ ...sale, paidKobo: 1.5 })).toThrow();
    expect(() => html({ ...sale, ref: "" })).toThrow();
  });
});
