import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { CSSProperties, ReactNode } from "react";
import { C, tw, easeOut } from "./fx";

/** The dark product world: near-black with slow, out-of-focus lavender and amber light. */
export function Bokeh({ warmth = 0.5, intensity = 1 }: { warmth?: number; intensity?: number }) {
  const f = useCurrentFrame();
  const t = f / 30;
  const blobs = [
    { x: 0.22, y: 0.3, r: 900, c: `rgba(214,120,60,${0.55 * warmth})`, sx: 0.07, sy: 0.05 },
    { x: 0.78, y: 0.65, r: 1000, c: `rgba(146,169,225,${0.42 * (1.2 - warmth)})`, sx: 0.05, sy: 0.08 },
    { x: 0.6, y: 0.18, r: 600, c: `rgba(240,160,90,${0.35 * warmth})`, sx: 0.09, sy: 0.06 },
    { x: 0.35, y: 0.85, r: 700, c: `rgba(120,140,220,${0.3 * (1.2 - warmth)})`, sx: 0.06, sy: 0.04 },
  ];
  return (
    <AbsoluteFill style={{ background: "#0B0807", overflow: "hidden" }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (b.x + Math.sin(t * b.sx * 6 + i) * 0.06) * 1920 - b.r / 2,
            top: (b.y + Math.cos(t * b.sy * 6 + i * 2) * 0.06) * 1080 - b.r / 2,
            width: b.r,
            height: b.r,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.c} 0%, transparent 62%)`,
            filter: "blur(40px)",
            opacity: intensity,
          }}
        />
      ))}
    </AbsoluteFill>
  );
}

export const bloom = (color = "255,240,225", strength = 1): CSSProperties => ({
  textShadow: `0 0 ${12 * strength}px rgba(${color},0.55), 0 0 ${38 * strength}px rgba(${color},0.35), 0 0 ${90 * strength}px rgba(255,170,110,0.25)`,
});

/** Split-flap counter, the film's recurring motif. `uncertain` flickers some digits as "?". */
export function FlipCounter({ value, label, f, changedAt, uncertain = 0, settle = false, style }: { value: string; label: string; f: number; changedAt: number; uncertain?: number; settle?: boolean; style?: CSSProperties }) {
  const chars = value.split("");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, ...style }}>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 16, letterSpacing: "0.32em", color: "rgba(246,235,221,0.75)" }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {chars.map((c, i) => {
          const flip = tw(f, changedAt + i * 2, 8);
          const glitch = uncertain > 0 && /[0-9]/.test(c) && i % 2 === 1 && Math.sin(f * 1.7 + i * 3) > 1 - uncertain * 1.4;
          const shown = glitch ? "?" : c;
          const isSym = !/[0-9?]/.test(shown);
          return (
            <div
              key={i}
              style={{
                width: isSym ? 46 : 72,
                height: 104,
                borderRadius: 10,
                background: isSym ? "transparent" : "linear-gradient(180deg, rgba(40,36,34,0.92) 0 49%, rgba(0,0,0,0.6) 49% 51%, rgba(30,27,25,0.92) 51%)",
                boxShadow: isSym ? "none" : "0 18px 40px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-serif)",
                fontSize: 74,
                color: shown === "?" ? "#F2877C" : settle ? C.paid : C.cream,
                transform: `perspective(400px) rotateX(${(1 - flip) * -90}deg)`,
                transformOrigin: "50% 50%",
                ...bloom(shown === "?" ? "242,135,124" : "255,240,225", 0.6),
              }}
            >
              {shown}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A callout drawn into footage: a dot on the subject, a line, and a tag. */
export function Callout({ from, to, f, start, children, end = 99999 }: { from: [number, number]; to: [number, number]; f: number; start: number; end?: number; children: ReactNode }) {
  const dot = tw(f, start, 8, 0, 1, easeOut);
  const line = tw(f, start + 4, 14, 0, 1, easeOut);
  const tag = tw(f, start + 12, 12, 0, 1, easeOut);
  const out = 1 - tw(f, end, 14);
  const [x1, y1] = from;
  const [x2, y2] = to;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle cx={x1} cy={y1} r={9 * dot} fill="none" stroke="#fff" strokeWidth={2} opacity={0.9} />
        <circle cx={x1} cy={y1} r={3.5 * dot} fill="#fff" />
        <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * line} y2={y1 + (y2 - y1) * line} stroke="rgba(255,255,255,0.85)" strokeWidth={1.6} />
      </svg>
      <div style={{ position: "absolute", left: x2, top: y2, transform: `translate(${x2 > x1 ? 0 : -100}%, -50%) translateY(${(1 - tag) * 14}px)`, opacity: tag }}>{children}</div>
    </AbsoluteFill>
  );
}

/** Small frosted tag used in callouts. */
export function Tag({ title, amount, note, tone = "cream" }: { title: string; amount?: string; note?: string; tone?: "cream" | "warn" }) {
  return (
    <div style={{ background: "rgba(20,16,14,0.62)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 14, padding: "14px 20px", color: C.cream, minWidth: 230, boxShadow: "0 20px 50px -20px rgba(0,0,0,0.7)" }}>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, letterSpacing: "0.22em", color: tone === "warn" ? "#F2A08F" : "rgba(246,235,221,0.65)" }}>NOT WRITTEN DOWN</div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, marginTop: 6 }}>{title}</div>
      {amount && <div style={{ fontFamily: "var(--font-serif)", fontSize: 44, marginTop: 2, ...bloom("255,240,225", 0.4) }}>{amount}</div>}
      {note && <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 24, color: C.lav, marginTop: 4 }}>{note}</div>}
    </div>
  );
}
