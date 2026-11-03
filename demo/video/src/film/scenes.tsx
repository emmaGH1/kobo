import { AbsoluteFill, Audio, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Phone, KoboBubble, TraderBubble, BookPanel, SummaryCard, KoboLogo, type ReplyView, type BookRow } from "../../../../src/components/demo";
import { Backdrop, C, Captions, Float, LaterCard, lineStart, sceneFrames, tween, type Mid } from "./kit";

const vo = (m: Mid) => <Audio src={staticFile(`vo/${m}.wav`)} />;
const btns = (...t: string[]) => t.map((title, i) => ({ id: String(i + 1), title }));
const view = (body: string, extra: Partial<ReplyView> = {}): ReplyView => ({ lang: "pcm", kind: extra.buttons ? "buttons" : "text", body, ...extra });

/** The phone on a tilted plane. `tilt` 0..1 eases between flat and tilted. */
function StagePhone({ children, x = 260, y = 40, scale = 1.3, tilt = 1, enter = 1 }: { children: React.ReactNode; x?: number; y?: number; scale?: number; tilt?: number; enter?: number }) {
  const ry = 16 * tilt;
  return (
    <div style={{ position: "absolute", left: x, top: y + (1 - enter) * 80, opacity: enter, transform: `perspective(1800px) rotateY(${ry}deg) rotateX(${5 * tilt}deg) scale(${scale})`, transformOrigin: "left top" }}>
      <Phone label="Kobo chat" composer={<div style={{ height: 50 }} />}>{children}</Phone>
    </div>
  );
}

function Card({ x, y, w, children, enter = 1, tilt = -8 }: { x: number; y: number; w: number; children: React.ReactNode; enter?: number; tilt?: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y + (1 - enter) * 60, width: w, opacity: enter, transform: `perspective(1800px) rotateY(${tilt}deg) translateZ(${60 * enter}px)`, boxShadow: "0 60px 120px -30px rgba(0,0,0,0.6)", borderRadius: 24 }}>
      {children}
    </div>
  );
}

/* ---------------- M1 · later ---------------- */
const STALL = (
  <svg width="900" height="620" viewBox="0 0 900 620" fill="none" stroke="rgba(246,235,221,0.55)" strokeWidth="2">
    <rect x="60" y="40" width="780" height="70" rx="6" />
    <text x="450" y="88" textAnchor="middle" fill="rgba(246,235,221,0.8)" stroke="none" fontFamily="var(--font-serif)" fontSize="38">Nkechi Provisions</text>
    {[200, 300, 400].map((y) => <line key={y} x1="90" y1={y} x2="810" y2={y} />)}
    {Array.from({ length: 9 }).map((_, i) => <rect key={`t${i}`} x={110 + i * 76} y={145} width="52" height="55" rx="6" />)}
    {Array.from({ length: 7 }).map((_, i) => <path key={`b${i}`} d={`M${125 + i * 98} 300 v-62 q0 -16 14 -20 h20 q14 4 14 20 v62`} />)}
    {Array.from({ length: 6 }).map((_, i) => <rect key={`c${i}`} x={110 + i * 120} y={330} width="96" height="70" rx="4" />)}
    <rect x="60" y="430" width="780" height="150" rx="8" />
  </svg>
);

const LATER = [
  { item: "Cabin biscuit", who: "?", amount: "₦1,500", when: "tomorrow?" },
  { item: "Groundnut oil", who: "Bayo", amount: "₦3,800", when: "Friday?" },
  { item: "Peak milk", who: "Ada?", amount: "₦2,200" },
  { item: "Indomie ×5", who: "?", amount: "₦1,750", when: "later" },
  { item: "Sugar", who: "Iya Basira", amount: "₦1,200?" },
  { item: "Groundnut oil", who: "Tunde?", amount: "₦3,800" },
  { item: "Paid ₦2,000", who: "who?", amount: "" },
  { item: "Milo", who: "Emeka", amount: "₦4,500", when: "next week" },
  { item: "Cabin biscuit", who: "Ada", amount: "₦1,500?" },
  { item: "Rice 1 paint", who: "?", amount: "₦3,000" },
];
const SPOTS = [[1150, 200], [1300, 430], [980, 120], [1450, 220], [1100, 640], [1500, 560], [1270, 760], [900, 420], [1620, 380], [1000, 820]];

export function M1() {
  const f = useCurrentFrame();
  const l1 = lineStart("M1", 1), l2 = lineStart("M1", 2), l3 = lineStart("M1", 3), l4 = lineStart("M1", 4), l5 = lineStart("M1", 5);
  const drawn = tween(f, l1 - 20, 30);
  const footage1 = 1 - tween(f, l1 - 20, 30);
  const footage2 = tween(f, l5, 25);
  return (
    <AbsoluteFill>
      {vo("M1")}
      <Backdrop look="dusk" />
      <AbsoluteFill style={{ opacity: Math.max(footage1, footage2 * 0.85) }}>
        <OffthreadVideo src={staticFile("broll/market-keke.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.05 + f / 3000})`, filter: `sepia(0.25) saturate(1.1) brightness(${footage2 > 0 ? 0.55 : 0.9})` }} />
      </AbsoluteFill>
      <Float x={110} y={200} style={{ opacity: drawn * (1 - footage2 * 0.7) }}>{STALL}</Float>
      {LATER.map((c, i) => {
        const at = i === 0 ? l1 + 20 : i === 1 ? l2 + 10 : l4 + (i - 2) * 9;
        const e = tween(f, at, 18);
        const t = (f - at) / 30;
        const swap = f > l4 + 70 && i === 1;
        const chaos = tween(f, l4 + 40, 60);
        const [x, y] = SPOTS[i];
        return (
          <Float key={i} x={x + Math.sin(t * 0.7 + i) * 18 * chaos} y={y - (1 - e) * 60 + Math.cos(t * 0.6 + i) * 14 * chaos} style={{ opacity: e * (1 - footage2 * 0.6) }}>
            <LaterCard item={c.item} who={swap ? "Tunde?" : c.who} amount={c.amount} when={c.when} blur={chaos * (i % 3 === 0 ? 2.5 : 0.8)} rot={Math.sin(i) * 4 * chaos} />
          </Float>
        );
      })}
      <Float x={160} y={830} style={{ opacity: tween(f, l3, 15) * (1 - footage2), fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 72, color: "#F6EBDD" }}>later.</Float>
      <Captions m="M1" />
    </AbsoluteFill>
  );
}

/* ---------------- M2 · reveal ---------------- */
export function M2() {
  const f = useCurrentFrame();
  const s = tween(f, 8, 18, 0.8, 1);
  const o = tween(f, 8, 14);
  const tag = tween(f, 40, 14);
  return (
    <AbsoluteFill>
      {vo("M2")}
      <Backdrop look="dusk" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: "#F6EBDD" }}>
        <div style={{ width: 760, opacity: o, transform: `scale(${s})` }}>
          <KoboLogo tone="dark" />
        </div>
        <div style={{ marginTop: 40, fontFamily: "var(--font-serif)", fontSize: 54, opacity: tag }}>
          You sell. <span style={{ color: C.lav }}>Kobo remembers.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/* ---------------- M3 · day one ---------------- */
function NotebookPhoto() {
  const rows = [["Ada", "1,500"], ["Iya Basira", "6,000"], ["Tunde", "3,500"], ["Emeka", "12,000"]];
  return (
    <div style={{ width: 210, height: 150, background: "repeating-linear-gradient(0deg,#cfd8ea 0 1px,#fbf8ef 1px 22px)", borderRadius: 10, padding: "14px 16px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#2A3A9E", fontSize: 15, transform: "rotate(-2deg)" }}>
      {rows.map(([n, a]) => <div key={n} style={{ display: "flex", justifyContent: "space-between", height: 22 }}><span>{n}</span><span>{a}</span></div>)}
    </div>
  );
}
const importReview = view(
  "I read *4 names* from your notebook. Check am:\n- Ada: *₦1,500*\n- Iya Basira: *₦6,000*\n- Tunde: *₦3,500*\n- Emeka: *₦12,000*\nPeople owe you *₦23,000* for total.",
  { footer: "1 save / 2 edit / 3 cancel", buttons: btns("1 Save", "2 Edit", "3 Cancel") },
);
const openingRows: BookRow[] = [
  { id: "o1", time: "Opening", name: "Ada", entry: "opening", amount: "₦1,500", owes: "₦1,500" },
  { id: "o2", time: "Opening", name: "Iya Basira", entry: "opening", amount: "₦6,000", owes: "₦6,000" },
  { id: "o3", time: "Opening", name: "Tunde", entry: "opening", amount: "₦3,500", owes: "₦3,500" },
  { id: "o4", time: "Opening", name: "Emeka", entry: "opening", amount: "₦12,000", owes: "₦12,000" },
];
export function M3() {
  const f = useCurrentFrame();
  const l1 = lineStart("M3", 1);
  const photo = f > l1 + 10;
  const reply = f > l1 + 120;
  const saved = f > l1 + 260;
  return (
    <AbsoluteFill>
      {vo("M3")}
      <Backdrop look="graphite" />
      <StagePhone enter={tween(f, 0, 20)}>
        {photo && (
          <div style={{ alignSelf: "flex-end", background: "#D9FDD3", borderRadius: 14, padding: 5 }}>
            <NotebookPhoto />
          </div>
        )}
        {reply && <KoboBubble view={importReview} time="7:31 AM" pressed={saved ? "1" : undefined} />}
      </StagePhone>
      <Card x={880} y={260} w={760} enter={tween(f, l1 + 260, 20)}>
        <BookPanel date="Mon 2 Nov" stats={{ owed: "₦23,000", collected: "₦0", stock: "₦0" }} rows={openingRows} />
      </Card>
      <Captions m="M3" />
    </AbsoluteFill>
  );
}

/* ---------------- M4 · talk it ---------------- */
const oilReview = view(
  'Make I write am like this?\n> "Bayo carry one groundnut oil, three eight. E go pay Friday."\n*Bayo*\n- Credit sale: 1 groundnut oil, *₦3,800*\n- Remain go pay: *Fri 6 Nov*',
  { footer: "1 save / 2 edit / 3 cancel", buttons: btns("1 Save", "2 Edit", "3 Cancel") },
);
export function M4() {
  const f = useCurrentFrame();
  const l1 = lineStart("M4", 1);
  const review = f > 150;
  const pressed = f > l1 + 120;
  const chip = tween(f, l1 + 230, 12) * (1 - tween(f, l1 + 300, 12));
  const rows: BookRow[] = [...openingRows, { id: "b", time: "12:10 PM", name: "Bayo · groundnut oil", entry: "credit", amount: "₦3,800", owes: "₦3,800" }];
  return (
    <AbsoluteFill>
      {vo("M4")}
      <Backdrop look="graphite" />
      <StagePhone>
        <TraderBubble m={{ id: "v", from: "you", voice: true, text: "Bayo carry one groundnut oil, three eight. E go pay Friday.", time: "12:10 PM" }} playing={!review} transcriptNote={review ? "Heard" : undefined} />
        {review && <KoboBubble view={oilReview} marks={["Bayo", "₦3,800", "Fri 6 Nov"]} time="12:10 PM" pressed={pressed ? "1" : undefined} />}
      </StagePhone>
      <Card x={880} y={240} w={760} enter={tween(f, l1 + 130, 20)}>
        <BookPanel date="Mon 2 Nov" stats={{ owed: "₦26,800", collected: "₦0", stock: "₦0" }} rows={rows} />
      </Card>
      <Float x={1060} y={720} style={{ opacity: chip, fontFamily: "var(--font-serif)", fontSize: 64, color: "#F4F0E6" }}>
        ₦3,800 <span style={{ fontSize: 36, color: "#A39E92", fontStyle: "italic" }}>or</span> ₦38,000?
      </Float>
      <Captions m="M4" />
    </AbsoluteFill>
  );
}

/* ---------------- M5 · kobo remembers ---------------- */
const BEATS: { ask: string; reply: ReplyView }[] = [
  { ask: "Who dey owe me?", reply: view("*Who dey owe you* · 5 people\nTotal: *₦26,800*\n\n1. Emeka · *₦12,000* · 9 days\n2. Iya Basira · *₦6,000* · 6 days\n3. Bayo · *₦3,800* · today\n4. Tunde · *₦3,500* · 12 days\n5. Ada · *₦1,500* · 3 days\n\n_Biggest first._") },
  { ask: "How many oil remain?", reply: view("*Groundnut oil*: 4 bottles remain.\nYou don sell 8 this week.\n\n_E don low. Make you buy more before Friday._") },
  { ask: "Wetin sell pass this week?", reply: view("*This week*\n1. Groundnut oil · 8\n2. Cabin biscuit · 14 packs\n3. Peak milk · 11\n\nBest customer: *Iya Basira*") },
  { ask: "Send receipt for Ada", reply: view("*Receipt* · Nkechi Provisions\nAda · 1 Cabin biscuit · *₦1,500*\nPaid: *₦1,500* · 2 Nov\n\n_Forward am give Ada._") },
];
export function M5() {
  const f = useCurrentFrame();
  const idx = [1, 2, 3, 4].filter((i) => f >= lineStart("M5", i)).length - 1;
  const l5 = lineStart("M5", 5);
  const card = tween(f, l5, 20);
  return (
    <AbsoluteFill>
      {vo("M5")}
      <Backdrop look="graphite" />
      <StagePhone tilt={0.6} x={300}>
        {idx >= 0 && (
          <>
            <TraderBubble key={`a${idx}`} m={{ id: `a${idx}`, from: "you", text: BEATS[idx].ask, time: "6:05 PM" }} />
            {f >= lineStart("M5", idx + 1) + 25 && <KoboBubble key={`r${idx}`} view={BEATS[idx].reply} time="6:05 PM" />}
          </>
        )}
      </StagePhone>
      <div style={{ position: "absolute", left: 1000, top: 70 + (1 - card) * 80, width: 640, height: 800, opacity: card, transform: "perspective(1800px) rotateY(-8deg)", boxShadow: "0 60px 120px -30px rgba(0,0,0,0.6)" }}>
        <div style={{ width: 1080, height: 1350, transform: "scale(0.5926)", transformOrigin: "left top" }}>
          <SummaryCard fontFamily="var(--font-serif)" data={{ date: "Mon 2 Nov", sample: true, shop: "Nkechi Provisions", owedKobo: 2680000, creditKobo: 380000, collectedKobo: 150000, stockKobo: 4500000, entries: 9, biggest: [{ name: "Emeka", owedKobo: 1200000 }, { name: "Iya Basira", owedKobo: 600000 }, { name: "Bayo", owedKobo: 380000 }] }} />
        </div>
      </div>
      <Captions m="M5" />
    </AbsoluteFill>
  );
}

/* ---------------- M6 · friday ---------------- */
const reminder = view("*Reminder* · Fri 6 Nov\nBayo suppose pay *₦3,800* today, for the groundnut oil wey e carry on 2 Nov.", { footer: "Kobo no dey message your customers by itself.", buttons: btns("Draft message", "E don pay", "Remind me later") });
const draft = view('Copy am send to Bayo:\n> Good morning Bayo, na Nkechi Provisions. Small reminder say the ₦3,800 for the groundnut oil wey you carry on 2 Nov dey due today. Thank you, God bless.', { footer: "Na you go send am. Nothing go out without you." });
const paidReview = view('Make I write am like this?\n> "Bayo don pay the oil money."\n*Bayo*\n- Payment: *₦3,800*\nAfter this, Bayo no owe you again.', { footer: "1 save / 2 edit / 3 cancel", buttons: btns("1 Save", "2 Edit", "3 Cancel") });
export function M6() {
  const f = useCurrentFrame();
  const l1 = lineStart("M6", 1), l2 = lineStart("M6", 2), l3 = lineStart("M6", 3);
  const owed = f > l3 + 110 ? "₦0" : "₦3,800";
  return (
    <AbsoluteFill>
      {vo("M6")}
      <Backdrop look="dusk" />
      <Float x={1000} y={150} style={{ opacity: tween(f, 0, 20) * (1 - tween(f, l3, 15)), fontFamily: "var(--font-serif)", fontSize: 96, color: "#F6EBDD" }}>Friday, 8:00 AM</Float>
      <StagePhone tilt={0.5} x={330} enter={tween(f, l1 - 30, 20)}>
        {f > l1 && f < l3 && <KoboBubble view={reminder} time="8:00 AM" pressed={f > l2 ? "1" : undefined} />}
        {f > l2 + 20 && f < l3 && <KoboBubble view={draft} time="8:01 AM" />}
        {f >= l3 && <TraderBubble m={{ id: "p", from: "you", voice: true, text: "Bayo don pay the oil money.", time: "4:40 PM" }} transcriptNote="Heard" />}
        {f >= l3 + 30 && <KoboBubble view={paidReview} time="4:40 PM" pressed={f > l3 + 90 ? "1" : undefined} />}
      </StagePhone>
      <Float x={1060} y={620} style={{ opacity: tween(f, l3 + 40, 15), fontFamily: "var(--font-sans)", color: "#F6EBDD" }}>
        <div style={{ fontSize: 26, letterSpacing: 3, opacity: 0.7 }}>BAYO OWES</div>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 140, color: owed === "₦0" ? "#6FCF97" : "#F2877C" }}>{owed}</div>
      </Float>
      <Captions m="M6" />
    </AbsoluteFill>
  );
}

/* ---------------- M7 · under the hood ---------------- */
function Node({ label, sub, on }: { label: string; sub?: string; on: number }) {
  return (
    <div style={{ width: 300, padding: "26px 28px", borderRadius: 20, border: `2px solid rgba(146,169,225,${0.25 + on * 0.75})`, background: `rgba(146,169,225,${0.06 + on * 0.16})`, color: "#F4F0E6", boxShadow: on > 0.5 ? "0 0 60px rgba(146,169,225,0.35)" : "none" }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 40 }}>{label}</div>
      {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 19, opacity: 0.75, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}
export function M7() {
  const f = useCurrentFrame();
  const l1 = lineStart("M7", 1), l2 = lineStart("M7", 2);
  const voice = tween(f, l1, 15), spark = tween(f, l2, 15), code = tween(f, l2 + 160, 15);
  return (
    <AbsoluteFill>
      {vo("M7")}
      <Backdrop look="graphite" />
      <div style={{ position: "absolute", top: 260, left: 110, display: "flex", gap: 40, alignItems: "center" }}>
        <Node label="Voice note" sub="Pidgin · English" on={tween(f, 0, 15)} />
        <span style={{ color: C.lav, fontSize: 40 }}>→</span>
        <Node label="Muse Voice" sub="hints: Bayo, Cabin, groundnut oil…" on={voice} />
        <span style={{ color: C.lav, fontSize: 40 }}>→</span>
        <Node label="Muse Spark" sub="record_sale · record_payment · get_balance" on={spark} />
        <span style={{ color: C.lav, fontSize: 40 }}>→</span>
        <Node label="Code" sub="integer kobo · append-only ledger" on={code} />
      </div>
      <div style={{ position: "absolute", top: 520, left: 110 + 340 * 2 - 10, opacity: spark }}>
        <Node label="Notebook photo" sub="read by Muse Spark" on={spark * 0.6} />
      </div>
      <Captions m="M7" />
    </AbsoluteFill>
  );
}

/* ---------------- M8 · close ---------------- */
export function M8() {
  const f = useCurrentFrame();
  const end = tween(f, 50, 20);
  return (
    <AbsoluteFill>
      {vo("M8")}
      <Backdrop look="dusk" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: "#F6EBDD" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 72, opacity: 1 - end, textDecoration: f > 25 ? "line-through" : "none", textDecorationColor: C.lav }}>later.</div>
        <div style={{ position: "absolute", opacity: end, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 620 }}><KoboLogo tone="dark" /></div>
          <div style={{ marginTop: 34, fontFamily: "var(--font-serif)", fontSize: 50 }}>You sell. <span style={{ color: C.lav }}>Kobo remembers.</span></div>
          <div style={{ marginTop: 40, fontFamily: "var(--font-sans)", fontSize: 24, opacity: 0.75 }}>Built with Meta's Muse Voice and Muse Spark · github.com/emmaGH1/kobo</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export const SCENES = { M1, M2, M3, M4, M5, M6, M7, M8 };
export { sceneFrames };
export const _unused = interpolate;
