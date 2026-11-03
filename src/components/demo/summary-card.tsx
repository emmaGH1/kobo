import { CardFrame, Hero, Label, Line, assertCount, formatNaira } from "./card-kit";

export { formatNaira } from "./card-kit";

/**
 * The 1080×1350 daily summary card, props only. Rendered to PNG by next/og (src/app/og) and
 * renderable as-is in Remotion. It never calculates: every figure arrives as integer kobo.
 */
export type SummaryCardData = {
  date: string;
  shop: string;
  owedKobo: number;
  creditKobo: number;
  collectedKobo: number;
  stockKobo: number;
  entries: number;
  biggest: { name: string; owedKobo: number }[];
  sample?: boolean;
};

export function validateSummaryCard(data: SummaryCardData) {
  assertCount(data.entries, "summary card data");
  if (data.biggest.length > 3) throw new Error("Invalid summary card data");
}

/** `fontFamily` must be loaded by the host (next/og passes DejaVu; Remotion can load its own). */
export function SummaryCard({ data, fontFamily = "DejaVu" }: { data: SummaryCardData; fontFamily?: string }) {
  validateSummaryCard(data);
  return (
    <CardFrame
      demo="summary-card"
      date={data.date}
      sample={data.sample}
      kicker={data.shop}
      fontFamily={fontFamily}
      footer={`Counted by code from ${data.entries} confirmed ${data.entries === 1 ? "entry" : "entries"}.`}
    >
      <Hero label="People owe you" value={formatNaira(data.owedKobo)} />
      <Label mt={56}>Today</Label>
      <Line left="Credit sales" right={formatNaira(data.creditKobo)} />
      <Line left="Money collected" right={formatNaira(data.collectedKobo)} />
      <Line left="Stock bought" right={formatNaira(data.stockKobo)} />
      <Line left="Entries saved" right={String(data.entries)} />
      <Label>Biggest balances</Label>
      {data.biggest.length === 0 ? (
        <span style={{ display: "flex", fontSize: 28 }}>No outstanding balances</span>
      ) : (
        data.biggest.map((b, i) => <Line key={i} left={b.name} right={formatNaira(b.owedKobo)} ruled={false} size={28} />)
      )}
    </CardFrame>
  );
}
