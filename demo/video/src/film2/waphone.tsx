import type { CSSProperties, ReactNode } from "react";
import { KoboMark } from "../../../../src/components/demo";

/** WhatsApp iOS light theme (the real channel), drawn in code. */
export const W = {
  wall: "#EFE7DE",
  bar: "#F6F6F6",
  out: "#D9FDD3",
  text: "#111B21",
  meta: "#667781",
  blue: "#007AFF",
  link: "#027EB5",
  green: "#25D366",
  red: "#FF3B30",
};

/** A light doodle wallpaper (our own simple line shapes, in WhatsApp's spirit). */
function Doodles() {
  const shapes = [
    (x: number, y: number) => <circle cx={x} cy={y} r={7} />,
    (x: number, y: number) => <path d={`M${x - 8} ${y + 6} q8 -16 16 0`} />,
    (x: number, y: number) => <rect x={x - 6} y={y - 6} width={12} height={12} rx={3} />,
    (x: number, y: number) => <path d={`M${x} ${y - 8} l2.4 5 5.6 .8 -4 4 1 5.6 -5 -2.6 -5 2.6 1 -5.6 -4 -4 5.6 -.8z`} />,
    (x: number, y: number) => <path d={`M${x - 7} ${y} h14 M${x} ${y - 7} v14`} />,
    (x: number, y: number) => <path d={`M${x - 6} ${y - 5} h12 l-2 11 h-8z`} />,
  ];
  const items = [];
  for (let r = 0; r < 18; r++) for (let c = 0; c < 8; c++) {
    const x = c * 52 + (r % 2) * 26 + 14;
    const y = r * 50 + 20;
    items.push(<g key={`${r}-${c}`}>{shapes[(r * 3 + c) % shapes.length](x, y)}</g>);
  }
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} fill="none" stroke="rgba(80,70,55,0.09)" strokeWidth={1.6}>
      {items}
    </svg>
  );
}

function StatusBar() {
  return (
    <div style={{ height: 54, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 30px 8px 34px", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 17, color: W.text, background: W.bar }}>
      <span>9:41</span>
      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor" /><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor" /><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.4c2.2 0 4.2.9 5.7 2.3l1.1-1.1A9.6 9.6 0 0 0 8 .8 9.6 9.6 0 0 0 1.2 3.6l1.1 1.1A8 8 0 0 1 8 2.4Zm0 3.2c1.3 0 2.5.5 3.4 1.4l1.1-1.1A6.4 6.4 0 0 0 8 4c-1.8 0-3.4.7-4.5 1.9L4.6 7c.9-.9 2.1-1.4 3.4-1.4Zm0 3.2c-.5 0-1 .2-1.3.6L8 10.6l1.3-1.2A1.8 1.8 0 0 0 8 8.8Z" fill="currentColor" /></svg>
        <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="22" height="12" rx="3.8" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="18" height="9" rx="2.2" fill="currentColor" /><rect x="24" y="4.5" width="1.6" height="4" rx=".8" fill="currentColor" opacity=".4" /></svg>
      </span>
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div style={{ height: 58, display: "flex", alignItems: "center", gap: 8, padding: "0 12px 0 6px", background: W.bar, borderBottom: "0.5px solid rgba(0,0,0,0.15)", fontFamily: "var(--font-sans)" }}>
      <svg width="13" height="22" viewBox="0 0 13 22"><path d="M11 2 2 11l9 9" fill="none" stroke={W.blue} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span style={{ color: W.blue, fontSize: 17, marginLeft: -2 }}>12</span>
      <span style={{ width: 38, height: 38, borderRadius: 19, overflow: "hidden", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 4 }}>
        <KoboMark className="size-8" />
      </span>
      <span style={{ flex: 1, lineHeight: 1.15, marginLeft: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 17, fontWeight: 600, color: W.text }}>
          Kobo
          <svg width="15" height="15" viewBox="0 0 24 24"><path d="M12 1.5l2.6 2 3.3-.3 1 3.1 2.8 1.8-1 3.2 1 3.1-2.8 1.8-1 3.1-3.3-.3-2.6 2-2.6-2-3.3.3-1-3.1L1.3 15l1-3.2-1-3.1 2.8-1.8 1-3.1 3.3.3z" fill={W.green} /><path d="M7.5 12.2l3 3 6-6.2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span style={{ fontSize: 13, color: W.meta }}>{subtitle}</span>
      </span>
      <svg width="26" height="18" viewBox="0 0 26 18" style={{ marginRight: 18 }}><rect x="1" y="2" width="16" height="14" rx="3.5" fill="none" stroke={W.blue} strokeWidth="1.9" /><path d="M17 7.5l7-4v11l-7-4z" fill="none" stroke={W.blue} strokeWidth="1.9" strokeLinejoin="round" /></svg>
      <svg width="20" height="20" viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="none" stroke={W.blue} strokeWidth="1.8" /></svg>
    </div>
  );
}

/** The real WhatsApp composer: +, message field with sticker, camera, mic. Or the recording bar. */
function Composer({ recording, recSeconds = 0, typed }: { recording?: boolean; recSeconds?: number; typed?: string }) {
  const base: CSSProperties = { height: 62, display: "flex", alignItems: "center", gap: 12, padding: "6px 14px 26px", background: W.bar, borderTop: "0.5px solid rgba(0,0,0,0.12)", fontFamily: "var(--font-sans)", boxSizing: "content-box" };
  if (recording) {
    const pulse = 0.55 + 0.45 * Math.abs(Math.sin(recSeconds * 4));
    const s = Math.floor(recSeconds);
    return (
      <div style={base}>
        <svg width="22" height="22" viewBox="0 0 24 24" style={{ opacity: pulse }}><rect x="9" y="2" width="6" height="12" rx="3" fill={W.red} /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" stroke={W.red} strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
        <span style={{ fontSize: 17, color: W.text, fontVariantNumeric: "tabular-nums", width: 44 }}>0:{String(s).padStart(2, "0")}</span>
        <span style={{ flex: 1, textAlign: "center", fontSize: 16, color: W.meta }}>‹ slide to cancel</span>
        <span style={{ width: 54, height: 54, borderRadius: 27, background: W.blue, display: "flex", alignItems: "center", justifyContent: "center", transform: "scale(1.15)", boxShadow: "0 6px 20px rgba(0,122,255,0.4)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3" fill="#fff" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
        </span>
      </div>
    );
  }
  return (
    <div style={base}>
      <svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" stroke={W.blue} strokeWidth="2.2" strokeLinecap="round" /></svg>
      <span style={{ flex: 1, height: 38, borderRadius: 19, background: "#fff", border: "0.5px solid rgba(0,0,0,0.18)", display: "flex", alignItems: "center", padding: "0 10px 0 16px", fontSize: 17, color: typed ? W.text : "#A0A7AC" }}>
        <span style={{ flex: 1 }}>{typed ?? ""}</span>
        <svg width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="6" fill="none" stroke={W.blue} strokeWidth="1.8" /><circle cx="9" cy="10" r="1.2" fill={W.blue} /><circle cx="15" cy="10" r="1.2" fill={W.blue} /><path d="M8.5 14.5c2 2 5 2 7 0" stroke={W.blue} strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
      </span>
      <svg width="26" height="22" viewBox="0 0 26 22"><path d="M2 6.5c0-1.4 1.1-2.5 2.5-2.5h3.4L10 1h6l2.1 3h3.4C22.9 4 24 5.1 24 6.5V18c0 1.4-1.1 2.5-2.5 2.5h-17C3.1 20.5 2 19.4 2 18z" fill="none" stroke={W.blue} strokeWidth="1.8" /><circle cx="13" cy="12" r="4.5" fill="none" stroke={W.blue} strokeWidth="1.8" /></svg>
      <svg width="22" height="24" viewBox="0 0 24 24"><rect x="8.5" y="2" width="7" height="12.5" rx="3.5" fill="none" stroke={W.blue} strokeWidth="1.8" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" stroke={W.blue} strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
    </div>
  );
}

/** iPhone 15 Pro running WhatsApp, chat with Kobo. Width 410 x 860. */
export function WaPhone({ children, subtitle = "business account", recording, recSeconds, typed, scrollY = 0, style }: { children?: ReactNode; subtitle?: string; recording?: boolean; recSeconds?: number; typed?: string; scrollY?: number; style?: CSSProperties }) {
  return (
    <div style={{ width: 410, height: 860, borderRadius: 66, padding: 11, background: "linear-gradient(145deg, #5b5856, #2a2827 40%, #3d3a38 70%, #1c1b1a)", boxShadow: "0 80px 140px -40px rgba(0,0,0,0.9), inset 0 0 0 1.5px rgba(255,255,255,0.18)", position: "relative", ...style }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 56, overflow: "hidden", position: "relative", background: W.wall, display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 122, height: 36, borderRadius: 18, background: "#000", zIndex: 5 }} />
        <StatusBar />
        <Header subtitle={subtitle} />
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <Doodles />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6, transform: `translateY(${-scrollY}px)` }}>{children}</div>
        </div>
        <Composer recording={recording} recSeconds={recSeconds} typed={typed} />
        <div style={{ position: "absolute", bottom: 9, left: "50%", transform: "translateX(-50%)", width: 140, height: 5, borderRadius: 3, background: "#000" }} />
      </div>
    </div>
  );
}

/** A finger tap: soft circle that presses and fades. */
export function Tap({ x, y, p }: { x: number; y: number; p: number }) {
  if (p <= 0 || p >= 1) return null;
  const s = 0.6 + p * 0.8;
  return <div style={{ position: "absolute", left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: 34, background: "rgba(255,255,255,0.55)", border: "2px solid rgba(255,255,255,0.9)", transform: `scale(${s})`, opacity: 1 - p, boxShadow: "0 0 30px rgba(255,255,255,0.6)", pointerEvents: "none" }} />;
}
