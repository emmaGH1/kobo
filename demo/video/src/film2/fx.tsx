import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties, ReactNode } from "react";
import wordtimes from "../wordtimes.json";

export const FPS = 30;
export const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

export function tw(f: number, start: number, dur: number, from = 0, to = 1, ease = easeIO) {
  return interpolate(f, [start, start + dur], [from, to], { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}
export function sp(f: number, start: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) {
  return spring({ frame: f - start, fps: FPS, config: { damping: 18, stiffness: 120, mass: 1, ...cfg } });
}

type WT = [string, number][];
export const words = (m: string): WT => (wordtimes as Record<string, WT>)[m];
/** Frame at which the n-th occurrence of `word` (case-insensitive, punctuation stripped) is spoken in movement m. */
export function at(m: string, word: string, nth = 1, offsetSec = 0) {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  let seen = 0;
  for (const [w, t] of words(m)) {
    if (clean(w) === clean(word) && ++seen === nth) return Math.round((t + offsetSec) * FPS);
  }
  throw new Error(`word ${word} not found in ${m}`);
}

export const C = {
  ink: "#2D2C2A",
  lav: "#92A9E1",
  lavDeep: "#3D52A0",
  paper: "#F6F1E7",
  cream: "#F6EBDD",
  biro: "#2A3A9E",
  owed: "#C0533F",
  paid: "#6FCF97",
};

/** Animated film grain. */
export function Grain({ opacity = 0.07 }: { opacity?: number }) {
  const f = useCurrentFrame();
  const seed = f % 7;
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
}

export function Vignette({ strength = 0.75 }: { strength?: number }) {
  return <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 45%, transparent 45%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: "none" }} />;
}

/** A warm, soft light that drifts slowly. */
export function Glow({ x, y, size, color, opacity = 1 }: { x: number; y: number; size: number; color: string; opacity?: number }) {
  return <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle, ${color} 0%, transparent 65%)`, opacity, filter: "blur(20px)" }} />;
}

/** Digits that roll into place like a counter. */
export function NumberRoll({ value, start, f, style, duration = 18 }: { value: string; start: number; f: number; style?: CSSProperties; duration?: number }) {
  const chars = value.split("");
  return (
    <span style={{ display: "inline-flex", overflow: "hidden", lineHeight: 1, ...style }}>
      {chars.map((c, i) => {
        if (!/[0-9]/.test(c)) return <span key={i} style={{ opacity: tw(f, start + i * 2, 8) }}>{c}</span>;
        const d = Number(c);
        const p = tw(f, start + i * 2.5, duration, 0, 1, easeOut);
        const pos = (10 + d) * p; // roll through one full cycle into the digit
        return (
          <span key={i} style={{ display: "inline-block", height: "1em", overflow: "hidden", position: "relative" }}>
            <span style={{ display: "flex", flexDirection: "column", transform: `translateY(${-pos}em)` }}>
              {Array.from({ length: 21 }).map((_, k) => <span key={k} style={{ height: "1em" }}>{k % 10}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Big serif words that rise in letter by letter, sharpening from a blur. */
export function Kinetic({ text, start, f, size = 140, style, italic, color = C.cream, stagger = 1.6 }: { text: string; start: number; f: number; size?: number; style?: CSSProperties; italic?: boolean; color?: string; stagger?: number }) {
  return (
    <div style={{ fontFamily: "var(--font-serif)", fontSize: size, letterSpacing: "-0.035em", lineHeight: 1, color, fontStyle: italic ? "italic" : "normal", whiteSpace: "pre", ...style }}>
      {text.split("").map((ch, i) => {
        const p = sp(f, start + i * stagger, { damping: 20, stiffness: 140 });
        return (
          <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 0.35}em)`, filter: `blur(${(1 - p) * 10}px)` }}>
            {ch === " " ? " " : ch}
          </span>
        );
      })}
    </div>
  );
}

/** A lavender highlighter stroke that draws left to right. */
export function Mark({ start, f, width, top, left, height = 14 }: { start: number; f: number; width: number; top: number; left: number; height?: number }) {
  const p = tw(f, start, 14, 0, 1, easeOut);
  return <div style={{ position: "absolute", left, top, width: width * p, height, background: C.lav, borderRadius: 3 }} />;
}

/** TourIQ-style caption: one line, word by word, one accent word. */
export function Caption({ m, f, offset = 0, accent = [] as string[] }: { m: string; f: number; offset?: number; accent?: string[] }) {
  const ws = words(m);
  const t = (f - offset) / FPS;
  // phrases break on . ? ! , and at 8 words
  const phrases: [string, number][][] = [];
  let cur: [string, number][] = [];
  ws.forEach((w) => {
    cur.push(w);
    if (/[.?!,]["”]?$/.test(w[0]) || cur.length >= 8) {
      phrases.push(cur);
      cur = [];
    }
  });
  if (cur.length) phrases.push(cur);
  let ph = phrases.find((p, i) => t >= p[0][1] - 0.05 && (i === phrases.length - 1 || t < phrases[i + 1][0][1] - 0.05));
  if (!ph) return null;
  if (/^["“]/.test(ph[0][0])) return null; // character lines are shown as quotes, not captions
  const last = ph[ph.length - 1][1];
  const fade = t > last + 1.6 ? 0 : 1;
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  let used = false;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 74, textAlign: "center", fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 34, letterSpacing: "-0.005em", color: "#fff", textShadow: "0 2px 24px rgba(0,0,0,0.65)", opacity: fade }}>
      {ph.map(([w, wt], i) => {
        const on = t >= wt - 0.03;
        const isAcc = !used && accent.includes(clean(w));
        if (isAcc) used = true;
        return (
          <span key={i} style={{ opacity: on ? 1 : 0, color: isAcc ? C.lav : undefined, transition: "none" }}>
            {w}{" "}
          </span>
        );
      })}
    </div>
  );
}

export function Stage({ children, perspective = 1600 }: { children: ReactNode; perspective?: number }) {
  return <AbsoluteFill style={{ perspective, transformStyle: "preserve-3d" }}>{children}</AbsoluteFill>;
}

export function useF() {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return { f, dur: durationInFrames };
}
