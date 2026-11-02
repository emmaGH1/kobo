import { C, CardFrame, Label, assertCount } from "./card-kit";

/** Stock left per item; items at or below their reorder level are flagged and listed first. */
export type StockCardData = {
  shop: string;
  date: string;
  items: { item: string; unit: string; left: number; reorderAt: number }[];
  sample?: boolean;
};

export const isLow = (i: StockCardData["items"][number]) => i.left <= i.reorderAt;

export function validateStock(d: StockCardData) {
  if (d.items.length > 8) throw new Error("At most 8 items per card");
  for (const i of d.items) {
    assertCount(i.left, "quantity left");
    assertCount(i.reorderAt, "reorder level");
  }
}

export function StockCard({ data, fontFamily = "DejaVu" }: { data: StockCardData; fontFamily?: string }) {
  validateStock(data);
  const items = [...data.items].sort((a, b) => Number(isLow(b)) - Number(isLow(a)));
  const low = items.filter(isLow).length;
  return (
    <CardFrame demo="stock-card" date={data.date} sample={data.sample} kicker={data.shop} fontFamily={fontFamily} footer="From the stock you recorded. Kobo warns you; it never orders for you.">
      <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
        <span style={{ display: "flex", fontSize: 24, letterSpacing: 2 }}>RUNNING LOW</span>
        <span style={{ display: "flex", fontSize: 88, marginTop: 8, letterSpacing: -3, color: low ? C.owed : C.paid }}>{low === 0 ? "Nothing" : `${low} ${low === 1 ? "item" : "items"}`}</span>
        <div style={{ display: "flex", height: 6, width: 245, background: C.lav, marginTop: 10 }} />
      </div>
      <Label mt={52}>Stock left</Label>
      {items.map((i) => (
        <div key={i.item} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `1px solid ${C.rule}`, padding: "16px 0", fontSize: 30 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ display: "flex" }}>{i.item}</span>
            <span style={{ display: "flex", fontSize: 20, color: isLow(i) ? C.owed : C.ink2, marginTop: 4 }}>{isLow(i) ? `Low · reorder at ${i.reorderAt} ${i.unit}` : `Reorder at ${i.reorderAt} ${i.unit}`}</span>
          </div>
          <span style={{ display: "flex", color: isLow(i) ? C.owed : C.ink }}>{`${i.left} ${i.unit}`}</span>
        </div>
      ))}
    </CardFrame>
  );
}
