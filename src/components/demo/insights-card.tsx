import { CardFrame, Hero, Label, Line, assertCount, formatNaira } from "./card-kit";

/** What sold and who paid, for a period. Figures come pre-summed from confirmed entries. */
export type InsightsCardData = {
  shop: string;
  /** e.g. "THIS WEEK · 27 OCT – 2 NOV" */
  period: string;
  topProducts: { item: string; qty: string; amountKobo: number }[];
  bestCustomers: { name: string; paidKobo: number; visits: number }[];
  sample?: boolean;
};

export function validateInsights(d: InsightsCardData) {
  if (d.topProducts.length > 4 || d.bestCustomers.length > 4) throw new Error("At most 4 products and 4 customers");
  for (const p of d.topProducts) assertCount(p.amountKobo, "product amount");
  for (const c of d.bestCustomers) {
    assertCount(c.paidKobo, "customer amount");
    assertCount(c.visits, "visits");
  }
}

export function InsightsCard({ data, fontFamily = "DejaVu" }: { data: InsightsCardData; fontFamily?: string }) {
  validateInsights(data);
  const products = [...data.topProducts].sort((a, b) => b.amountKobo - a.amountKobo);
  const customers = [...data.bestCustomers].sort((a, b) => b.paidKobo - a.paidKobo);
  return (
    <CardFrame demo="insights-card" date={data.period} sample={data.sample} kicker={data.shop} fontFamily={fontFamily} footer="Sorted by money, from entries you confirmed in this period.">
      <Hero label="Best seller" value={products[0]?.item ?? "No sales yet"} />
      <Label mt={52}>Top products</Label>
      {products.map((p) => (
        <Line key={p.item} left={p.item} sub={p.qty} right={formatNaira(p.amountKobo)} />
      ))}
      <Label>Best customers</Label>
      {customers.map((c) => (
        <Line key={c.name} left={c.name} sub={`${c.visits} ${c.visits === 1 ? "visit" : "visits"}`} right={formatNaira(c.paidKobo)} tone="paid" ruled={false} size={28} />
      ))}
    </CardFrame>
  );
}
