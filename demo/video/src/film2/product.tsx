import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { KoboBubble, TraderBubble, BookPanel, type ReplyView, type BookRow } from "../../../../src/components/demo";
import { C, Caption, Grain, Vignette, at, easeIO, easeOut, sp, tw } from "./fx";
import { Bokeh, bloom } from "./premium";
import { Tap, WaPhone } from "./waphone";

const SERIF = "GeistSerifK, NairaSerifK, Georgia, serif";
const btns = (...t: string[]) => t.map((title, i) => ({ id: String(i + 1), title }));
const view = (body: string, extra: Partial<ReplyView> = {}): ReplyView => ({ lang: "pcm", kind: extra.buttons ? "buttons" : "text", body, ...extra });

/** Phone placed in the dark world, gently floating, with a camera that can move. */
function PhoneRig({ f, x = 330, y = 110, ry = 14, rx = 4, scale = 1, origin = "50% 50%", children }: { f: number; x?: number; y?: number; ry?: number; rx?: number; scale?: number; origin?: string; children: React.ReactNode }) {
  const float = Math.sin(f / 40) * 6;
  return (
    <div style={{ position: "absolute", left: x, top: y + float, transform: `perspective(2200px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${scale})`, transformOrigin: origin }}>
      {children}
    </div>
  );
}

/** A card that lifts off the phone and floats forward. */
function PullOut({ f, start, from, to, children, out, w }: { f: number; start: number; from: [number, number]; to: [number, number]; children: React.ReactNode; out?: number; w: number }) {
  if (f < start) return null;
  const p = sp(f, start, { damping: 17, stiffness: 95 });
  const o = out !== undefined ? 1 - tw(f, out, 12) : 1;
  const x = interpolate(p, [0, 1], [from[0], to[0]]);
  const y = interpolate(p, [0, 1], [from[1], to[1]]);
  const v = Math.abs(1 - p);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, transform: `perspective(1800px) rotateY(${-10 * p}deg) translateZ(${80 * p}px) scale(${0.45 + 0.55 * p})`, transformOrigin: "left top", opacity: Math.min(1, p * 2) * o, filter: `blur(${v * 6}px)`, boxShadow: "0 70px 120px -30px rgba(0,0,0,0.85), 0 0 80px rgba(146,169,225,0.18)", borderRadius: 22 }}>
      {children}
    </div>
  );
}

function Label({ text, f, start, x, y, out }: { text: string; f: number; start: number; x: number; y: number; out?: number }) {
  const o = tw(f, start, 10) * (out !== undefined ? 1 - tw(f, out, 10) : 1);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-sans)", fontSize: 16, letterSpacing: "0.26em", color: "rgba(246,235,221,0.85)" }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: C.lav, boxShadow: "0 0 14px rgba(146,169,225,0.9)" }} />
      {text}
    </div>
  );
}

/* ================= M3 · day one: the old notebook comes in ================= */
const NOTE_LINES: [string, string][] = [["Ada", "1,500"], ["Iya Basira", "6,000"], ["Tunde", "3,500"], ["Emeka", "12,000"]];
function NotebookPhoto({ w, scan = -1, lit = 0 }: { w: number; scan?: number; lit?: number }) {
  const s = w / 600;
  return (
    <div style={{ width: w, height: 430 * s, borderRadius: 14 * s, overflow: "hidden", position: "relative", background: "#E8DFCB", boxShadow: "inset 0 0 80px rgba(80,50,20,0.35)" }}>
      <div style={{ position: "absolute", inset: `${24 * s}px ${30 * s}px`, background: "repeating-linear-gradient(0deg, #FBF7EC 0 ${47 * s}px, #B8C6E0 ${47 * s}px ${49 * s}px)", transform: "rotate(-2.5deg)", boxShadow: "0 10px 30px rgba(60,40,10,0.35)" }}>
        <div style={{ position: "absolute", left: 52 * s, top: 0, bottom: 0, width: 2 * s, background: "rgba(200,60,50,0.45)" }} />
        <div style={{ position: "absolute", left: 70 * s, top: 30 * s, fontFamily: SERIF, fontStyle: "italic", fontSize: 30 * s, color: "#2A3A9E", opacity: 0.8 }}>who owe me</div>
        {NOTE_LINES.map(([n, a], i) => (
          <div key={n} style={{ position: "absolute", left: 70 * s, right: 40 * s, top: (88 + i * 64) * s, display: "flex", justifyContent: "space-between", fontFamily: SERIF, fontStyle: "italic", fontSize: 40 * s, color: "#2A3A9E", transform: `rotate(${(i % 2 ? 1 : -1) * 0.8}deg)` }}>
            <span style={{ background: lit > i ? "rgba(146,169,225,0.55)" : "transparent", padding: `0 ${6 * s}px`, borderRadius: 4 }}>{n}</span>
            <span style={{ background: lit > i ? "rgba(146,169,225,0.55)" : "transparent", padding: `0 ${6 * s}px`, borderRadius: 4 }}>{a}</span>
          </div>
        ))}
      </div>
      {scan >= 0 && scan <= 1 && <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 3, background: C.lav, boxShadow: "0 0 30px 8px rgba(146,169,225,0.8)" }} />}
    </div>
  );
}

const greet = view("I be your book. Tell me who buy, who pay, or ask *who dey owe me*.");
const importReview = view("I read *4 people* from your notebook:\n- Ada: *₦1,500*\n- Iya Basira: *₦6,000*\n- Tunde: *₦3,500*\n- Emeka: *₦12,000*\nPeople owe you *₦23,000*. Make I write am?", { footer: "1 save / 2 edit / 3 cancel", buttons: btns("1 Save", "2 Edit", "3 Cancel") });
const opening: BookRow[] = [
  { id: "o1", time: "Opening", name: "Ada", entry: "opening", amount: "₦1,500", owes: "₦1,500" },
  { id: "o2", time: "Opening", name: "Iya Basira", entry: "opening", amount: "₦6,000", owes: "₦6,000" },
  { id: "o3", time: "Opening", name: "Tunde", entry: "opening", amount: "₦3,500", owes: "₦3,500" },
  { id: "o4", time: "Opening", name: "Emeka", entry: "opening", amount: "₦12,000", owes: "₦12,000" },
];

export function M3v3() {
  const f = useCurrentFrame();
  const m = "M3";
  const bWhatsApp = at(m, "WhatsApp");
  const bSnaps = at(m, "snaps");
  const bReads = at(m, "reads");
  const bLists = at(m, "lists");
  const bTap = at(m, "tap");
  // pull back from the wallpaper square into the phone
  const reveal = tw(f, 0, 30, 0, 1, easeIO);
  const camScale = interpolate(reveal, [0, 1], [5.2, 1]);
  const photoSent = f >= bSnaps + 14;
  const flash = tw(f, bSnaps + 4, 3) * (1 - tw(f, bSnaps + 7, 10));
  const scan = tw(f, bReads, 40);
  const lit = Math.floor(tw(f, bReads + 6, 40, 0, 4.99));
  const replied = f >= bLists + 30;
  const tapP = tw(f, bTap - 4, 16);
  const saved = f >= bTap + 4;
  return (
    <AbsoluteFill style={{ background: "#0B0807" }}>
      <Audio src={staticFile("vo/M3.mp3")} />
      <Bokeh warmth={0.35} />
      <AbsoluteFill style={{ transformOrigin: "535px 520px", transform: `scale(${camScale})` }}>
        <PhoneRig f={f} ry={14 * reveal} rx={4 * reveal} scale={1 + 0.42 * tw(f, bLists + 26, 20) - 0.42 * tw(f, bTap + 2, 18)} origin="40% 78%">
          <WaPhone subtitle={replied && !saved ? "typing…" : "business account"}>
            <KoboBubble view={greet} time="7:30 AM" />
            {photoSent && (
              <div style={{ alignSelf: "flex-end", background: "#D9FDD3", borderRadius: 14, padding: 4, boxShadow: "0 1px 0.5px rgba(11,20,26,0.13)" }}>
                <NotebookPhoto w={230} />
              </div>
            )}
            {replied && <KoboBubble view={importReview} time="7:31 AM" pressed={saved ? "1" : undefined} />}
          </WaPhone>
          <AbsoluteFill style={{ borderRadius: 66, background: "#fff", opacity: flash }} />
          <Tap x={175} y={612} p={tapP} />
        </PhoneRig>
      </AbsoluteFill>
      {/* the cream wallpaper square from the logo, opening up */}
      <AbsoluteFill style={{ background: "#EFE7DD", opacity: 1 - tw(f, 4, 14) }} />

      <div style={{ position: "absolute", left: 1010, top: 250, opacity: tw(f, bWhatsApp - 6, 12) * (1 - tw(f, bSnaps - 10, 12)) }}>
        <div style={{ fontFamily: SERIF, fontSize: 120, color: C.cream, letterSpacing: "-0.035em", lineHeight: 1, ...bloom() }}>Kobo</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 72, color: C.lav, marginTop: 12, ...bloom("146,169,225", 0.7) }}>lives in WhatsApp.</div>
      </div>

      <PullOut f={f} start={bReads - 6} from={[430, 520]} to={[1010, 230]} w={680} out={bLists + 34}>
        <NotebookPhoto w={680} scan={scan} lit={lit} />
      </PullOut>
      <Label text="MUSE SPARK · READING HANDWRITING" f={f} start={bReads} x={1010} y={190} out={bLists + 30} />

      {saved && (
        <PullOut f={f} start={bTap + 4} from={[600, 600]} to={[990, 300]} w={820}>
          <BookPanel date="Mon 2 Nov" stats={{ owed: "₦23,000", collected: "₦0", stock: "₦0" }} rows={opening.slice(0, Math.min(4, Math.floor(tw(f, bTap + 14, 24, 0, 4.99))))} />
        </PullOut>
      )}
      <Vignette strength={0.65} />
      <Grain opacity={0.05} />
      <Caption m={m} f={f} accent={["whatsapp", "notebook", "tap"]} />
    </AbsoluteFill>
  );
}

/* ================= M4 · talk it: the voice note, the question, the save ================= */
const oilQuestion = view('I hear *"three eight"* for Bayo oil.\nWhich one be am?', { footer: "I never save anything.", buttons: btns("₦3,800", "₦38,000", "Another amount") });
const oilReview = view('Make I write am like this?\n> "Bayo carry one groundnut oil, three eight. E go pay Friday."\n*Bayo*\n- Credit sale: 1 groundnut oil, *₦3,800*\n- Remain go pay: *Fri 6 Nov*', { footer: "1 save / 2 edit / 3 cancel", buttons: btns("1 Save", "2 Edit", "3 Cancel") });
const saved = view("*E don enter book.*\nBayo now owe you *₦3,800*.\n\n_Ref K-0007 · 2 Nov, 12:10pm_");
const savedImport = view("*E don enter book.*\n4 people owe you *₦23,000*.\n\n_Ref K-0006 · 2 Nov, 7:31am_");

function Wave({ f, active }: { f: number; active: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, height: 220, opacity: active }}>
      {Array.from({ length: 34 }).map((_, i) => {
        const h = 16 + Math.abs(Math.sin(f / 3.1 + i * 0.7) * Math.cos(f / 5.3 + i * 0.31)) * 190;
        return <div key={i} style={{ width: 8, height: h, borderRadius: 4, background: C.lav, boxShadow: "0 0 16px rgba(146,169,225,0.7)", opacity: 0.5 + 0.5 * Math.sin(i / 3 + f / 9) }} />;
      })}
    </div>
  );
}

export function M4v3() {
  const f = useCurrentFrame();
  const m = "M4";
  const bTalks = at(m, "talks");
  const qStart = at(m, '"Bayo') - 4;
  const qEnd = at(m, 'Friday."') + 22;
  const bFive = at(m, "Five");
  const bKobo = at(m, "Kobo");
  const bOil = at(m, "oil", 3);
  const bAmount = at(m, "amount");
  const bDate = at(m, "date");
  const bSave = at(m, "save");
  const bIf = at(m, "If");
  const recording = f >= bTalks + 6 && f < qEnd;
  const recSeconds = Math.max(0, (f - (bTalks + 6)) / 30);
  const sent = f >= qEnd;
  const asked = f >= qEnd + 12;
  const picked = f >= bFive + 30;
  const reviewed = f >= bKobo + 6;
  const tapSave = tw(f, bSave - 10, 16);
  const done = f >= bSave + 6;
  return (
    <AbsoluteFill style={{ background: "#0B0807" }}>
      <Audio src={staticFile("vo/M4.mp3")} />
      <Bokeh warmth={0.45} />
      <PhoneRig f={f} ry={12} x={300} scale={1 + 0.45 * tw(f, bTalks - 6, 18) - 0.45 * tw(f, qEnd - 4, 14) + 0.4 * tw(f, bKobo, 18) - 0.4 * tw(f, bSave + 4, 16)} origin="35% 88%">
        <WaPhone recording={recording} recSeconds={recSeconds} subtitle={sent && !reviewed ? "typing…" : "business account"} scrollY={0}>
          {!reviewed && <KoboBubble view={savedImport} time="7:31 AM" />}
          {sent && <TraderBubble m={{ id: "v", from: "you", voice: true, text: "Bayo carry one groundnut oil, three eight. E go pay Friday.", time: "12:10 PM" }} playing={false} transcriptNote={reviewed ? "Heard" : undefined} />}
          {asked && !reviewed && <KoboBubble view={oilQuestion} time="12:10 PM" pressed={picked ? "1" : undefined} />}
          {reviewed && <KoboBubble view={oilReview} marks={f > bOil ? ["Bayo", "₦3,800", "Fri 6 Nov"] : []} time="12:10 PM" pressed={done ? "1" : undefined} />}
          {done && <KoboBubble view={saved} time="12:11 PM" />}
        </WaPhone>
        <Tap x={120} y={640} p={tw(f, bFive + 20, 16)} />
        <Tap x={175} y={612} p={tapSave} />
      </PhoneRig>

      {/* her voice, visualised */}
      <div style={{ position: "absolute", left: 960, top: 330, opacity: tw(f, qStart, 8) * (1 - tw(f, qEnd, 10)) }}>
        <Wave f={f} active={1} />
        <div style={{ marginTop: 26, fontFamily: SERIF, fontStyle: "italic", fontSize: 50, color: C.cream, maxWidth: 820, ...bloom("255,240,225", 0.5) }}>“Bayo carry one groundnut oil, three eight. E go pay Friday.”</div>
        <div style={{ marginTop: 8, fontFamily: "var(--font-sans)", fontSize: 20, color: "rgba(246,235,221,0.6)" }}>Bayo took one bottle of groundnut oil, “three eight”. He'll pay Friday.</div>
      </div>
      <Label text="NKECHI · VOICE NOTE · PIDGIN" f={f} start={qStart} x={960} y={290} out={qEnd} />

      {/* the question: kobo asks instead of guessing */}
      <div style={{ position: "absolute", left: 980, top: 360, opacity: tw(f, qEnd + 14, 10) * (1 - tw(f, bFive + 34, 10)), fontFamily: SERIF, fontSize: 130, letterSpacing: "-0.04em", color: C.cream, whiteSpace: "nowrap", ...bloom() }}>
        ₦3,800 <span style={{ fontSize: 70, fontStyle: "italic", color: "rgba(246,235,221,0.6)" }}>or</span>
        <br />₦38,000?
      </div>
      <Label text="MUSE VOICE HEARD IT · KOBO ASKS" f={f} start={qEnd + 14} x={985} y={318} out={bFive + 34} />

      {/* what kobo read back, lifted out of the bubble */}
      {[
        { t: bOil, label: "ITEM", v: "Groundnut oil × 1", y: 260 },
        { t: bAmount, label: "AMOUNT", v: "₦3,800", y: 420 },
        { t: bDate, label: "PAY BY", v: "Fri 6 Nov", y: 580 },
      ].map((c, i) => (
        <PullOut key={i} f={f} start={c.t} from={[480, 520]} to={[1020 + i * 30, c.y]} w={520} out={bSave - 8}>
          <div style={{ background: "rgba(246,241,231,0.97)", borderRadius: 20, padding: "22px 28px" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, letterSpacing: "0.24em", color: "#8A8478" }}>{c.label}</div>
            <div style={{ fontFamily: SERIF, fontSize: 52, color: C.ink, marginTop: 4, letterSpacing: "-0.02em" }}>{c.v}</div>
          </div>
        </PullOut>
      ))}
      {done && (
        <PullOut f={f} start={bSave + 6} from={[600, 600]} to={[990, 300]} w={820} out={bIf - 6}>
          <BookPanel date="Mon 2 Nov" stats={{ owed: "₦26,800", collected: "₦0", stock: "₦0" }} rows={[...opening, { id: "b", time: "12:10 PM", name: "Bayo · groundnut oil", entry: "credit", amount: "₦3,800", owes: "₦3,800" }]} />
        </PullOut>
      )}
      <div style={{ position: "absolute", left: 1000, top: 380, opacity: tw(f, bIf, 10), fontFamily: SERIF, fontSize: 92, color: C.cream, letterSpacing: "-0.035em", lineHeight: 1.05, ...bloom() }}>
        It asks.
        <div style={{ fontStyle: "italic", color: C.lav, ...bloom("146,169,225", 0.7) }}>It never guesses.</div>
      </div>
      <Vignette strength={0.65} />
      <Grain opacity={0.05} />
      <Caption m={m} f={f} accent={["save", "guessing", "talks"]} />
    </AbsoluteFill>
  );
}

export const _e = easeOut;
