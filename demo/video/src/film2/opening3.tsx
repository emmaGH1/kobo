import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Trail } from "@remotion/motion-blur";
import { C, Caption, Grain, Vignette, at, easeIO, easeOut, sp, tw } from "./fx";
import { Bokeh, Callout, FlipCounter, Tag, bloom } from "./premium";

const SERIF = "GeistSerifK, NairaSerifK, Georgia, serif";

/** Big glowing word that slams in (with motion blur trail). */
function Slam({ text, start, f, size, x, y, italic, color = C.cream, out }: { text: string; start: number; f: number; size: number; x: number; y: number; italic?: boolean; color?: string; out?: number }) {
  if (f < start - 2) return null;
  const p = sp(f, start, { damping: 14, stiffness: 160 });
  const o = out !== undefined ? 1 - tw(f, out, 10) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${1.6 - 0.6 * p})`, opacity: Math.min(1, p * 1.4) * o, filter: `blur(${(1 - p) * 14}px)`, fontFamily: SERIF, fontSize: size, fontStyle: italic ? "italic" : "normal", letterSpacing: "-0.035em", color, whiteSpace: "nowrap", ...bloom() }}>
      {text}
    </div>
  );
}

/** Pidgin line spoken by a character: shown as a quote with an English gloss. */
function Said({ text, gloss, who, f, start, end }: { text: string; gloss: string; who: string; f: number; start: number; end: number }) {
  const o = tw(f, start, 8) * (1 - tw(f, end, 10));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", opacity: o, transform: `translateY(${(1 - tw(f, start, 14, 0, 1, easeOut)) * 16}px)` }}>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, letterSpacing: "0.3em", color: "rgba(246,235,221,0.6)" }}>{who.toUpperCase()}</div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 58, color: C.cream, marginTop: 8, ...bloom("255,240,225", 0.5) }}>“{text}”</div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 20, color: "rgba(246,235,221,0.6)", marginTop: 6 }}>{gloss}</div>
    </div>
  );
}

const EVENING_TAGS: { from: [number, number]; to: [number, number]; title: string; amount: string; note?: string; swap?: string }[] = [
  { from: [420, 600], to: [330, 300], title: "Peak milk", amount: "₦2,200", note: "Ada? paid?" },
  { from: [1180, 520], to: [1420, 250], title: "Indomie ×5", amount: "₦1,750", note: "later" },
  { from: [880, 700], to: [600, 860], title: "Groundnut oil", amount: "₦3,800", note: "Bayo", swap: "Tunde?" },
  { from: [1500, 700], to: [1660, 840], title: "Milo", amount: "₦4,500", note: "next week" },
  { from: [1250, 600], to: [1500, 500], title: "Paid ₦2,000", amount: "", note: "who?" },
  { from: [1300, 760], to: [1100, 930], title: "Sugar", amount: "₦1,200", note: "Iya Basira?" },
];

export function M1v3() {
  const f = useCurrentFrame();
  const m = "M1";
  const bCustomer = at(m, "customer");
  const bThousand = at(m, "thousand");
  const bAunty = at(m, "Aunty");
  const bNods = at(m, "nods");
  const bBayo = at(m, "Bayo");
  const bThree = at(m, "three");
  const bMadam = at(m, "Madam");
  const bLater = at(m, "later");
  const bEvening = at(m, "evening");
  const bWho = at(m, "Who");
  const bBiscuit = at(m, "biscuit");
  const bHow = at(m, "How");
  const bHead = at(m, "head");
  const bSelling = at(m, "selling");
  const bWriting = at(m, "writing");
  const bSame = at(m, "same");

  // the whip from the wide market into the stall
  const whip = tw(f, bCustomer - 8, 10);
  // the "later." window opens into the evening market
  const laterHole = tw(f, bLater - 4, 10);
  const dive = tw(f, bEvening - 22, 26, 0, 1, easeIO);
  const diveScale = interpolate(dive, [0, 1], [1, 38]);
  // evening → dark world
  const toDark = tw(f, bHead - 6, 40);

  // counter value
  const counter = f < bThree ? "₦1,500" : f < bEvening + 30 ? "₦5,300" : "₦23,450";
  const counterAt = f < bThree ? bThousand : f < bEvening + 30 ? bThree + 6 : bEvening + 30;

  return (
    <AbsoluteFill style={{ background: "#0B0807" }}>
      <Audio src={staticFile("vo/M1.mp3")} />

      {/* 1 · the wide market */}
      {f < bCustomer + 6 && (
        <AbsoluteFill style={{ transform: `scale(${1.04 + f / 3500}) translateX(${-whip * 120}px)`, filter: `blur(${whip * 18}px) saturate(1.15) contrast(1.05)` }}>
          <OffthreadVideo src={staticFile("broll/market-keke.mp4")} muted playbackRate={0.55} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      )}
      {/* 2 · the stall, with what she can't write down drawn into it */}
      {f >= bCustomer - 4 && f < bLater + 6 && (
        <AbsoluteFill style={{ transform: `scale(${1.12 - tw(f, bCustomer - 4, 14) * 0.08 + (f - bCustomer) / 6000}) translateX(${(1 - tw(f, bCustomer - 4, 12)) * 140}px)`, filter: `blur(${(1 - tw(f, bCustomer - 4, 12)) * 16}px) saturate(${1.1 - tw(f, bLater - 16, 14) * 0.9}) brightness(${1 - tw(f, bLater - 16, 14) * 0.7})` }}>
          <Sequence from={bCustomer - 4}>
            <OffthreadVideo src={staticFile("broll/lagos-women.mp4")} muted playbackRate={0.7} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Sequence>
        </AbsoluteFill>
      )}
      {/* 3 · evening market (seen first through the letters of "later.") */}
      {f >= bLater - 6 && (
        <AbsoluteFill style={{ filter: `saturate(${1 - toDark * 0.7}) brightness(${0.85 - toDark * 0.6}) blur(${toDark * 10}px) hue-rotate(-8deg)`, transform: `scale(${1.1 + toDark * 0.15})` }}>
          <Sequence from={bLater - 6}>
            <OffthreadVideo src={staticFile("broll/market-keke.mp4")} muted playbackRate={0.45} startFrom={150} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Sequence>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(30,40,90,0.35), rgba(120,50,20,0.25))", mixBlendMode: "multiply" }} />
        </AbsoluteFill>
      )}
      {/* warm grade + dark world taking over */}
      <AbsoluteFill style={{ background: "linear-gradient(160deg, rgba(214,140,70,0.22), transparent 55%, rgba(20,30,60,0.3))", mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ opacity: toDark }}>
        <Bokeh warmth={0.6} />
      </AbsoluteFill>

      {/* title */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - tw(f, bCustomer - 14, 8) }}>
        <div style={{ position: "absolute", left: 140, top: 640, fontFamily: "var(--font-sans)", fontSize: 18, letterSpacing: "0.32em", color: "rgba(246,235,221,0.85)", opacity: tw(f, 40, 16) }}>A PROVISIONS SELLER · NIGERIAN MARKET</div>
        <Slam text="Nkechi." start={10} f={f} size={200} x={460} y={790} />
      </div>

      {/* callouts on the stall */}
      {f < bLater && (
        <>
          <Callout from={[1010, 640]} to={[1390, 380]} f={f} start={bCustomer + 14} end={bNods + 10}>
            <Tag title="Cabin biscuit" amount="₦1,500" note={f > bAunty + 20 ? "tomorrow?" : undefined} />
          </Callout>
          <Callout from={[640, 560]} to={[420, 300]} f={f} start={bBayo + 6} end={bLater - 16}>
            <Tag title="Groundnut oil · Bayo" amount="₦3,800" note={f > bMadam + 40 ? "Friday?" : undefined} tone="warn" />
          </Callout>
        </>
      )}

      {/* the motif: what is owed but not written */}
      {f > bCustomer + 20 && f < bHead + 20 && (
        <div style={{ position: "absolute", top: 56, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: tw(f, bCustomer + 20, 10) * (1 - tw(f, bLater - 10, 8)) + tw(f, bEvening + 20, 10) * (1 - tw(f, bHead, 16)) }}>
          <FlipCounter value={counter} label="OWED TO NKECHI · NOT WRITTEN DOWN" f={f} changedAt={counterAt} uncertain={f > bEvening + 30 ? 0.6 : 0} />
        </div>
      )}

      {/* characters speak */}
      <Said text="Aunty, I go pay you tomorrow o." gloss="Aunty, I'll pay you tomorrow." who="a customer" f={f} start={bAunty - 2} end={bNods} />
      <Said text="Madam, make I bring the money Friday." gloss="Madam, let me bring the money on Friday." who="Bayo" f={f} start={bMadam - 2} end={bLater - 16} />

      {/* "later." — a window into the evening, then the camera dives through the letters */}
      {f >= bLater - 6 && dive < 1 && (
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <mask id="laterMask">
                <rect width={1920} height={1080} fill="white" />
                <g transform={`translate(960 600) scale(${diveScale * (0.9 + 0.1 * laterHole)}) translate(-960 -600)`}>
                  <text x={960} y={690} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={400} letterSpacing={-14} fill="black" opacity={laterHole}>
                    later.
                  </text>
                </g>
              </mask>
            </defs>
            <rect width={1920} height={1080} fill="#0B0807" mask="url(#laterMask)" opacity={tw(f, bLater - 6, 6)} />
          </svg>
          <div style={{ position: "absolute", left: 960, top: 600, transform: `translate(-50%,-50%) scale(${diveScale})`, opacity: (1 - dive) * tw(f, bLater + 18, 12) }}>
            <div style={{ width: 860, height: 18, marginTop: 250, background: C.lav, borderRadius: 4, transformOrigin: "left", transform: `scaleX(${tw(f, bLater + 14, 14, 0, 1, easeOut)})`, boxShadow: "0 0 40px rgba(146,169,225,0.7)" }} />
          </div>
        </AbsoluteFill>
      )}

      {/* evening: everything she couldn't write, drawn into the market */}
      {f > bEvening && f < bHead + 30 &&
        EVENING_TAGS.map((t, i) => (
          <Callout key={i} from={t.from} to={t.to} f={f} start={bEvening + 16 + i * 7} end={bHead - 4}>
            <Tag title={t.title} amount={t.amount} note={t.swap && f > bWho + 10 ? t.swap : t.note} tone={t.swap && f > bWho + 10 ? "warn" : "cream"} />
          </Callout>
        ))}
      <Trail layers={5} lagInFrames={0.35} trailOpacity={0.9}>
        <Slam text="Who took the oil?" start={bWho - 2} f={f} size={110} x={960} y={500} out={bBiscuit - 6} />
        <Slam text="Paid?" start={bBiscuit} f={f} size={170} x={960} y={500} italic out={bHow - 6} />
        <Slam text="How many left?" start={bHow} f={f} size={120} x={960} y={500} out={bHead - 4} />
      </Trail>

      {/* selling × writing */}
      {f > bSelling - 6 && (() => {
        const meet = tw(f, bWriting, 22, 0, 1, easeOut);
        const hit = tw(f, bSame, 8, 0, 1, easeOut);
        const shake = f > bSame && f < bSame + 12 ? Math.sin(f * 3.1) * 10 * (1 - (f - bSame) / 12) : 0;
        const gap = interpolate(meet, [0, 1], [600, 20]) + hit * 300;
        const flash = tw(f, bSame, 3) * (1 - tw(f, bSame + 3, 14));
        return (
          <AbsoluteFill>
            <div style={{ position: "absolute", left: 960 - gap / 2 + shake, top: 540, transform: "translate(-100%,-50%)", fontFamily: SERIF, fontSize: 170, color: C.cream, letterSpacing: "-0.035em", opacity: tw(f, bSelling - 6, 8), ...bloom() }}>selling</div>
            {f > bWriting - 6 && <div style={{ position: "absolute", left: 960 + gap / 2 - shake, top: 540, transform: "translate(0,-50%)", fontFamily: SERIF, fontStyle: "italic", fontSize: 170, color: C.lav, letterSpacing: "-0.035em", opacity: tw(f, bWriting - 6, 8), ...bloom("146,169,225") }}>writing</div>}
            <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,240,225,0.9), transparent 40%)", opacity: flash }} />
          </AbsoluteFill>
        );
      })()}

      <Vignette strength={0.7} />
      <Grain opacity={0.06} />
      <Caption m={m} f={f} accent={["later", "nkechi", "selling"]} />
    </AbsoluteFill>
  );
}

/* ---------- M2: everything implodes into a point, the [k] builds around it, then we dive into its square ---------- */
const TILE = "M170,0 H600 Q670,0 670,70 V260 Q670,330 740,330 H930 Q1000,330 1000,400 V830 Q1000,1000 830,1000 H170 Q0,1000 0,830 V170 Q0,0 170,0 Z";
const K = "M31 4 93 41Q104 48 108.0 54.0Q112 60 112 73V654Q112 672 109.5 676.0Q107 680 93 685L24 708V712L187 770H196V247L426 470Q433 477 433 481Q433 487 421 493L359 526V530H546V526L485 479L320 318L543 6V0H437L258 257L196 197V73Q196 60 200.5 54.0Q205 48 219 41L293 4V0H31Z";

export function M2v3({ total }: { total: number }) {
  const f = useCurrentFrame();
  const m = "M2";
  const bWrites = at(m, "writes");
  const bSells = at(m, "sells");
  const implode = tw(f, 0, 16, 0, 1, easeIO);
  const point = tw(f, 12, 8) * (1 - tw(f, 20, 6));
  const tileP = sp(f, 18, { damping: 14, stiffness: 140 });
  const kP = tw(f, 26, 12);
  const stub = sp(f, bWrites, { damping: 10, stiffness: 240, mass: 0.7 });
  const obo = tw(f, bWrites + 8, 18, 0, 1, easeOut);
  const tag = tw(f, bSells + 8, 16, 0, 1, easeOut);
  // final dive into the square
  const diveStart = total - 26;
  const dive = tw(f, diveStart, 26, 0, 1, Easing3);
  const diveScale = interpolate(dive, [0, 1], [1, 60]);
  // the stub's centre in lockup coordinates (tile is 300px, stub centre at 858/1000)
  const lockLeft = interpolate(obo, [0, 1], [810, 537]);
  const stubCx = lockLeft + 0.858 * 300;
  const stubCy = 540 - 60 - 150 + 0.142 * 300;
  return (
    <AbsoluteFill style={{ background: "#0B0807" }}>
      <Audio src={staticFile("vo/M2.mp3")} />
      <Sequence from={bWrites - 1}>
        <Audio src={staticFile("music/percussions.mp3")} volume={(fr) => interpolate(fr, [0, 18, 34], [0.95, 0.5, 0], { extrapolateRight: "clamp" })} />
      </Sequence>
      <Bokeh warmth={0.45} intensity={1 - dive} />
      <AbsoluteFill style={{ transformOrigin: `${stubCx}px ${stubCy}px`, transform: `scale(${diveScale})` }}>
        {/* fragments imploding */}
        {implode < 1 &&
          Array.from({ length: 14 }).map((_, i) => {
            const ang = (i / 14) * Math.PI * 2;
            const r = 900 * (1 - implode);
            return <div key={i} style={{ position: "absolute", left: 960 + Math.cos(ang) * r * 1.2 - 90, top: 540 + Math.sin(ang) * r * 0.75 - 30, width: 180, height: 60, borderRadius: 12, background: "rgba(246,241,231,0.85)", opacity: 1 - implode, transform: `rotate(${ang * 40}deg) scale(${1 - implode * 0.7})`, filter: `blur(${implode * 8}px)` }} />;
          })}
        <div style={{ position: "absolute", left: 960 - 8, top: 540 - 8, width: 16, height: 16, borderRadius: 4, background: C.cream, opacity: point, boxShadow: "0 0 60px 20px rgba(146,169,225,0.6)" }} />
        {/* lockup */}
        <div style={{ position: "absolute", left: lockLeft, top: 540 - 60 - 150, display: "flex", alignItems: "flex-end", gap: 26 }}>
          <svg viewBox="0 0 1000 1000" width={300} height={300} style={{ overflow: "visible", transform: `scale(${tileP})`, transformOrigin: "85.8% 14.2%", filter: "drop-shadow(0 0 50px rgba(146,169,225,0.55))" }}>
            <path d={TILE} fill={C.lav} />
            <rect x="716" y={-500 + 500 * stub} width="284" height="284" rx="70" fill={C.cream} opacity={f >= bWrites ? 1 : 0} />
            <path transform="translate(164.1 916) scale(1.08 -1.08)" d={K} fill={C.ink} opacity={kP} />
          </svg>
          <div style={{ fontFamily: SERIF, fontSize: 340, lineHeight: 0.8, letterSpacing: "-0.045em", color: C.cream, clipPath: `inset(-20% ${(1 - obo) * 100}% -20% 0)`, marginBottom: 8, ...bloom("255,240,225", 0.7) }}>obo</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 540 + 150, textAlign: "center", fontFamily: SERIF, fontSize: 66, letterSpacing: "-0.02em", color: C.cream, opacity: tag * (1 - tw(f, diveStart, 8)), transform: `translateY(${(1 - tag) * 20}px)`, ...bloom("255,240,225", 0.5) }}>
          You sell. <span style={{ color: C.lav, fontStyle: "italic" }}>Kobo remembers.</span>
        </div>
      </AbsoluteFill>
      {/* the square fills the frame and becomes the WhatsApp wallpaper */}
      <AbsoluteFill style={{ background: "#EFE7DD", opacity: tw(f, total - 6, 6) }} />
      <Vignette strength={0.6 * (1 - dive)} />
      <Grain opacity={0.05} />
      <Caption m={m} f={f} accent={["writes"]} />
    </AbsoluteFill>
  );
}
const Easing3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
