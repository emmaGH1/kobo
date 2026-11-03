import { CardFrame, Hero, Label, Line, Tag, assertCount, formatNaira } from "./card-kit";

/** One customer's book: newest entries first, plus payment promises. */
export type CustomerHistoryCardData = {
  shop: string;
  date: string;
  customer: string;
  owedKobo: number;
  entries: { date: string; kind: "sale" | "payment" | "correction"; amountKobo: number; note?: string }[];
  promises: { date: string; amountKobo: number; status: "due" | "kept" | "missed" }[];
  sample?: boolean;
};

export const MAX_HISTORY_ROWS = 7;

export function validateHistory(d: CustomerHistoryCardData) {
  assertCount(d.owedKobo, "balance");
  if (d.entries.length > MAX_HISTORY_ROWS) throw new Error(`At most ${MAX_HISTORY_ROWS} entries per card`);
  if (d.promises.length > 3) throw new Error("At most 3 promises per card");
  for (const e of d.entries) assertCount(e.amountKobo, "entry amount");
  for (const p of d.promises) assertCount(p.amountKobo, "promise amount");
}

const KIND = { sale: "Credit sale", payment: "Paid", correction: "Correction" } as const;
const STATUS = { due: "Due", kept: "Kept", missed: "Missed" } as const;

export function CustomerHistoryCard({ data, fontFamily = "DejaVu" }: { data: CustomerHistoryCardData; fontFamily?: string }) {
  validateHistory(data);
  return (
    <CardFrame demo="customer-history-card" date={data.date} sample={data.sample} kicker={data.shop} fontFamily={fontFamily} footer="Newest first. Corrections are new entries; nothing is erased.">
      <span style={{ display: "flex", fontSize: 56, marginTop: 40, letterSpacing: -1 }}>{data.customer}</span>
      <Hero label={data.owedKobo > 0 ? "Owes you now" : "Owes nothing"} value={formatNaira(data.owedKobo)} tone={data.owedKobo > 0 ? "owed" : "paid"} mt={20} />
      <Label mt={44}>History</Label>
      {data.entries.map((e, i) => (
        <Line key={i} left={`${e.date} · ${KIND[e.kind]}`} sub={e.note} right={formatNaira(e.amountKobo)} tone={e.kind === "sale" ? "owed" : e.kind === "payment" ? "paid" : "muted"} size={28} />
      ))}
      {data.promises.length > 0 && <Label>Promised</Label>}
      {data.promises.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", fontSize: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ display: "flex" }}>{p.date}</span>
            <Tag tone={p.status === "missed" ? "owed" : undefined}>{STATUS[p.status]}</Tag>
          </div>
          <span style={{ display: "flex" }}>{formatNaira(p.amountKobo)}</span>
        </div>
      ))}
    </CardFrame>
  );
}
