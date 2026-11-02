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

export function formatNaira(kobo: number): string {
  if (!Number.isSafeInteger(kobo) || kobo < 0) throw new Error("Invalid kobo amount");
  const whole = Math.floor(kobo / 100).toLocaleString("en-NG");
  const fraction = kobo % 100;
  return `₦${whole}${fraction ? `.${String(fraction).padStart(2, "0")}` : ""}`;
}

export function validateSummaryCard(data: SummaryCardData) {
  if (!Number.isSafeInteger(data.entries) || data.entries < 0 || data.biggest.length > 3) throw new Error("Invalid summary card data");
}

/** `fontFamily` must be loaded by the host (next/og passes DejaVu; Remotion can load its own). */
export function SummaryCard({ data, fontFamily = "DejaVu" }: { data: SummaryCardData; fontFamily?: string }) {
  validateSummaryCard(data);
  const rows = [
    ["Credit sales", formatNaira(data.creditKobo)],
    ["Money collected", formatNaira(data.collectedKobo)],
    ["Stock bought", formatNaira(data.stockKobo)],
    ["Entries saved", String(data.entries)],
  ];
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#F4F4F1", padding: 64, fontFamily }} data-demo="summary-card">
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FFFFFF", color: "#2D2C2A", padding: "64px 70px", border: "1px solid #DAD9D5" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #2D2C2A", paddingBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 45 }}><span style={{ background: "#92A9E1", padding: "0 10px" }}>k</span>obo</div>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "right", fontSize: 22, color: "#5E5A52" }}><span>{data.date}</span>{data.sample && <span>SAMPLE DATA</span>}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", paddingTop: 32 }}>
          <span style={{ fontSize: 20, letterSpacing: 2, color: "#5E5A52" }}>{data.shop.toUpperCase()}</span>
          <span style={{ fontSize: 24, letterSpacing: 2, marginTop: 44 }}>PEOPLE OWE YOU</span>
          <span style={{ fontSize: 88, marginTop: 8, letterSpacing: -3 }}>{formatNaira(data.owedKobo)}</span>
          <div style={{ height: 6, width: 245, background: "#92A9E1", marginTop: 10 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 56 }}>
          <span style={{ fontSize: 22, letterSpacing: 2, color: "#5E5A52", marginBottom: 14 }}>TODAY</span>
          {rows.map(([label, amount]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #E1E0DC", padding: "16px 0", fontSize: 30 }}><span>{label}</span><span>{amount}</span></div>)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 42 }}>
          <span style={{ fontSize: 22, letterSpacing: 2, color: "#5E5A52", marginBottom: 12 }}>BIGGEST BALANCES</span>
          {data.biggest.length === 0 ? <span style={{ fontSize: 28 }}>No outstanding balances</span> : data.biggest.map((item, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 28 }}><span>{item.name}</span><span>{formatNaira(item.owedKobo)}</span></div>)}
        </div>
        <div style={{ display: "flex", marginTop: "auto", borderTop: "2px solid #2D2C2A", paddingTop: 24, fontSize: 20, color: "#5E5A52" }}>Counted by code from {data.entries} confirmed {data.entries === 1 ? "entry" : "entries"}.</div>
      </div>
    </div>);
}
