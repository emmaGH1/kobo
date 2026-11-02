import { CardFrame, Hero, Label, Line, assertCount, formatNaira } from "./card-kit";

/** Who owes the shop, biggest first. The total must equal the rows (+ others); the card checks. */
export type DebtorsCardData = {
  shop: string;
  date: string;
  totalOwedKobo: number;
  debtors: { name: string; owedKobo: number; daysOwed: number }[];
  /** Everyone not listed, summed by the ledger. */
  others?: { count: number; owedKobo: number };
  sample?: boolean;
};

export const MAX_DEBTOR_ROWS = 8;

export function validateDebtors(d: DebtorsCardData) {
  if (d.debtors.length > MAX_DEBTOR_ROWS) throw new Error(`At most ${MAX_DEBTOR_ROWS} debtors; put the rest in "others"`);
  for (const r of d.debtors) {
    assertCount(r.owedKobo, "debtor amount");
    assertCount(r.daysOwed, "days owed");
  }
  if (d.others) {
    assertCount(d.others.count, "others count");
    assertCount(d.others.owedKobo, "others amount");
  }
  const listed = d.debtors.reduce((a, r) => a + r.owedKobo, 0) + (d.others?.owedKobo ?? 0);
  if (listed !== d.totalOwedKobo) throw new Error("Debtors card does not add up to its total");
}

const days = (n: number) => (n === 0 ? "since today" : n === 1 ? "1 day" : `${n} days`);

export function DebtorsCard({ data, fontFamily = "DejaVu" }: { data: DebtorsCardData; fontFamily?: string }) {
  validateDebtors(data);
  const rows = [...data.debtors].sort((a, b) => b.owedKobo - a.owedKobo);
  const people = rows.length + (data.others?.count ?? 0);
  return (
    <CardFrame demo="debtors-card" date={data.date} sample={data.sample} kicker={data.shop} fontFamily={fontFamily} footer="Biggest first. Every balance comes from entries you confirmed.">
      <Hero label={`Who owes you · ${people} ${people === 1 ? "person" : "people"}`} value={formatNaira(data.totalOwedKobo)} tone="owed" />
      <Label mt={52}>Biggest first</Label>
      {rows.length === 0 ? (
        <span style={{ display: "flex", fontSize: 30 }}>Nobody owes you right now.</span>
      ) : (
        rows.map((r) => <Line key={r.name} left={r.name} sub={`Owing ${days(r.daysOwed)}`} right={formatNaira(r.owedKobo)} tone="owed" />)
      )}
      {data.others && data.others.count > 0 && <Line left={`${data.others.count} others`} right={formatNaira(data.others.owedKobo)} tone="muted" ruled={false} />}
    </CardFrame>
  );
}
