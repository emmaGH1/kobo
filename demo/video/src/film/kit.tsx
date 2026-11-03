import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties, ReactNode } from "react";
import narration from "../narration.json";
import durations from "../durations.json";

export const FPS = 30;
export const PAD = 0.8; // seconds of air after each movement's narration
export type Mid = "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7" | "M8";
export const ORDER: Mid[] = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"];

export const sceneFrames = (m: Mid) => Math.round((durations[m] + PAD) * FPS);
export const lines = (m: Mid): string[] => (narration as Record<string, string[]>)[m];

/** Frame at which narration line i of movement m starts (proportional to word count). */
export function lineStart(m: Mid, i: number) {
  const ls = lines(m);
  const counts = ls.map((l) => l.split(/\s+/).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const before = counts.slice(0, i).reduce((a, b) => a + b, 0);
  return Math.round((before / total) * durations[m] * FPS);
}

export const ease = Easing.bezier(0.65, 0, 0.35, 1);
export function tween(frame: number, start: number, dur: number, from = 0, to = 1) {
  return interpolate(frame, [start, start + dur], [from, to], { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

export const C = {
  ink: "#2D2C2A",
  graphite: "#1E1D1B",
  lav: "#92A9E1",
  paper: "#F4F0E6",
  dusk: "#24170F",
  amber: "rgba(214,140,70,0.38)",
};

export function Backdrop({ look }: { look: "dusk" | "graphite" }) {
  const bg =
    look === "dusk"
      ? `radial-gradient(55% 65% at 40% 45%, ${C.amber}, rgba(214,140,70,0) 70%), radial-gradient(40% 40% at 80% 70%, rgba(146,169,225,0.2), transparent 70%), ${C.dusk}`
      : `radial-gradient(60% 70% at 38% 45%, rgba(146,169,225,0.30), rgba(146,169,225,0) 70%), ${C.graphite}`;
  return <AbsoluteFill style={{ background: bg }} />;
}

const KEYWORDS = ["later", "remembers", "save", "Friday", "Muse Voice", "Muse Spark", "WhatsApp", "notebook", "guessing", "maths", "square", "Kobo"];

/** One-line, word-by-word caption for the current narration line. At most one lavender word. */
export function Captions({ m, dark = true }: { m: Mid; dark?: boolean }) {
  const frame = useCurrentFrame();
  const ls = lines(m);
  let idx = 0;
  for (let i = 0; i < ls.length; i++) if (frame >= lineStart(m, i)) idx = i;
  const start = lineStart(m, idx);
  const end = idx + 1 < ls.length ? lineStart(m, idx + 1) : sceneFrames(m);
  const words = ls[idx].split(/\s+/);
  // chunk long lines into pieces of <= 11 words, each shown in its share of the time
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += 11) chunks.push(words.slice(i, i + 11));
  const per = (end - start) / words.length;
  let shownWords = Math.floor((frame - start) / per) + 1;
  let chunkIdx = Math.min(chunks.length - 1, Math.floor((shownWords - 1) / 11));
  const chunk = chunks[chunkIdx];
  const inChunk = shownWords - chunkIdx * 11;
  const key = KEYWORDS.find((k) => chunk.join(" ").includes(k));
  let keyDone = false;
  return (
    <div style={{ position: "absolute", left: 120, right: 120, bottom: 40, textAlign: "center", padding: "10px 0", background: dark ? "linear-gradient(180deg, transparent, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.35) 60%, transparent)" : "none", fontFamily: "var(--font-sans)", fontSize: 38, lineHeight: 1.3, color: dark ? "#F4F0E6" : C.ink, textShadow: dark ? "0 2px 18px rgba(0,0,0,0.55)" : "none" }}>
      {chunk.map((w, i) => {
        const clean = w.replace(/[.,?!"']/g, "");
        const isKey = !keyDone && key && key.split(" ")[0] === clean;
        if (isKey) keyDone = true;
        return (
          <span key={i} style={{ opacity: i < inChunk ? 1 : 0, transition: "none" }}>
            <span style={isKey ? { background: C.lav, color: C.ink, padding: "0 8px", borderRadius: 6 } : undefined}>{w}</span>{" "}
          </span>
        );
      })}
    </div>
  );
}

export function Float({ x, y, children, style }: { x: number; y: number; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: "absolute", left: x, top: y, ...style }}>{children}</div>;
}

/** A small "later" card: something sold but not written down. */
export function LaterCard({ item, who, amount, when, blur = 0, rot = 0 }: { item: string; who?: string; amount: string; when?: string; blur?: number; rot?: number }) {
  return (
    <div style={{ background: "rgba(250,248,242,0.95)", color: C.ink, borderRadius: 14, padding: "14px 18px", minWidth: 250, fontFamily: "var(--font-sans)", boxShadow: "0 30px 60px -25px rgba(0,0,0,0.6)", filter: `blur(${blur}px)`, transform: `rotate(${rot}deg)` }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 26 }}>{item}</div>
      <div style={{ fontSize: 18, color: "#5E5A52", marginTop: 4 }}>
        {who ? `${who} · ` : ""}
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: C.ink }}>{amount}</span>
        {when ? ` · ${when}` : ""}
      </div>
    </div>
  );
}

export function useScene() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return { frame, total: durationInFrames };
}
