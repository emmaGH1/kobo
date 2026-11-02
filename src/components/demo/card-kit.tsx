import type { ReactNode } from "react";

/**
 * Shared building blocks for every Kobo image card (summary, receipt, debtors, …). Inline styles
 * only, and every multi-child element is display:flex, so cards render both in next/og (Satori)
 * and in the browser/Remotion. Cards are 1080×1350 (4:5, fills a phone in WhatsApp).
 * Cards never calculate money: amounts arrive as integer kobo from code that owns the ledger.
 */
export const CARD = { width: 1080, height: 1350 } as const;
export const C = {
  bg: "#F4F4F1",
  paper: "#FFFFFF",
  ink: "#2D2C2A",
  ink2: "#5E5A52",
  ink3: "#7D776C",
  rule: "#E1E0DC",
  border: "#DAD9D5",
  lav: "#92A9E1",
  lavSoft: "#E4EAF8",
  owed: "#A63D2A",
  paid: "#2F6B48",
} as const;
export type Tone = "owed" | "paid" | "muted";
const toneColor = (t?: Tone) => (t === "owed" ? C.owed : t === "paid" ? C.paid : t === "muted" ? C.ink2 : C.ink);

/** ₦ formatting from integer kobo (DESIGN.md §3). Throws on floats, negatives or unsafe integers. */
export function formatNaira(kobo: number): string {
  if (!Number.isSafeInteger(kobo) || kobo < 0) throw new Error("Invalid kobo amount");
  const whole = Math.floor(kobo / 100).toLocaleString("en-NG");
  const fraction = kobo % 100;
  return `₦${whole}${fraction ? `.${String(fraction).padStart(2, "0")}` : ""}`;
}

export function assertCount(n: number, what: string) {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`Invalid ${what}`);
}

export function CardFrame({
  demo,
  date,
  sample,
  kicker,
  footer,
  fontFamily = "DejaVu",
  children,
}: {
  /** data-demo hook for capture. */
  demo: string;
  date: string;
  sample?: boolean;
  /** Small caps line under the header, usually the shop name. */
  kicker?: string;
  footer: string;
  fontFamily?: string;
  children: ReactNode;
}) {
  return (
    <div data-demo={demo} style={{ width: "100%", height: "100%", display: "flex", background: C.bg, padding: 64, fontFamily }}>
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.paper, color: C.ink, padding: "64px 70px", border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${C.ink}`, paddingBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 45 }}>
            <span style={{ background: C.lav, padding: "0 10px" }}>k</span>obo
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right", fontSize: 22, color: C.ink2 }}>
            <span>{date}</span>
            {sample && <span>SAMPLE DATA</span>}
          </div>
        </div>
        {kicker && <span style={{ display: "flex", fontSize: 20, letterSpacing: 2, color: C.ink2, paddingTop: 32 }}>{kicker.toUpperCase()}</span>}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>{children}</div>
        <div style={{ display: "flex", borderTop: `2px solid ${C.ink}`, paddingTop: 24, fontSize: 20, color: C.ink2 }}>{footer}</div>
      </div>
    </div>
  );
}

/** Small caps section label. */
export function Label({ children, mt = 42 }: { children: string; mt?: number }) {
  return <span style={{ display: "flex", fontSize: 22, letterSpacing: 2, color: C.ink2, marginTop: mt, marginBottom: 12 }}>{children.toUpperCase()}</span>;
}

/** The card's one big figure, with the lavender underline. */
export function Hero({ label, value, tone, mt = 44 }: { label: string; value: string; tone?: Tone; mt?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: mt }}>
      <span style={{ display: "flex", fontSize: 24, letterSpacing: 2 }}>{label.toUpperCase()}</span>
      <span style={{ display: "flex", fontSize: 88, marginTop: 8, letterSpacing: -3, color: toneColor(tone) }}>{value}</span>
      <div style={{ display: "flex", height: 6, width: 245, background: C.lav, marginTop: 10 }} />
    </div>
  );
}

/** A label/value row. `ruled` adds the hairline used in "TODAY" lists. */
export function Line({ left, right, tone, sub, ruled = true, size = 30 }: { left: string; right: string; tone?: Tone; sub?: string; ruled?: boolean; size?: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: ruled ? `1px solid ${C.rule}` : "none", padding: ruled ? "16px 0" : "10px 0", fontSize: size }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ display: "flex" }}>{left}</span>
        {sub && <span style={{ display: "flex", fontSize: 20, color: C.ink2, marginTop: 4 }}>{sub}</span>}
      </div>
      <span style={{ display: "flex", color: toneColor(tone) }}>{right}</span>
    </div>
  );
}

/** A lavender-highlighted tag, e.g. "PART PAID" or "CHECK". */
export function Tag({ children, tone }: { children: string; tone?: Tone }) {
  return (
    <span style={{ display: "flex", alignSelf: "flex-start", fontSize: 20, letterSpacing: 2, padding: "4px 12px", background: tone === "owed" ? "#F6E3DF" : C.lavSoft, color: tone === "owed" ? C.owed : C.ink }}>
      {children.toUpperCase()}
    </span>
  );
}
