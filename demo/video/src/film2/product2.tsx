import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { KoboBubble, TraderBubble, SummaryCard, type ReplyView } from "../../../../src/components/demo";
import { C, Caption, Grain, NumberRoll, Vignette, at, easeIO, easeOut, sp, tw } from "./fx";
import { Bokeh, FlipCounter, bloom } from "./premium";
import { Tap, WaPhone } from "./waphone";

const SERIF = "GeistSerifK, NairaSerifK, Georgia, serif";
const SANS = "GeistSansK, NairaSansK, sans-serif";
const btns = (...t: string[]) => t.map((title, i) => ({ id: String(i + 1), title }));
const view = (body: string, extra: Partial<ReplyView> = {}): ReplyView => ({ lang: "pcm", kind: extra.buttons ? "buttons" : "text", body, ...extra });

function Rig({ f, x = 300, y = 110, ry = 12, scale = 1, origin = "35% 88%", children }: { f: number; x?: number; y?: number; ry?: number; scale?: number; origin?: string; children: React.ReactNode }) {
  return <div style={{ position: "absolute", left: x, top: y + Math.sin(f / 40) * 6, transform: `perspective(2200px) rotateY(${ry}deg) rotateX(4deg) scale(${scale})`, transformOrigin: origin }}>{children}</div>;
}

/** A light card that whips in from the phone and whips out to the right. */
function Card({ f, start, end, w = 720, x = 1000, y = 200, children }: { f: number; start: number; end: number; w?: number; x?: number; y?: number; children: React.ReactNode }) {
  if (f < start - 1 || f > end + 16) return null;
  const pin = sp(f, start, { damping: 18, stiffness: 110 });
  const pout = tw(f, end, 14, 0, 1, easeIO);
  const dx = interpolate(pin, [0, 1], [-520, 0]) + pout * 900;
  const blur = Math.abs(1 - pin) * 12 + pout * 16;
  return (
    <div style={{ position: "absolute", left: x + dx, top: y, width: w, opacity: Math.min(1, pin * 2) * (1 - pout), filter: `blur(${blur}px)`, transform: `perspective(1800px) rotateY(${-8 + pout * -20}deg) scale(${0.7 + 0.3 * pin})`, transformOrigin: "left center", background: "#F6F1E7", borderRadius: 26, padding: "34px 38px", color: C.ink, boxShadow: "0 70px 120px -30px rgba(0,0,0,0.85), 0 0 90px rgba(146,169,225,0.16)" }}>
      {children}
    </div>
  );
}
const Eyebrow = ({ t }: { t: string }) => <div style={{ fontFamily: SANS, fontSize: 15, letterSpacing: "0.26em", color: "#8A8478" }}>{t}</div>;

function Said({ text, gloss, f, start, end, x = 1000, y = 120 }: { text: string; gloss: string; f: number; start: number; end: number; x?: number; y?: number }) {
  const o = tw(f, start, 8) * (1 - tw(f, end, 8));
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o }}>
      <div style={{ fontFamily: SANS, fontSize: 15, letterSpacing: "0.3em", color: "rgba(246,235,221,0.65)" }}>NKECHI · VOICE NOTE</div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 58, color: C.cream, marginTop: 6, ...bloom("255,240,225", 0.5) }}>“{text}”</div>
      <div style={{ fontFamily: SANS, fontSize: 19, color: "rgba(246,235,221,0.6)", marginTop: 4 }}>{gloss}</div>
    </div>
  );
}

/* ================= M5 · kobo remembers ================= */
const DEBTORS: [string, number, number][] = [["Emeka", 12000, 9], ["Iya Basira", 6000, 6], ["Bayo", 3800, 0], ["Tunde", 3500, 12], ["Ada", 1500, 3]];
const fmt = (n: number) => "₦" + n.toLocaleString("en-US");
const replyWho = view("*Who dey owe you* · 5 people\nTotal: *₦26,800*\n\n1. Emeka · *₦12,000*\n2. Iya Basira · *₦6,000*\n3. Bayo · *₦3,800*\n4. Tunde · *₦3,500*\n5. Ada · *₦1,500*", { kind: "list", list: { button: "See person", rows: [] } });
const replyOil = view("*Groundnut oil*: 4 bottles remain.\nYou don sell 8 this week.\n\n_E don low. Buy more before Friday._");
const replyWetin = view("*This week*\n1. Cabin biscuit · 14 packs\n2. Peak milk · 11\n3. Groundnut oil · 8\n\nBest customer: *Iya Basira*");

export function M5v3() {
  const f = useCurrentFrame();
  const m = "M5";
  const bWho = at(m, '"Who');
  const bEveryone = at(m, "Everyone");
  const bHow = at(m, '"How', 2);
  const bEvery = at(m, "Every");
  const bWarns = at(m, "warns");
  const bWetin = at(m, '"Wetin');
  const bProducts = at(m, "products");
  const bProof = at(m, "proof");
  const bReceipt = at(m, "receipt");
  const bNight = at(m, "night");
  const phase = f < bHow ? 0 : f < bWetin ? 1 : f < bProof ? 2 : f < bNight ? 3 : 4;
  const asks = ["Who dey owe me?", "How many oil remain?", "Wetin sell pass this week?"];
  const replies = [replyWho, replyOil, replyWetin];
  const askAt = [bWho, bHow, bWetin];
  const sold = Math.floor(tw(f, bEvery + 4, 40, 0, 8.99));
  return (
    <AbsoluteFill style={{ background: "#0B0807" }}>
      <Audio src={staticFile("vo/M5.mp3")} />
      <Bokeh warmth={0.55} />
      <Rig f={f} scale={1.18} origin="35% 92%" x={250}>
        <WaPhone subtitle="business account">
          {phase <= 2 && f >= askAt[Math.min(phase, 2)] - 2 && <TraderBubble key={`a${phase}`} m={{ id: `a${phase}`, from: "you", voice: true, text: asks[Math.min(phase, 2)], time: "6:05 PM" }} transcriptNote="Heard" />}
          {phase <= 2 && f >= askAt[Math.min(phase, 2)] + 34 && <KoboBubble key={`r${phase}`} view={replies[Math.min(phase, 2)]} time="6:05 PM" />}
          {phase === 3 && <KoboBubble view={view("*Receipt* · Nkechi Provisions\nAda · 1 Cabin biscuit · *₦1,500*\nPaid · 2 Nov")} time="6:20 PM" />}
          {phase === 4 && <KoboBubble view={view("*Your book today* · Mon 2 Nov\nI don send the summary.")} time="8:00 PM" />}
        </WaPhone>
      </Rig>
      <div style={{ position: "absolute", left: 960, top: 120, opacity: tw(f, 4, 12) * (1 - tw(f, bWho - 8, 8)), fontFamily: SERIF, fontSize: 130, color: C.cream, letterSpacing: "-0.04em", ...bloom() }}>
        Kobo <span style={{ fontStyle: "italic", color: C.lav, ...bloom("146,169,225", 0.7) }}>remembers.</span>
      </div>

      <Said text="Who dey owe me?" gloss="Who owes me?" f={f} start={bWho} end={bEveryone - 4} />
      <Card f={f} start={bEveryone - 4} end={bHow - 6} y={170}>
        <Eyebrow t="WHO DEY OWE YOU · BIGGEST FIRST" />
        <div style={{ fontFamily: SERIF, fontSize: 74, letterSpacing: "-0.03em", marginTop: 6 }}><NumberRoll value="₦26,800" start={bEveryone} f={f} /></div>
        {DEBTORS.map(([n, a, d], i) => {
          const p = sp(f, bEveryone + 8 + i * 5, { damping: 18, stiffness: 140 });
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 0", borderTop: "1px solid rgba(45,44,42,0.1)", opacity: p, transform: `translateX(${(1 - p) * 40}px)`, fontFamily: SANS, fontSize: 24 }}>
              <span style={{ width: 170, fontFamily: SERIF, fontSize: 30 }}>{n}</span>
              <span style={{ flex: 1, height: 10, borderRadius: 5, background: "rgba(45,44,42,0.08)", overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${(a / 12000) * 100 * tw(f, bEveryone + 14 + i * 5, 18)}%`, background: C.owed, borderRadius: 5 }} /></span>
              <span style={{ width: 120, textAlign: "right", fontFamily: SERIF, fontSize: 30 }}>{fmt(a)}</span>
              <span style={{ width: 110, textAlign: "right", fontSize: 18, color: d >= 7 ? C.owed : "#8A8478", opacity: tw(f, bEveryone + 50, 10) }}>{d === 0 ? "today" : `${d} days`}</span>
            </div>
          );
        })}
      </Card>

      <Said text="How many oil remain?" gloss="How much oil is left?" f={f} start={bHow} end={bEvery - 4} />
      <Card f={f} start={bEvery - 4} end={bWetin - 6} y={230} w={680}>
        <Eyebrow t="STOCK · GROUNDNUT OIL" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
          <span style={{ fontFamily: SERIF, fontSize: 150, letterSpacing: "-0.05em", lineHeight: 1 }}>{12 - sold}</span>
          <span style={{ fontFamily: SERIF, fontSize: 40, color: "#5E5A52" }}>bottles left</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
          {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ flex: 1, height: 46, borderRadius: 8, background: i < 12 - sold ? C.lav : "rgba(45,44,42,0.08)" }} />)}
        </div>
        <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 999, background: "rgba(192,83,63,0.12)", color: C.owed, fontFamily: SANS, fontSize: 22, opacity: tw(f, bWarns, 10), transform: `scale(${0.8 + 0.2 * sp(f, bWarns)})` }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: C.owed }} /> Running low · buy before Friday
        </div>
      </Card>

      <Said text="Wetin sell pass this week?" gloss="What sold the most this week?" f={f} start={bWetin} end={bProducts - 6} />
      <Card f={f} start={bProducts - 6} end={bProof - 6} y={220} w={700}>
        <Eyebrow t="THIS WEEK · BEST SELLERS" />
        {([["Cabin biscuit", 14], ["Peak milk", 11], ["Groundnut oil", 8]] as [string, number][]).map(([n, q], i) => (
          <div key={n} style={{ marginTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SERIF, fontSize: 34 }}><span>{i + 1}. {n}</span><span>{q}</span></div>
            <div style={{ height: 14, borderRadius: 7, background: "rgba(45,44,42,0.08)", marginTop: 8 }}><div style={{ height: "100%", borderRadius: 7, width: `${(q / 14) * 100 * tw(f, bProducts + i * 5, 20)}%`, background: i === 0 ? C.lav : "rgba(146,169,225,0.55)" }} /></div>
          </div>
        ))}
        <div style={{ marginTop: 28, fontFamily: SANS, fontSize: 22, color: "#5E5A52", opacity: tw(f, at(m, "customers"), 10) }}>Best customer · <b style={{ color: C.ink }}>Iya Basira</b></div>
      </Card>

      {/* receipt that flies off to the customer */}
      {f >= bReceipt - 8 && f < bNight + 10 && (() => {
        const p = sp(f, bReceipt - 8, { damping: 16, stiffness: 120 });
        const fly = tw(f, at(m, "tap") - 4, 16, 0, 1, easeIO);
        return (
          <div style={{ position: "absolute", left: 1060 + fly * 900, top: 200 - fly * 120, width: 460, transform: `rotate(${-4 + fly * 18}deg) scale(${0.6 + 0.4 * p})`, opacity: p * (1 - fly), filter: `blur(${fly * 10}px)` }}>
            <div style={{ background: "#FFFDF8", padding: "34px 36px 26px", fontFamily: SANS, color: C.ink, boxShadow: "0 60px 100px -30px rgba(0,0,0,0.85)", clipPath: "polygon(0 0,100% 0,100% 94%,95% 100%,90% 94%,85% 100%,80% 94%,75% 100%,70% 94%,65% 100%,60% 94%,55% 100%,50% 94%,45% 100%,40% 94%,35% 100%,30% 94%,25% 100%,20% 94%,15% 100%,10% 94%,5% 100%,0 94%)" }}>
              <div style={{ fontFamily: SERIF, fontSize: 34 }}>Nkechi Provisions</div>
              <div style={{ fontSize: 15, letterSpacing: "0.2em", color: "#8A8478", marginTop: 4 }}>RECEIPT · 2 NOV</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26, fontSize: 24 }}><span>Ada · 1 Cabin biscuit</span><span>₦1,500</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 24, color: "#2F6B48" }}><span>Paid</span><span>₦1,500</span></div>
              <div style={{ marginTop: 26, paddingBottom: 30, fontSize: 15, color: "#8A8478" }}>Counted by Kobo from confirmed entries.</div>
            </div>
          </div>
        );
      })()}

      {/* the day on one page */}
      {f >= bNight - 4 && (() => {
        const p = sp(f, bNight - 4, { damping: 15, stiffness: 100 });
        return (
          <div style={{ position: "absolute", left: 1080, top: 60 + (1 - p) * 300, width: 1080 * 0.66, height: 1350 * 0.66, opacity: p, transform: `perspective(1800px) rotateY(-10deg) rotateX(${(1 - p) * 30}deg)`, boxShadow: "0 80px 140px -30px rgba(0,0,0,0.9), 0 0 120px rgba(146,169,225,0.2)" }}>
            <div style={{ width: 1080, height: 1350, transform: "scale(0.66)", transformOrigin: "left top" }}>
              <SummaryCard fontFamily={SERIF} data={{ date: "Mon 2 Nov", sample: true, shop: "Nkechi Provisions", owedKobo: 2680000, creditKobo: 380000, collectedKobo: 150000, stockKobo: 4500000, entries: 9, biggest: [{ name: "Emeka", owedKobo: 1200000 }, { name: "Iya Basira", owedKobo: 600000 }, { name: "Bayo", owedKobo: 380000 }] }} />
            </div>
          </div>
        );
      })()}
      <Vignette strength={0.65} />
      <Grain opacity={0.05} />
      <Caption m={m} f={f} accent={["remembers", "receipt", "page"]} />
    </AbsoluteFill>
  );
}

/* ================= M6 · friday ================= */
const reminder = view("*Reminder* · Fri 6 Nov\nBayo suppose pay *₦3,800* today, for the groundnut oil wey e carry on 2 Nov.", { footer: "Kobo no dey message your customers by itself.", buttons: btns("Draft message", "E don pay", "Remind me later") });
const draft = view("Copy am send to Bayo:\n> Good morning Bayo, na Nkechi Provisions. Small reminder say the ₦3,800 for the groundnut oil wey you carry on 2 Nov dey due today. Thank you, God bless.", { footer: "Na you go send am. Nothing go out without you." });
const paidReview = view("*E don enter book.*\nBayo don clear everything. E no owe you again.\n\n_Ref K-0031 · 6 Nov, 4:40pm_");

export function M6v3() {
  const f = useCurrentFrame();
  const m = "M6";
  const bNkechi = at(m, "Nkechi");
  const bTells = at(m, "tells");
  const bDrafts = at(m, "drafts");
  const bNever = at(m, "never");
  const bPays = at(m, "pays");
  const bVN = at(m, "Bayo", 3);
  const bSquare = at(m, "square");
  const showPhone = tw(f, bTells - 20, 20);
  return (
    <AbsoluteFill style={{ background: "#0B0807" }}>
      <Audio src={staticFile("vo/M6.mp3")} />
      <Bokeh warmth={0.95} />
      {/* sunrise */}
      <AbsoluteFill style={{ background: `radial-gradient(70% 60% at 50% 110%, rgba(255,170,90,${0.45 * (1 - tw(f, bTells, 30))}), transparent 70%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", opacity: tw(f, 0, 14) * (1 - tw(f, bTells - 24, 14)) }}>
        <div style={{ fontFamily: SANS, fontSize: 20, letterSpacing: "0.4em", color: "rgba(246,235,221,0.7)" }}>FRIDAY · 6 NOV · 8:00 AM</div>
        <div style={{ fontFamily: SERIF, fontSize: 190, color: C.cream, letterSpacing: "-0.045em", marginTop: 10, ...bloom() }}>Friday.</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 56, color: C.lav, opacity: tw(f, bNkechi, 14), ...bloom("146,169,225", 0.6) }}>She didn't write anything down.</div>
      </div>
      <div style={{ opacity: showPhone }}>
        <Rig f={f} scale={1 + 0.3 * tw(f, bDrafts - 10, 18)} origin="35% 90%">
          <WaPhone subtitle="business account">
            {f < bPays && <KoboBubble view={reminder} time="8:00 AM" pressed={f > bDrafts - 14 ? "1" : undefined} />}
            {f >= bDrafts && f < bPays && <KoboBubble view={draft} time="8:01 AM" />}
            {f >= bVN - 6 && <TraderBubble m={{ id: "p", from: "you", voice: true, text: "Bayo don pay the oil money.", time: "4:40 PM" }} transcriptNote="Heard" />}
            {f >= bVN + 50 && <KoboBubble view={paidReview} time="4:40 PM" />}
          </WaPhone>
          <Tap x={150} y={600} p={tw(f, bDrafts - 18, 14)} />
        </Rig>
      </div>
      {/* the draft flies to Bayo, sent by her */}
      {f >= bDrafts + 30 && f < bNever + 40 && (() => {
        const p = sp(f, bDrafts + 30, { damping: 17, stiffness: 100 });
        const go = tw(f, bNever - 6, 22, 0, 1, easeIO);
        return (
          <>
            <div style={{ position: "absolute", left: 1000 + go * 520, top: 250 - go * 40, width: 640, opacity: p * (1 - go * 0.9), transform: `scale(${0.75 + 0.25 * p - go * 0.6})`, transformOrigin: "right center", filter: `blur(${go * 8}px)`, background: "#D9FDD3", borderRadius: 22, padding: "28px 32px", fontFamily: SANS, fontSize: 25, lineHeight: 1.45, color: "#111B21", boxShadow: "0 60px 100px -30px rgba(0,0,0,0.8)" }}>
              Good morning Bayo, na Nkechi Provisions. Small reminder say the <b>₦3,800</b> for the groundnut oil wey you carry on 2 Nov dey due today. Thank you, God bless.
            </div>
            <div style={{ position: "absolute", left: 1600, top: 600, display: "flex", alignItems: "center", gap: 14, opacity: tw(f, bDrafts + 40, 10) * (1 - tw(f, bNever + 30, 10)), fontFamily: SANS, color: C.cream, fontSize: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: 30, background: "#7A6A5A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 30 }}>B</div> Bayo
            </div>
          </>
        );
      })()}
      <div style={{ position: "absolute", left: 1000, top: 380, opacity: tw(f, bNever, 10) * (1 - tw(f, bPays - 10, 10)), fontFamily: SERIF, fontSize: 84, color: C.cream, letterSpacing: "-0.035em", lineHeight: 1.08, ...bloom() }}>
        Kobo never talks<br />to her customers.
        <div style={{ fontStyle: "italic", color: C.lav, marginTop: 10, opacity: tw(f, at(m, "does"), 10), ...bloom("146,169,225", 0.7) }}>She does.</div>
      </div>
      {/* the motif pays off: Bayo owes → ₦0 */}
      {f >= bPays - 4 && (
        <div style={{ position: "absolute", left: 1020, top: 330, opacity: tw(f, bPays - 4, 10) }}>
          <FlipCounter value={f < bVN + 50 ? "₦3,800" : "₦0"} label="BAYO OWES" f={f} changedAt={f < bVN + 50 ? bPays - 4 : bVN + 50} settle={f >= bVN + 50} />
          <div style={{ marginTop: 40, fontFamily: SERIF, fontStyle: "italic", fontSize: 60, color: C.cream, textAlign: "center", opacity: tw(f, bSquare, 12), ...bloom() }}>The book is square.</div>
        </div>
      )}
      <Vignette strength={0.65} />
      <Grain opacity={0.05} />
      <Caption m={m} f={f} accent={["friday", "remember", "square"]} />
    </AbsoluteFill>
  );
}

/* ================= M7 · under the hood ================= */
function Node({ title, sub, on, children, w = 380 }: { title: string; sub?: string; on: number; children?: React.ReactNode; w?: number }) {
  return (
    <div style={{ width: w, borderRadius: 26, padding: "28px 30px", background: `rgba(30,28,36,${0.55 + 0.25 * on})`, border: `1.5px solid rgba(146,169,225,${0.2 + 0.7 * on})`, boxShadow: on > 0.3 ? `0 0 ${80 * on}px rgba(146,169,225,${0.35 * on})` : "none", backdropFilter: "blur(10px)", color: C.cream, transform: `scale(${0.94 + 0.06 * on})`, opacity: 0.45 + 0.55 * on }}>
      <div style={{ fontFamily: SANS, fontSize: 14, letterSpacing: "0.26em", color: "rgba(246,235,221,0.6)" }}>{sub}</div>
      <div style={{ fontFamily: SERIF, fontSize: 48, letterSpacing: "-0.02em", marginTop: 4, ...bloom("255,240,225", 0.4 * on) }}>{title}</div>
      {children && <div style={{ marginTop: 18 }}>{children}</div>}
    </div>
  );
}
const Chip = ({ t, o = 1 }: { t: string; o?: number }) => <span style={{ display: "inline-block", margin: "0 8px 8px 0", padding: "6px 14px", borderRadius: 999, background: "rgba(146,169,225,0.18)", border: "1px solid rgba(146,169,225,0.5)", fontFamily: SANS, fontSize: 18, color: C.cream, opacity: o }}>{t}</span>;

export function M7v3() {
  const f = useCurrentFrame();
  const m = "M7";
  const bVoice = at(m, "Voice");
  const bNames = at(m, "names");
  const bSpark = at(m, "Spark");
  const bNotebook = at(m, "notebook");
  const bRecord = at(m, "record");
  const bNever = at(m, "never");
  const bPlain = at(m, "Plain");
  // camera pans across a wide canvas
  const pan = interpolate(f, [0, bVoice, bSpark - 10, bRecord, bNever, bPlain + 40], [0, 0, 560, 760, 1350, 1350], { extrapolateRight: "clamp", easing: easeIO });
  const on = (s: number, e = 99999) => tw(f, s, 12) * (1 - 0.6 * tw(f, e, 12));
  const dots = (x1: number, x2: number, y: number, active: number) =>
    Array.from({ length: 6 }).map((_, i) => {
      const t = ((f / 30 + i / 6) % 1);
      return <div key={i} style={{ position: "absolute", left: x1 + (x2 - x1) * t - 5, top: y - 5, width: 10, height: 10, borderRadius: 5, background: C.lav, opacity: active * (0.4 + 0.6 * Math.sin(t * Math.PI)), boxShadow: "0 0 18px rgba(146,169,225,0.9)" }} />;
    });
  return (
    <AbsoluteFill style={{ background: "#0B0807" }}>
      <Audio src={staticFile("vo/M7.mp3")} />
      <Bokeh warmth={0.2} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", opacity: tw(f, 0, 12) * (1 - tw(f, bVoice - 6, 10)), fontFamily: SERIF, fontSize: 120, color: C.cream, letterSpacing: "-0.04em", ...bloom() }}>
        Under the hood: <span style={{ fontStyle: "italic", color: C.lav }}>Meta.</span>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: 3400, height: 1080, transform: `translateX(${-pan}px)` }}>
        {/* lines */}
        <div style={{ position: "absolute", left: 140, top: 538, width: 2700, height: 2, background: "rgba(146,169,225,0.25)" }} />
        {dots(500, 640, 539, on(bVoice))}
        {dots(1040, 1180, 539, on(bSpark))}
        {dots(1580, 1720, 539, on(bRecord))}
        {dots(2120, 2260, 539, on(bPlain))}
        <div style={{ position: "absolute", left: 120, top: 380 }}>
          <Node title="Voice note" sub="NKECHI · PIDGIN" on={on(0)} w={380}>
            <div style={{ display: "flex", gap: 5, alignItems: "center", height: 60 }}>{Array.from({ length: 24 }).map((_, i) => <div key={i} style={{ width: 6, height: 10 + Math.abs(Math.sin(f / 4 + i)) * 46, background: C.lav, borderRadius: 3 }} />)}</div>
          </Node>
        </div>
        <div style={{ position: "absolute", left: 660, top: 340 }}>
          <Node title="Muse Voice" sub="META · SPEECH TO TEXT" on={on(bVoice)} w={380}>
            <div style={{ fontFamily: SANS, fontSize: 16, color: "rgba(246,235,221,0.65)", marginBottom: 10, opacity: tw(f, bNames, 10) }}>HINTS FROM HER OWN BOOK</div>
            {["Bayo", "Cabin", "groundnut oil", "Iya Basira", "Emeka"].map((t, i) => <Chip key={t} t={t} o={tw(f, bNames + i * 4, 8)} />)}
          </Node>
        </div>
        <div style={{ position: "absolute", left: 1200, top: 300 }}>
          <Node title="Muse Spark" sub="META · READS & CHOOSES A TOOL" on={on(bSpark)} w={400}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 17, lineHeight: 1.55, color: "rgba(246,235,221,0.9)", background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "14px 16px", opacity: tw(f, bRecord - 4, 10) }}>
              record_sale(<br />&nbsp;customer: <span style={{ color: C.lav }}>"Bayo"</span>,<br />&nbsp;item: <span style={{ color: C.lav }}>"groundnut oil"</span>,<br />&nbsp;amount_text: <span style={{ color: C.lav }}>"three eight"</span><br />)
            </div>
          </Node>
        </div>
        <div style={{ position: "absolute", left: 1230, top: 800, opacity: tw(f, bNotebook - 4, 12) }}>
          <Node title="Notebook photo" sub="IMAGE INPUT" on={on(bNotebook)} w={340} />
        </div>
        <div style={{ position: "absolute", left: 1740, top: 340 }}>
          <Node title="Plain code" sub="THE BOOK · APPEND-ONLY" on={on(bNever)} w={400}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 18, lineHeight: 1.6, color: "rgba(246,235,221,0.9)" }}>
              "three eight" → <span style={{ color: "#F2877C" }}>ask</span><br />
              ₦3,800 → <span style={{ color: C.lav }}>380000</span> kobo<br />
              balance = Σ confirmed entries
            </div>
          </Node>
        </div>
        <div style={{ position: "absolute", left: 2280, top: 400 }}>
          <Node title="Back to WhatsApp" sub="REVIEW · 1 SAVE" on={on(bPlain + 30)} w={360} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", opacity: tw(f, bNever, 10) * (1 - tw(f, bPlain + 50, 10)), fontFamily: SERIF, fontSize: 92, color: C.cream, letterSpacing: "-0.035em", ...bloom() }}>
        The AI never touches <span style={{ fontStyle: "italic", color: C.lav }}>the numbers.</span>
      </div>
      <Vignette strength={0.7} />
      <Grain opacity={0.05} />
      <Caption m={m} f={f} accent={["meta", "numbers", "erased"]} />
    </AbsoluteFill>
  );
}

/* ================= M8 · close ================= */
const TILE = "M170,0 H600 Q670,0 670,70 V260 Q670,330 740,330 H930 Q1000,330 1000,400 V830 Q1000,1000 830,1000 H170 Q0,1000 0,830 V170 Q0,0 170,0 Z";
const K = "M31 4 93 41Q104 48 108.0 54.0Q112 60 112 73V654Q112 672 109.5 676.0Q107 680 93 685L24 708V712L187 770H196V247L426 470Q433 477 433 481Q433 487 421 493L359 526V530H546V526L485 479L320 318L543 6V0H437L258 257L196 197V73Q196 60 200.5 54.0Q205 48 219 41L293 4V0H31Z";
export function M8v3() {
  const f = useCurrentFrame();
  const m = "M8";
  const bLater = at(m, "later");
  const bYou = at(m, "You");
  const strike = tw(f, bLater + 14, 14, 0, 1, easeOut);
  const laterOut = tw(f, bYou - 10, 12);
  const lock = sp(f, bYou - 4, { damping: 16, stiffness: 110 });
  const credits = tw(f, at(m, "remembers") + 30, 16);
  return (
    <AbsoluteFill style={{ background: "#0B0807" }}>
      <Audio src={staticFile("vo/M8.mp3")} />
      <Bokeh warmth={0.6} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - laterOut }}>
        <div style={{ position: "relative", fontFamily: SERIF, fontStyle: "italic", fontSize: 320, color: C.cream, letterSpacing: "-0.045em", opacity: tw(f, 0, 12), ...bloom() }}>
          later.
          <div style={{ position: "absolute", left: -20, top: "54%", height: 16, width: `${strike * 108}%`, background: C.lav, borderRadius: 8, boxShadow: "0 0 40px rgba(146,169,225,0.9)" }} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: lock }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 24, transform: `scale(${0.9 + 0.1 * lock}) translateY(${-60 - credits * 40}px)` }}>
          <svg viewBox="0 0 1000 1000" width={250} height={250} style={{ filter: "drop-shadow(0 0 50px rgba(146,169,225,0.55))" }}>
            <path d={TILE} fill={C.lav} />
            <rect x="716" y="0" width="284" height="284" rx="70" fill={C.cream} />
            <path transform="translate(164.1 916) scale(1.08 -1.08)" d={K} fill={C.ink} />
          </svg>
          <div style={{ fontFamily: SERIF, fontSize: 280, lineHeight: 0.8, letterSpacing: "-0.045em", color: C.cream, marginBottom: 6, ...bloom("255,240,225", 0.7) }}>obo</div>
        </div>
        <div style={{ position: "absolute", top: 640 - credits * 40, fontFamily: SERIF, fontSize: 62, color: C.cream, letterSpacing: "-0.02em", ...bloom("255,240,225", 0.5) }}>
          You sell. <span style={{ color: C.lav, fontStyle: "italic" }}>Kobo remembers.</span>
        </div>
        <div style={{ position: "absolute", top: 780, textAlign: "center", opacity: credits, fontFamily: SANS, color: "rgba(246,235,221,0.75)", fontSize: 24, lineHeight: 1.7 }}>
          Built with Meta's <b style={{ color: C.cream }}>Muse Voice</b> and <b style={{ color: C.cream }}>Muse Spark</b>
          <br />github.com/emmaGH1/kobo
        </div>
      </AbsoluteFill>
      <Vignette strength={0.7} />
      <Grain opacity={0.05} />
      <Caption m={m} f={f} accent={["later"]} />
    </AbsoluteFill>
  );
}
