/**
 * Sample data for every card, consistent with the landing film's day (Mon 2 Nov, Nkechi
 * Provisions). Used by /og/sample/<card>, the tests and Remotion stills. Not real trader data.
 */
import type { CustomerHistoryCardData } from "./customer-history-card";
import type { DebtorsCardData } from "./debtors-card";
import type { InsightsCardData } from "./insights-card";
import type { ReceiptCardData } from "./receipt-card";
import type { StockCardData } from "./stock-card";
import type { SummaryCardData } from "./summary-card";

const shop = "Nkechi Provisions";

export const SAMPLE_SUMMARY: SummaryCardData = {
  sample: true, date: "MON 2 NOV", shop, owedKobo: 8_750_000, creditKobo: 4_500_000, collectedKobo: 2_380_000, stockKobo: 29_000_000, entries: 4,
  biggest: [{ name: "Mama Chidi", owedKobo: 3_350_000 }, { name: "Bayo", owedKobo: 2_800_000 }, { name: "Iya Basira", owedKobo: 2_600_000 }],
};

export const SAMPLE_RECEIPT: ReceiptCardData = {
  sample: true, shop, date: "MON 2 NOV · 12:11 PM", ref: "K-0002", customer: "Mama Chidi", item: "Rice", qty: "2 bags",
  amountKobo: 4_500_000, paidKobo: 2_000_000, owedKobo: 2_500_000, due: "Fri 6 Nov",
};

export const SAMPLE_DEBTORS: DebtorsCardData = {
  sample: true, shop, date: "MON 2 NOV", totalOwedKobo: 8_750_000,
  debtors: [
    { name: "Bayo", owedKobo: 2_800_000, daysOwed: 20 },
    { name: "Mama Chidi", owedKobo: 3_350_000, daysOwed: 13 },
    { name: "Iya Basira", owedKobo: 2_600_000, daysOwed: 15 },
  ],
};

export const SAMPLE_HISTORY: CustomerHistoryCardData = {
  sample: true, shop, date: "MON 2 NOV", customer: "Mama Chidi", owedKobo: 3_350_000,
  entries: [
    { date: "2 Nov", kind: "payment", amountKobo: 2_000_000 },
    { date: "2 Nov", kind: "sale", amountKobo: 4_500_000, note: "2 bags rice" },
    { date: "24 Oct", kind: "payment", amountKobo: 500_000 },
    { date: "20 Oct", kind: "sale", amountKobo: 1_350_000, note: "Groundnut oil, 3 tins" },
  ],
  promises: [{ date: "Fri 6 Nov", amountKobo: 2_500_000, status: "due" }],
};

export const SAMPLE_STOCK: StockCardData = {
  sample: true, shop, date: "MON 2 NOV",
  items: [
    { item: "Rice", unit: "bags", left: 3, reorderAt: 2 },
    { item: "Sugar", unit: "bags", left: 12, reorderAt: 4 },
    { item: "Groundnut oil", unit: "tins", left: 4, reorderAt: 5 },
    { item: "Indomie", unit: "cartons", left: 2, reorderAt: 3 },
  ],
};

export const SAMPLE_INSIGHTS: InsightsCardData = {
  sample: true, shop, period: "THIS WEEK · 27 OCT – 2 NOV",
  topProducts: [
    { item: "Rice", qty: "7 bags", amountKobo: 15_750_000 },
    { item: "Indomie", qty: "9 cartons", amountKobo: 8_100_000 },
    { item: "Groundnut oil", qty: "6 tins", amountKobo: 5_400_000 },
  ],
  bestCustomers: [
    { name: "Mama Chidi", paidKobo: 2_500_000, visits: 3 },
    { name: "Aunty Ngozi", paidKobo: 1_800_000, visits: 2 },
    { name: "Tunde", paidKobo: 1_250_000, visits: 4 },
  ],
};
