import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { CSSProperties, ReactNode } from "react";
import "../compiled.css";
import words from "../v4words.json";
import durs from "../v4dur.json";
import { KoboBubble, TraderBubble, type ReplyView } from "../../../../src/components/demo";
import { KoboLogo, KoboMark } from "../../../../src/components/kobo/logo";
import { WaPhone } from "../film2/waphone";
import { C, easeOut, sp, tw } from "../film2/fx";

const FPS = 30;
const SERIF = "GeistSerifK, NairaSerifK, Georgia, serif";
const SANS = "GeistSansK, NairaSansK, sans-serif";
const PAPER = "#F4EEE3";
export const BLUR_NAMES = false;

/* ---------- voice timeline ---------- */
const DUR: Record<string, number> = durs as Record<string, number>;
const GAP: Record<string, number> = { S01: 30, S02: 50, S03: 24, S04: 26, S05: 105, S06: 28, S07: 28, S08: 30, S09: 36, S10: 28 };
const START: Record<string, number> = {};
{ let t = 0; let prev = ""; for (const k of Object.keys(GAP)) { t += (prev ? Math.round(DUR[prev] * 30) : 0) + GAP[k]; START[k] = t; prev = k; } }
export const film4Frames = START.S10 + Math.round(DUR.S10 * 30) + 120;
type WT = [string, number][];
const W = words as Record<string, WT>;
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
/** Absolute frame where `word` (nth occurrence) is spoken in section k. */
function wf(k: string, word: string, nth = 1, off = 0): number {
  let seen = 0;
  for (const [w, t] of W[k]) if (clean(w).startsWith(clean(word)) && ++seen === nth) return START[k] + Math.round((t + off) * FPS);
  return START[k] + Math.round(off * FPS);
}
const end = (k: string) => START[k] + Math.round(DUR[k] * FPS);

/* ---------- small pieces ---------- */
const ease = (f: number, a: number, d: number, from = 0, to = 1) => tw(f, a, d, from, to, easeOut);
function Rise({ f, at, children, style, dist = 26 }: { f: number; at: number; children: ReactNode; style?: CSSProperties; dist?: number }) {
  const p = sp(f, at, { damping: 20, stiffness: 140 });
  return <div style={{ opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * dist}px)`, filter: p < 0.98 ? `blur(${(1 - p) * 10}px)` : undefined, ...style }}>{children}</div>;
}
function Serif({ children, size = 64, color = C.ink, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) {
  return <div style={{ fontFamily: SERIF, fontSize: size, lineHeight: 1.04, letterSpacing: "-0.03em", color, ...style }}>{children}</div>;
}
function Eyebrow({ children, color = "#8A8478" }: { children: ReactNode; color?: string }) {
  return <div style={{ fontFamily: SANS, fontSize: 17, letterSpacing: "0.24em", textTransform: "uppercase", color }}>{children}</div>;
}
const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-US");

/** Live captions: the current phrase, words appearing as spoken. */
function Captions({ f }: { f: number }) {
  for (const k of Object.keys(START)) {
    const s = START[k];
    if (f < s - 3 || f > end(k) + 18) continue;
    const ws = W[k];
    const t = (f - s) / FPS;
    const phrases: WT[] = [];
    let cur: WT = [];
    ws.forEach((w) => { cur.push(w); if (/[.?!,:]$/.test(w[0]) || cur.length >= 7) { phrases.push(cur); cur = []; } });
    if (cur.length) phrases.push(cur);
    const ph = phrases.find((p, i) => t >= p[0][1] - 0.08 && (i === phrases.length - 1 || t < phrases[i + 1][0][1] - 0.08));
    if (!ph) return null;
    const FIX: Record<string, Record<string, string>> = { S03: { "45": "₦45,000", ",000,": "", "20,": "₦20,000," }, S04: { bio: "Bayo", COA: "Kobo", "3": "₦3,800", ",800": "", "38": "₦38,000", ",000,": "", three: "“three", eight: "eight”" }, S05: { who: "“who", they: "dey", "me": "me”", big: "biggest", as: "" }, S06: { Cobor: "Kobo" }, S08: { tricobo: "trykobo" }, S09: { pigeon: "pidgin" }, S10: { "sails,": "sales," } };
    const fix = (w: string) => (FIX[k] && w in FIX[k] ? FIX[k][w] : w.replace(/^Cobo/, "Kobo"));
    return (
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 42, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ padding: "10px 22px", borderRadius: 14, background: "rgba(45,44,42,0.86)", fontFamily: SANS, fontWeight: 500, fontSize: 30, color: "#FBF7EF", letterSpacing: "-0.005em" }}>
          {ph.map(([w, wt], i) => <span key={i} style={{ opacity: t >= wt - 0.04 ? 1 : 0.18 }}>{fix(w)}{i < ph.length - 1 ? " " : ""}</span>)}
        </div>
      </div>
    );
  }
  return null;
}

/* ================= 1 · the problem (0 → 900) ================= */
const DEBTS: [string, number, string][] = [
  ["Rice · Mama Chidi", 45000, "pay Friday"],
  ["2 cartons · Chinedu", 18000, "next week"],
  ["Oil · Bayo", 28000, "since Oct"],
  ["Iya Basira", 6000, "month end"],
  ["Tunde", 3500, "Saturday"],
  ["Emeka", 12000, "after market"],
  ["Ada", 1500, "soon"],
  ["Mama Nkechi", 33500, "Friday"],
];
function Head({ draw }: { draw: number }) {
  const d = "M1010 300c-70-40-180-30-240 40-50 60-50 140-20 200 10 20 0 40-20 60l-30 40c-10 15 0 30 20 30h25l5 50c3 30 30 45 60 40l55-8 10 80h190l-10-120c60-60 80-160 40-250-35-80-80-130-85-160z";
  return (
    <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
      <path d={d} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={2400} strokeDashoffset={2400 * (1 - draw)} transform="translate(-30,40)" />
    </svg>
  );
}
function Problem({ f }: { f: number }) {
  const cardAt = [wf("S01", "rice"), wf("S01", "cartons"), ...[0, 1, 2, 3, 4, 5].map((i) => wf("S01", "remember") + 8 + i * 9)];
  const headAt = wf("S01", "carry") - 6;
  const mixAt = wf("S01", "mixed");
  const slipAt = wf("S01", "slip");
  const goneAt = wf("S01", "quietly");
  const nbAt = wf("S01", "notebook") - 10;
  const nbOut = wf("S01", "either");
  const orbit = interpolate(f, [0, headAt, goneAt], [0, 0.6, 3.2], { extrapolateRight: "extend" });
  const total = DEBTS.reduce((s, d, i) => s + (f >= cardAt[i] ? d[1] * ease(f, cardAt[i], 14) : 0), 0);
  const gone = ease(f, goneAt, 40);
  const qs: [string, string][] = [["who", "Who took what?"], ["much", "How much?"], ["promised", "When will they pay?"]];
  const exit = 1 - ease(f, end("S01") + 12, 34);
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={{ position: "absolute", left: 120, top: 92 }}>
        <Rise f={f} at={10}><Eyebrow>Every market day</Eyebrow></Rise>
      </div>
      {/* the trader's head */}
      <Head draw={ease(f, headAt, 36)} />
      {/* questions */}
      <div style={{ position: "absolute", left: 120, top: 150, display: "flex", flexDirection: "column", gap: 6 }}>
        {qs.map(([w, q], i) => {
          const a = wf("S01", w);
          return f >= a - 2 ? <Rise key={i} f={f} at={a - 2}><Serif size={58} color={i === 2 ? C.ink : "#5D5A55"} style={{ opacity: 1 - ease(f, nbAt, 20) * 0.75 }}>{q}</Serif></Rise> : null;
        })}
      </div>
      {/* debt cards orbiting */}
      {DEBTS.map(([name, amt, when], i) => {
        if (f < cardAt[i]) return null;
        const p = sp(f, cardAt[i], { damping: 16, stiffness: 120 });
        const a = (i / DEBTS.length) * Math.PI * 2 + orbit;
        const depth = (Math.sin(a) + 1) / 2;
        const x = 960 + Math.cos(a) * 560 * Math.min(1, 0.4 + p);
        const y = 560 + Math.sin(a) * 250;
        const fade = 1 - ease(f, goneAt + i * 5, 18);
        const swapped = f > mixAt && f < mixAt + 26 && (i === 2 || i === 4) && Math.floor((f - mixAt) / 4) % 2 === 0;
        const label = swapped ? DEBTS[i === 2 ? 4 : 2][0] : name;
        const strike = ease(f, slipAt + i * 2, 12);
        return (
          <div key={i} style={{ position: "absolute", left: x - 150, top: y - 52, width: 300, zIndex: Math.round(depth * 100), opacity: p * fade * (0.55 + depth * 0.45), transform: `scale(${(0.78 + depth * 0.32) * (0.6 + 0.4 * p)}) rotate(${(i % 2 ? 1 : -1) * 2}deg)`, background: "#FFFDF8", borderRadius: 16, padding: "14px 18px", boxShadow: `0 ${10 + depth * 20}px ${30 + depth * 30}px -12px rgba(60,45,25,${0.25 + depth * 0.2})`, border: "1px solid rgba(45,44,42,0.08)" }}>
            <div style={{ fontFamily: SANS, fontSize: 18, color: swapped ? C.owed : "#6F6A62" }}>{label}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
              <span style={{ fontFamily: SERIF, fontSize: 36, color: C.ink, letterSpacing: "-0.02em" }}>{naira(amt)}</span>
              <span style={{ position: "relative", fontFamily: SANS, fontSize: 17, color: strike > 0.5 ? C.owed : "#8A8478" }}>
                {when}
                <span style={{ position: "absolute", left: 0, top: "52%", height: 2, width: `${strike * 100}%`, background: C.owed }} />
              </span>
            </div>
          </div>
        );
      })}
      {/* a notebook, half kept */}
      {f >= nbAt && f < nbOut + 30 && (
        <div style={{ position: "absolute", right: 120, top: 250, zIndex: 200, width: 380, height: 470, transform: `translateX(${(1 - sp(f, nbAt, { damping: 18 })) * 500 + ease(f, nbOut, 26) * 600}px) rotate(5deg)`, background: "repeating-linear-gradient(0deg, #FFFDF6 0 39px, #C9D3E8 39px 41px)", borderRadius: 8, boxShadow: "0 40px 70px -20px rgba(60,45,25,0.5)", padding: "40px 34px", fontFamily: SERIF, fontStyle: "italic", fontSize: 28, color: "#2A3A9E" }}>
          <div style={{ position: "absolute", left: 60, top: 0, bottom: 0, width: 2, background: "rgba(192,83,63,0.5)" }} />
          {["Mama Chidi  45,000", "Bayo  —", "Tunde  3,5..", "Iya B.  ?", "Ada  1,500"].map((l, i) => (
            <div key={i} style={{ height: 41, marginLeft: 40, opacity: i === 3 ? 0.55 : 1, textDecoration: i === 1 ? "line-through" : "none" }}>{l}</div>
          ))}
        </div>
      )}
      {/* the running total that only lives in her head */}
      <div style={{ position: "absolute", right: 120, top: 92, textAlign: "right", opacity: ease(f, cardAt[1], 16) }}>
        <Eyebrow color={gone > 0.3 ? C.owed : "#8A8478"}>{gone > 0.3 ? "Owed to her · written nowhere" : "Owed to her · in her head"}</Eyebrow>
        <Serif size={72} color={gone > 0.3 ? C.owed : C.ink} style={{ marginTop: 8, textDecoration: gone > 0.6 ? "line-through" : "none", textDecorationThickness: 4 }}>{naira(total)}</Serif>
      </div>
    </AbsoluteFill>
  );
}

/* ================= 2 · reveal + product world (840 → 2800) ================= */
const btns = (...t: string[]) => t.map((title, i) => ({ id: String(i + 1), title }));
const v = (body: string, extra: Partial<ReplyView> = {}): ReplyView => ({ lang: "pcm", kind: extra.buttons ? "buttons" : extra.list ? "list" : "text", body, ...extra });
// Every Kobo reply below is copied verbatim from the live site, 4 Nov 2026, 10:30pm.
const R = {
  mcReview: v("Make I write am like this?\n*Mama Chidi*\n- Credit sale: *₦45,000*, pay day *Fri 6 Nov*\n- Pay now: *₦20,000*\nBefore, im owe ₦33,500. After this, im go owe *₦58,500*.", { footer: "1 save / 2 edit / 3 cancel", buttons: btns("1 Save", "2 Edit", "3 Cancel") }),
  mcSaved: v("*E don enter book.*\nMama Chidi now owe you *₦58,500*.\n\n_Ref K-0005 · 4 Nov, 10:30pm_"),
  bQ: v('I hear *"three eight"* for Bayo payment.\nWhich one be am?\n1. ₦3,800\n2. ₦38,000\n3. Another amount', { footer: "I never save anything.", buttons: btns("₦3,800", "₦38,000", "Another amount") }),
  bReview: v("Make I write am like this?\n*Bayo*\n- Pay now: *₦3,800*\nBefore, im owe ₦28,000. After this, im go owe *₦24,200*.", { footer: "1 save / 2 edit / 3 cancel", buttons: btns("1 Save", "2 Edit", "3 Cancel") }),
  bSaved: v("*E don enter book.*\nBayo now owe you *₦24,200*.\n\n_Ref K-0006 · 4 Nov, 10:31pm_"),
  who: v("*Who dey owe you* · 2 people\nTotal: *₦82,700*\n\n1. Mama Chidi · *₦58,500*\n2. Bayo · *₦24,200*\n\n_Biggest first. Total na from your saved entries._", { list: { button: "See person", rows: [] } }),
  reminder: v("*Reminder* · Fri 6 Nov\nMama Chidi suppose pay *₦25,000* on Fri 6 Nov, for wetin e carry wey enter book on 4 Nov.\nE still owe you *₦58,500* for total.", { footer: "Kobo no dey message your customers by itself.", buttons: btns("Draft message", "E don pay", "Remind me later") }),
  draft: v("Copy am send to Mama Chidi:\n> Good morning Mama Chidi. Small reminder say the ₦25,000 balance for wetin you carry dey due on 6 Nov. Thank you, God bless.", { footer: "Na you go send am. Nothing go out without you." }),
};

type Item = { at: number; node: ReactNode; key: string };
function Bubble({ f, at, children }: { f: number; at: number; children: ReactNode }) {
  const p = sp(f, at, { damping: 19, stiffness: 170 });
  return <div style={{ display: "flex", flexDirection: "column", opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 18}px) scale(${0.96 + 0.04 * p})`, transformOrigin: "bottom center" }}>{children}</div>;
}
function DatePill({ t }: { t: string }) {
  return <div style={{ alignSelf: "center", padding: "4px 12px", borderRadius: 8, background: "#FFFFFFE6", fontFamily: SANS, fontSize: 13, color: "#54656F", boxShadow: "0 1px 0.5px rgba(11,20,26,0.13)" }}>{t}</div>;
}
function TypingDots({ f }: { f: number }) {
  return (
    <div style={{ alignSelf: "flex-start", height: 36, width: 62, borderRadius: 14, borderTopLeftRadius: 4, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: "0 1px 0.5px rgba(11,20,26,0.13)" }}>
      {[0, 1, 2].map((i) => <span key={i} style={{ width: 7, height: 7, borderRadius: 4, background: "#8696A0", opacity: 0.35 + 0.65 * Math.abs(Math.sin((f / 8) + i * 0.9)) }} />)}
    </div>
  );
}
function PhotoBubble({ blur }: { blur: boolean }) {
  return (
    <div style={{ alignSelf: "flex-end", background: "#D9FDD3", padding: 4, borderRadius: 14, borderTopRightRadius: 4, boxShadow: "0 1px 0.5px rgba(11,20,26,0.13)" }}>
      <div style={{ width: 230, height: 220, borderRadius: 11, overflow: "hidden" }}>
        <Img src={staticFile("v4/notebook.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: blur ? "blur(3px)" : undefined }} />
      </div>
    </div>
  );
}

function Product({ f }: { f: number }) {
  // ---- key frames ----
  const kobo = wf("S02", "kobo");
  const wa = wf("S02", "whatsapp");
  const tell = wf("S02", "tell");
  const s3 = START.S03, s4 = START.S04, s5 = START.S05, s6 = START.S06, s7 = START.S07;
  const mcSend = wf("S03", "friday") + 4;
  const mcReply = wf("S03", "lays") - 4;
  const mcTap = wf("S03", "one") + 2;
  const mcSaved = mcTap + 16;
  const bSend = wf("S04", "bayo") + 6;
  const bQ = wf("S04", "guess") - 2;
  const bTap = end("S04") + 4;
  const bReview = bTap + 24;
  const bTap2 = bReview + 34;
  const bSaved = bTap2 + 14;
  const whoSend = s5 + 4;
  const whoReply = wf("S05", "everyone") - 2;
  const friDate = s6 + 2;
  const remAt = wf("S06", "reminds");
  const drTap = wf("S06", "drafts") - 2;
  const drAt = drTap + 14;
  const photoAt = wf("S07", "snap") + 8;

  // composer typing
  const typeLine = (txt: string, from: number, to: number) => (f >= from && f < to ? txt.slice(0, Math.round(interpolate(f, [from, to - 6], [0, txt.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))) : undefined);
  const typed = typeLine("Mama Chidi carry rice 45k, she pay 20k, remain Friday", s3 + 6, mcSend) ?? typeLine("Bayo pay me three eight", s4 + 2, bSend) ?? typeLine("Who dey owe me", s5 - 30, whoSend);

  const items: Item[] = [
    { key: "d0", at: tell, node: <DatePill t="Today" /> },
    { key: "t1", at: mcSend, node: <TraderBubble m={{ id: "t1", from: "you", text: "Mama Chidi carry rice 45k, she pay 20k, remain Friday" }} /> },
    { key: "k1", at: mcReply, node: <KoboBubble view={R.mcReview} time="10:30 PM" pressed={f >= mcTap ? "1" : undefined} /> },
    { key: "k2", at: mcSaved, node: <KoboBubble view={R.mcSaved} time="10:30 PM" /> },
    { key: "t2", at: bSend, node: <TraderBubble m={{ id: "t2", from: "you", text: "Bayo pay me three eight" }} /> },
    { key: "k3", at: bQ, node: <KoboBubble view={R.bQ} time="10:30 PM" pressed={f >= bTap ? "1" : undefined} /> },
    { key: "k4", at: bReview, node: <KoboBubble view={R.bReview} time="10:30 PM" pressed={f >= bTap2 ? "1" : undefined} /> },
    { key: "k5", at: bSaved, node: <KoboBubble view={R.bSaved} time="10:31 PM" /> },
    { key: "t3", at: whoSend, node: <TraderBubble m={{ id: "t3", from: "you", text: "Who dey owe me" }} /> },
    { key: "k6", at: whoReply, node: <KoboBubble view={R.who} time="10:31 PM" /> },
    { key: "d1", at: friDate, node: <DatePill t="Friday" /> },
    { key: "k7", at: remAt, node: <KoboBubble view={R.reminder} time="8:00 AM" pressed={f >= drTap ? "1" : undefined} /> },
    { key: "k8", at: drAt, node: <KoboBubble view={R.draft} time="8:00 AM" /> },
    { key: "p1", at: photoAt, node: <PhotoBubble blur={BLUR_NAMES} /> },
  ];
  const typing = [[mcSend + 6, mcReply], [bSend + 6, bQ], [whoSend + 6, whoReply]].some(([a, b]) => f >= a && f < b);

  // phone entrance / exit and camera
  const enter = sp(f, wa - 4, { damping: 22, stiffness: 90 });
  const exit = ease(f, START.S08 - 10, 24);
  const zoom = 1 + 0.08 * (ease(f, wf("S03", "waits") - 6, 18) - ease(f, mcSaved + 10, 20)) + 0.07 * (ease(f, bQ + 4, 16) - ease(f, bSaved + 8, 18));
  const phoneX = 250;
  const phoneY = 128 + (1 - enter) * 1000 + exit * 1100;

  // reveal logo: big centre, then docks top-left
  const logoIn = sp(f, kobo - 3, { damping: 15, stiffness: 120 });
  const dock = ease(f, wa - 6, 26);
  const logoW = interpolate(dock, [0, 1], [560, 150]);
  const logoX = interpolate(dock, [0, 1], [960 - 280, 64]);
  const logoY = interpolate(dock, [0, 1], [400, 48]);
  const logoOut = ease(f, START.S08 - 10, 20);

  // owed counter (top right) driven by saves
  const owed = 61500 + 25000 * ease(f, mcSaved, 22) - 3800 * ease(f, bSaved, 22);
  const counterOn = ease(f, s3, 20) * (1 - logoOut);

  return (
    <AbsoluteFill>
      <style>{`.msg-in{animation:none!important}.typing-dot{animation:none!important}`}</style>
      {/* logo */}
      {f >= kobo - 4 && (
        <div style={{ position: "absolute", left: logoX, top: logoY, width: logoW, opacity: Math.min(1, logoIn * 1.4) * (1 - logoOut), transform: `scale(${0.85 + 0.15 * logoIn})`, transformOrigin: "left top", color: C.ink }}>
          <span className="kl"><KoboLogo /></span>
        </div>
      )}
      {f >= wf("S02", "second") - 4 && f < wa + 20 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", opacity: 1 - dock }}>
          <Rise f={f} at={wf("S02", "second") - 4}><Serif size={56} color="#5D5A55">the second memory a trader never had</Serif></Rise>
        </div>
      )}
      {/* reveal copy, right side */}
      {f >= wa && f < s3 + 10 && (
        <div style={{ position: "absolute", left: 880, top: 360, opacity: 1 - ease(f, s3 - 10, 16) }}>
          <Rise f={f} at={wa + 6}><Eyebrow>Lives in WhatsApp</Eyebrow></Rise>
          <Rise f={f} at={tell - 2}><Serif size={110} style={{ marginTop: 18 }}>You just tell it.</Serif></Rise>
        </div>
      )}

      {/* the phone */}
      {f >= wa - 6 && f < START.S08 + 30 && (
        <div style={{ position: "absolute", left: phoneX, top: phoneY, transform: `scale(${0.92 * zoom}) rotate(${(1 - enter) * -6}deg)`, transformOrigin: "50% 0%" }}>
          <WaPhone typed={typed}>
            {items.filter((it) => f >= it.at).slice(-6).map((it) => <Bubble key={it.key} f={f} at={it.at}>{it.node}</Bubble>)}
            {typing && <TypingDots f={f} />}
          </WaPhone>
        </div>
      )}

      {/* counter */}
      {counterOn > 0 && (
        <div style={{ position: "absolute", right: 110, top: 70, textAlign: "right", opacity: counterOn }}>
          <Eyebrow>People owe you</Eyebrow>
          <Serif size={64} style={{ marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{naira(owed)}</Serif>
          <div style={{ fontFamily: SANS, fontSize: 16, color: "#8A8478", marginTop: 4 }}>counted by code, from saved entries</div>
        </div>
      )}

      {/* ---- right-side story panels ---- */}
      <Panel f={f} from={s3} to={s4 - 6}>
        <Eyebrow>Say it the way you'd say it</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 26 }}>
          <Chip f={f} at={wf("S03", "sale")} k="Credit sale" val="₦45,000" />
          <Chip f={f} at={wf("S03", "payment")} k="Paid now" val="₦20,000" />
          <Chip f={f} at={wf("S03", "due")} k="Due" val="Fri 6 Nov" />
          <Chip f={f} at={wf("S03", "owe")} k="She'll owe" val="₦33,500 → ₦58,500" />
        </div>
        {f >= wf("S03", "nothing") - 2 && <Rise f={f} at={wf("S03", "nothing") - 2}><Serif size={50} style={{ marginTop: 40 }}>Nothing is saved<br />until you reply <span style={{ background: C.lav, padding: "0 10px", borderRadius: 8 }}>1</span>.</Serif></Rise>}
      </Panel>

      <Panel f={f} from={s4} to={s5 - 6}>
        <Eyebrow>“three eight”</Eyebrow>
        <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 30 }}>
          <Amount f={f} at={bSend + 4} t="₦3,800" chosen={f >= bTap} />
          <Serif size={60} color="#8A8478" style={{ opacity: ease(f, bSend + 10, 12) }}>or</Serif>
          <Amount f={f} at={bSend + 12} t="₦38,000" dim={f >= bTap} />
        </div>
        {f >= wf("S04", "asks") - 2 && <Rise f={f} at={wf("S04", "asks") - 2}><Serif size={88} style={{ marginTop: 50 }}>Kobo never<br />guesses money.</Serif></Rise>}
      </Panel>

      <Panel f={f} from={s5} to={s6 - 6}>
        <Eyebrow>Who dey owe me</Eyebrow>
        {[["Mama Chidi", 58500], ["Bayo", 24200]].map(([n, a], i) => (
          <Rise key={n as string} f={f} at={whoReply + i * 6}>
            <div style={{ marginTop: i ? 14 : 28, width: 700, display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ width: 160, fontFamily: SANS, fontSize: 26, color: C.ink }}>{n}</span>
              <span style={{ height: 34, borderRadius: 8, background: i ? "#C9D3EE" : C.lav, width: (a as number) / 58500 * 380 * ease(f, whoReply + i * 6, 18) }} />
              <span style={{ fontFamily: SERIF, fontSize: 34, color: C.ink }}>{naira(a as number)}</span>
            </div>
          </Rise>
        ))}
        {f >= wf("S05", "total") - 2 && <Rise f={f} at={wf("S05", "total") - 2}><Serif size={56} style={{ marginTop: 34 }}>Biggest first.<br />A total you can trust.</Serif></Rise>}
      </Panel>

      <Panel f={f} from={s6} to={s7 - 6}>
        <Flip f={f} at={s6 + 2} />
        {f >= wf("S06", "never") - 2 && <Rise f={f} at={wf("S06", "never") - 2}><Serif size={60} style={{ marginTop: 40 }}>It drafts the message.<br /><span style={{ color: "#8A8478" }}>You decide to send it.</span></Serif></Rise>}
      </Panel>

      <Panel f={f} from={s7} to={START.S08 - 8}>
        <Eyebrow>Already keep a notebook?</Eyebrow>
        <NotebookScan f={f} at={wf("S07", "notebook") - 4} scanAt={wf("S07", "reads") - 2} />
      </Panel>
    </AbsoluteFill>
  );
}

function Panel({ f, from, to, children }: { f: number; from: number; to: number; children: ReactNode }) {
  if (f < from - 2 || f > to + 16) return null;
  const o = ease(f, from, 14) * (1 - ease(f, to, 14));
  return <div style={{ position: "absolute", left: 860, top: 250, width: 960, opacity: o, transform: `translateY(${(1 - ease(f, from, 18)) * 20}px)` }}>{children}</div>;
}
function Chip({ f, at, k, val }: { f: number; at: number; k: string; val: string }) {
  if (f < at - 4) return null;
  const p = sp(f, at - 4, { damping: 18, stiffness: 160 });
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 18, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * 30}px)` }}>
      <span style={{ width: 170, fontFamily: SANS, fontSize: 22, color: "#8A8478" }}>{k}</span>
      <span style={{ fontFamily: SERIF, fontSize: 46, color: C.ink, letterSpacing: "-0.02em" }}>{val}</span>
    </div>
  );
}
function Amount({ f, at, t, chosen, dim }: { f: number; at: number; t: string; chosen?: boolean; dim?: boolean }) {
  const p = sp(f, at, { damping: 14, stiffness: 150 });
  return (
    <div style={{ padding: "18px 30px", borderRadius: 22, background: chosen ? C.lav : "#FFFDF8", border: "1px solid rgba(45,44,42,0.1)", boxShadow: "0 20px 40px -18px rgba(60,45,25,0.35)", opacity: Math.min(1, p * 1.4) * (dim ? 0.35 : 1), transform: `scale(${0.7 + 0.3 * p})` }}>
      <Serif size={84}>{t}</Serif>
    </div>
  );
}
function Flip({ f, at }: { f: number; at: number }) {
  const p = ease(f, at + 6, 22);
  const label = p < 0.5 ? "Wed 4 Nov" : "Fri 6 Nov";
  const rot = p < 0.5 ? p * 180 : (p - 1) * 180;
  return (
    <div>
      <Eyebrow>Payment day</Eyebrow>
      <div style={{ marginTop: 22, width: 420, height: 170, borderRadius: 24, background: "#FFFDF8", border: "1px solid rgba(45,44,42,0.1)", boxShadow: "0 30px 60px -24px rgba(60,45,25,0.4)", display: "flex", alignItems: "center", justifyContent: "center", transform: `perspective(900px) rotateX(${rot}deg)` }}>
        <Serif size={78} color={p >= 0.5 ? C.ink : "#8A8478"}>{label}</Serif>
      </div>
    </div>
  );
}
const ROWS: [number, boolean][] = [[65, true], [140, true], [215, false], [295, true], [385, false], [470, true], [550, true], [630, true], [715, false], [800, true], [890, false], [980, false], [1070, true], [1160, false]];
function NotebookScan({ f, at, scanAt }: { f: number; at: number; scanAt: number }) {
  const p = sp(f, at, { damping: 18, stiffness: 100 });
  const scan = ease(f, scanAt, 46);
  const w = 560, s = w / 1300;
  return (
    <div style={{ position: "relative", marginTop: 24, width: w, height: 1240 * s, borderRadius: 14, overflow: "hidden", boxShadow: "0 40px 80px -30px rgba(60,45,25,0.55)", opacity: Math.min(1, p * 1.4), transform: `rotate(${(1 - p) * 8 - 2}deg) translateY(${(1 - p) * 60}px)` }}>
      <Img src={staticFile("v4/notebook.jpg")} style={{ width: "100%", height: "100%", filter: BLUR_NAMES ? "blur(2px)" : undefined }} />
      {ROWS.map(([y, owed], i) => {
        const lit = scan * 1240 > y + 30;
        if (!lit) return null;
        return owed
          ? <div key={i} style={{ position: "absolute", left: 0, right: 0, top: (y - 26) * s, height: 62 * s, background: "rgba(146,169,225,0.38)", mixBlendMode: "multiply" }} />
          : <div key={i} style={{ position: "absolute", right: 10, top: (y - 6) * s, fontFamily: SANS, fontSize: 13, padding: "2px 8px", borderRadius: 6, background: "rgba(45,44,42,0.75)", color: "#fff" }}>paid · skipped</div>;
      })}
      {scan > 0 && scan < 1 && <div style={{ position: "absolute", left: 0, right: 0, top: scan * 1240 * s, height: 3, background: C.lavDeep, boxShadow: "0 0 18px 4px rgba(146,169,225,0.9)" }} />}
      {scan >= 1 && (
        <div style={{ position: "absolute", left: 16, bottom: 16, padding: "10px 16px", borderRadius: 12, background: "rgba(255,253,248,0.95)", fontFamily: SANS, fontSize: 19, color: C.ink, opacity: ease(f, scanAt + 46, 12) }}>
          You review every line before it's saved.
        </div>
      )}
    </div>
  );
}

/* ================= 3 · live proof (2795 → 2980) ================= */
function Proof({ f }: { f: number }) {
  const s = START.S08;
  if (f < s - 6 || f > START.S09 + 20) return null;
  const o = ease(f, s - 6, 16) * (1 - ease(f, START.S09 - 4, 16));
  const p1 = sp(f, s, { damping: 20, stiffness: 100 });
  const p2 = sp(f, s + 10, { damping: 20, stiffness: 100 });
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 110, top: 80 }}>
        <Eyebrow>Not a mockup</Eyebrow>
        <Serif size={70} style={{ marginTop: 10 }}>Live today.</Serif>
      </div>
      <div style={{ position: "absolute", left: 110, top: 260, width: 1020, borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: "0 50px 90px -30px rgba(60,45,25,0.5)", border: "1px solid rgba(45,44,42,0.12)", transform: `translateY(${(1 - p1) * 80}px)`, opacity: p1 }}>
        <div style={{ height: 40, background: "#EFEAE1", display: "flex", alignItems: "center", gap: 8, padding: "0 16px" }}>
          {["#E26D5C", "#E9B949", "#7BB665"].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
          <span style={{ marginLeft: 16, padding: "4px 14px", borderRadius: 8, background: "#fff", fontFamily: SANS, fontSize: 15, color: "#54656F" }}>🔒 trykobo.xyz</span>
        </div>
        <OffthreadVideo src={staticFile("v4/site_cut.mp4")} style={{ width: 1020, display: "block" }} muted />
      </div>
      <div style={{ position: "absolute", left: 1180, top: 300, width: 640, transform: `translateY(${(1 - p2) * 80}px)`, opacity: p2 }}>
        <Eyebrow>On WhatsApp · Meta test number</Eyebrow>
        <div style={{ marginTop: 16, borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 70px -30px rgba(60,45,25,0.5)", border: "1px solid rgba(45,44,42,0.12)" }}>
          <Img src={staticFile("v4/wa_live.jpg")} style={{ width: 640, display: "block" }} />
        </div>
        <div style={{ fontFamily: SANS, fontSize: 17, color: "#8A8478", marginTop: 10 }}>a real reply from the deployed bot, 4 Nov, 10:18pm</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center" }}>
        {f >= wf("S08", "try") - 4 && <Rise f={f} at={wf("S08", "try") - 4}><Serif size={78}>try it at <span style={{ background: C.lav, padding: "0 16px", borderRadius: 12 }}>trykobo.xyz</span></Serif></Rise>}
      </div>
    </AbsoluteFill>
  );
}

/* ================= 4 · under the hood (2975 → 3440) ================= */
function Hood({ f }: { f: number }) {
  const s = START.S09;
  if (f < s - 6 || f > START.S10 + 10) return null;
  const o = ease(f, s - 6, 16) * (1 - ease(f, START.S10 - 12, 16));
  const nodes: { t: string; sub: string; at: number; tone?: "meta" | "you" | "code" }[] = [
    { t: "Voice note or text", sub: "pidgin or English", at: s + 6 },
    { t: "Muse Voice Transcribe", sub: "speech → text, with her customers' names as hints", at: wf("S09", "muse", 1), tone: "meta" },
    { t: "Muse Spark", sub: "who · what · how much, as strict tool calls", at: wf("S09", "muse", 2), tone: "meta" },
    { t: "Trader confirms", sub: "1 save · 2 edit · 3 cancel", at: wf("S09", "confirms"), tone: "you" },
    { t: "Tested code calculates", sub: "integer kobo, never the model", at: wf("S09", "calculation") - 4, tone: "code" },
    { t: "Append-only ledger", sub: "fixes are new entries, nothing erased", at: wf("S09", "ledger") - 4, tone: "code" },
  ];
  const noMaths = wf("S09", "maths") - 4;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 110, top: 90 }}>
        <Eyebrow>Under the hood</Eyebrow>
        <Serif size={74} style={{ marginTop: 12 }}>AI interprets. You confirm. Code counts.</Serif>
      </div>
      <div style={{ position: "absolute", left: 110, top: 400, display: "flex", gap: 22 }}>
        {nodes.map((n, i) => {
          const p = sp(f, n.at - 3, { damping: 17, stiffness: 140 });
          const on = f >= n.at - 3;
          const bg = n.tone === "meta" ? "#E3E9F8" : n.tone === "you" ? C.lav : n.tone === "code" ? C.ink : "#FFFDF8";
          const fg = n.tone === "code" ? "#FBF7EF" : C.ink;
          return (
            <div key={i} style={{ position: "relative", width: 262, height: 250, borderRadius: 22, padding: "22px 20px", background: bg, border: "1px solid rgba(45,44,42,0.12)", boxShadow: "0 30px 60px -28px rgba(60,45,25,0.45)", opacity: on ? Math.min(1, p * 1.4) : 0.18, transform: `translateY(${(1 - (on ? p : 0)) * 30}px)` }}>
              <div style={{ fontFamily: SANS, fontSize: 15, letterSpacing: "0.2em", color: n.tone === "code" ? "#B9B4AA" : "#8A8478" }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontFamily: SERIF, fontSize: 34, lineHeight: 1.05, marginTop: 12, color: fg, letterSpacing: "-0.02em" }}>{n.t}</div>
              <div style={{ fontFamily: SANS, fontSize: 18, lineHeight: 1.3, marginTop: 12, color: n.tone === "code" ? "#D9D4CA" : "#5D5A55" }}>{n.sub}</div>
              {i === 2 && f >= noMaths && (
                <div style={{ position: "absolute", left: 18, bottom: -26, padding: "8px 14px", borderRadius: 10, background: C.owed, color: "#fff", fontFamily: SANS, fontSize: 18, transform: `scale(${sp(f, noMaths, { damping: 12, stiffness: 180 })})` }}>no arithmetic, ever</div>
              )}
              {i < nodes.length - 1 && <div style={{ position: "absolute", right: -22, top: 118, width: 22, height: 3, background: C.ink, opacity: on ? 0.5 : 0.1 }} />}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 110, top: 760, display: "flex", gap: 14, opacity: ease(f, wf("S09", "ledger") + 10, 16) }}>
        {["23 of 25 on our live message eval", "Built for WhatsApp Cloud API", "Built Oct 26 – Nov 4, 2026"].map((t) => (
          <span key={t} style={{ padding: "10px 18px", borderRadius: 999, border: "1px solid rgba(45,44,42,0.2)", fontFamily: SANS, fontSize: 20, color: "#5D5A55" }}>{t}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
}

/* ================= 5 · end card ================= */
function EndCard({ f }: { f: number }) {
  const s = START.S10 - 14;
  if (f < s) return null;
  const p = sp(f, s, { damping: 18, stiffness: 110 });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: Math.min(1, p * 1.3) * (1 - ease(f, film4Frames - 24, 22)) }}>
      <div style={{ width: 520, color: C.ink, transform: `scale(${0.9 + 0.1 * p})` }}><span className="kl"><KoboLogo /></span></div>
      <Serif size={64} style={{ marginTop: 40, textAlign: "center" }}>Talk your sales. <span style={{ color: "#8A8478" }}>Kobo keeps the book.</span></Serif>
      <div style={{ marginTop: 36, fontFamily: SANS, fontSize: 26, color: C.ink, padding: "10px 24px", borderRadius: 999, background: C.lav }}>trykobo.xyz</div>
      <div style={{ marginTop: 26, fontFamily: SANS, fontSize: 18, color: "#8A8478" }}>Built with Meta's Muse Spark and Muse Voice Transcribe · Meta Global AI Developer Hackathon</div>
    </AbsoluteFill>
  );
}

/* ================= transitions ================= */
function InkWipe({ f, at }: { f: number; at: number }) {
  if (f < at || f > at + 50) return null;
  const grow = ease(f, at, 20);
  const fade = 1 - ease(f, at + 26, 22);
  return <div style={{ position: "absolute", left: 960 - 1200 * grow, top: 540 - 1200 * grow, width: 2400 * grow, height: 2400 * grow, borderRadius: "50%", background: C.lav, opacity: fade, zIndex: 50 }} />;
}
function BarWipe({ f, at }: { f: number; at: number }) {
  if (f < at || f > at + 30) return null;
  const x = interpolate(f, [at, at + 30], [-2100, 2100], { easing: easeOut });
  return <div style={{ position: "absolute", top: 0, bottom: 0, left: x, width: 1900, background: `linear-gradient(90deg, rgba(146,169,225,0) 0%, ${C.lav} 30%, ${C.lav} 70%, rgba(146,169,225,0) 100%)`, zIndex: 60 }} />;
}

/* ================= audio ================= */
const SPANS = Object.keys(START).map((k) => [START[k], end(k)]);
const talking = (f: number) => SPANS.some(([a, b]) => f > a - 10 && f < b + 6);
function Bed({ src, from, to, base, loop }: { src: string; from: number; to: number; base: number; loop?: boolean }) {
  const len = to - from;
  return (
    <Sequence from={from} durationInFrames={len}>
      <Audio src={staticFile(src)} loop={loop} volume={(x) => interpolate(x, [0, 45, len - 45, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (talking(x + from) ? base * 0.42 : base)} />
    </Sequence>
  );
}
function Pops() {
  const at = [START.S03 + 0, wf("S03", "friday") + 4, wf("S03", "lays") - 4, wf("S03", "one") + 2, wf("S04", "bayo") + 6, wf("S04", "guess") - 2, end("S04") + 4, end("S04") + 62, START.S05 + 4, wf("S05", "everyone") - 2, wf("S06", "reminds"), wf("S06", "drafts") - 2, wf("S07", "snap") + 8];
  return <>{at.map((a, i) => <Sequence key={i} from={a} durationInFrames={10}><Audio src={staticFile("v4/pop.wav")} volume={0.22} /></Sequence>)}</>;
}

export function Film4() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <style>{`.kl svg{width:100%;height:auto;display:block}`}</style>
      <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 40%, rgba(255,253,246,0.9) 0%, rgba(244,238,227,0) 60%, rgba(214,202,182,0.45) 100%)" }} />
      {f < START.S02 + 50 && <Problem f={f} />}
      {f >= START.S02 - 30 && f < START.S08 + 40 && <Product f={f} />}
      <InkWipe f={f} at={START.S02 - 26} />
      <BarWipe f={f} at={START.S08 - 14} />
      <BarWipe f={f} at={START.S09 - 14} />
      <Proof f={f} />
      <Hood f={f} />
      <EndCard f={f} />
      <Captions f={f} />
      {/* voice */}
      {Object.keys(START).map((k, i) => (
        <Sequence key={k} from={START[k]} durationInFrames={Math.round(DUR[k] * FPS) + 10}>
          <Audio src={staticFile(`v4/vo_${String(i + 1).padStart(2, "0")}.wav`)} volume={1} />
        </Sequence>
      ))}
      {/* music: a bed per chapter, 1.5s crossfades, ducked under the voice */}
      <Bed src="music/opening-africa.mp3" from={0} to={START.S02 + 20} base={0.34} />
      <Bed src="music/percussions.mp3" from={START.S02 - 30} to={START.S03 + 10} base={0.4} />
      <Bed src="music/groove-afro-vibration.mp3" from={START.S03 - 20} to={START.S05 + 30} base={0.3} />
      <Bed src="music/pulse-tutorial.mp3" from={START.S05} to={START.S08 + 10} base={0.3} loop />
      <Bed src="music/soft-loop.mp3" from={START.S08 - 20} to={film4Frames} base={0.32} />
      <Pops />
    </AbsoluteFill>
  );
}
