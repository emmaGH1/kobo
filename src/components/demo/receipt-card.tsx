import { CardFrame, Hero, Label, Line, Tag, assertCount, formatNaira } from "./card-kit";

/**
 * Proof of one sale, sent when a customer asks for it. Props only; every amount is integer kobo
 * from the ledger, and the card refuses to render if paid + owed doesn't equal the amount.
 */
export type ReceiptCardData = {
  shop: string;
  /** e.g. "MON 2 NOV · 12:11 PM" */
  date: string;
  ref: string;
  customer: string;
  item: string;
  /** Quantity as recorded, e.g. "2 bags". */
  qty: string;
  amountKobo: number;
  paidKobo: number;
  owedKobo: number;
  /** Promised date for the balance, if one was confirmed, e.g. "Fri 6 Nov". */
  due?: string;
  sample?: boolean;
};

export function validateReceipt(d: ReceiptCardData) {
  for (const k of [d.amountKobo, d.paidKobo, d.owedKobo]) assertCount(k, "receipt amount");
  if (d.paidKobo + d.owedKobo !== d.amountKobo) throw new Error("Receipt does not balance: paid + owed must equal amount");
  if (!d.ref || !d.customer || !d.item) throw new Error("Receipt is missing ref, customer or item");
}

export function ReceiptCard({ data, fontFamily = "DejaVu" }: { data: ReceiptCardData; fontFamily?: string }) {
  validateReceipt(data);
  const status = data.owedKobo === 0 ? "Paid in full" : data.paidKobo === 0 ? "On credit" : "Part paid";
  return (
    <CardFrame demo="receipt-card" date={data.date} sample={data.sample} kicker={data.shop} fontFamily={fontFamily} footer={`Receipt ${data.ref} · confirmed by ${data.shop} and kept in its Kobo book.`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 44 }}>
        <span style={{ display: "flex", fontSize: 24, letterSpacing: 2 }}>RECEIPT · {data.ref}</span>
        <Tag tone={data.owedKobo > 0 ? "owed" : undefined}>{status}</Tag>
      </div>
      <span style={{ display: "flex", fontSize: 56, marginTop: 18, letterSpacing: -1 }}>{data.customer}</span>
      <Label mt={40}>Sale</Label>
      <Line left={data.item} sub={data.qty} right={formatNaira(data.amountKobo)} />
      <Line left="Paid" right={formatNaira(data.paidKobo)} tone="paid" />
      <Line left="Balance" sub={data.owedKobo > 0 && data.due ? `Promised for ${data.due}` : undefined} right={formatNaira(data.owedKobo)} tone={data.owedKobo > 0 ? "owed" : undefined} />
      <Hero label={data.owedKobo > 0 ? "Still owed on this sale" : "Paid on this sale"} value={formatNaira(data.owedKobo > 0 ? data.owedKobo : data.paidKobo)} tone={data.owedKobo > 0 ? "owed" : "paid"} mt={56} />
    </CardFrame>
  );
}
