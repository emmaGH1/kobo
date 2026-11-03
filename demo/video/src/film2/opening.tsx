import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, Caption, FPS, Glow, Grain, Kinetic, Mark, NumberRoll, Stage, Vignette, at, easeIO, easeOut, sp, tw } from "./fx";

/* ---------- The "later" card: a sale nobody wrote down ---------- */
function LaterCard({ item, who, amount, tag, f, amountAt, tagAt, w = 380 }: { item: string; who?: string; amount: string; tag?: string; f: number; amountAt: number; tagAt?: number; w?: number }) {
  const tagP = tagAt !== undefined ? sp(f, tagAt, { damping: 12, stiffness: 180 }) : 0;
  return (
    <div style={{ width: w, background: C.paper, borderRadius: 18, padding: "26px 30px 24px", color: C.ink, boxShadow: "0 50px 90px -30px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.04)", position: "relative", backgroundImage: "repeating-linear-gradient(0deg, rgba(42,58,158,0.08) 0 1px, transparent 1px 34px)", backgroundPosition: "0 20px" }}>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8A8478" }}>{who ? `${who} · not written` : "not written"}</div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 40, marginTop: 10, letterSpacing: "-0.02em" }}>{item}</div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 60, marginTop: 6, letterSpacing: "-0.03em" }}>
        <span style={{ opacity: tw(f, amountAt - 3, 5) }}><NumberRoll value={amount} start={amountAt} f={f} /></span>
      </div>
      {tag && (
        <div style={{ position: "absolute", right: 22, bottom: 26, fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 30, color: C.biro, opacity: tagP, transform: `rotate(-6deg) scale(${0.6 + 0.4 * tagP})`, transformOrigin: "right bottom" }}>{tag}</div>
      )}
    </div>
  );
}

/* ---------- A card placed in 3D with depth of field ---------- */
function Depth({ x, y, z, rx = 0, ry = 0, rz = 0, focus = 0, opacity = 1, children }: { x: number; y: number; z: number; rx?: number; ry?: number; rz?: number; focus?: number; opacity?: number; children: React.ReactNode }) {
  const blur = Math.min(14, Math.abs(z - focus) / 55);
  return (
    <div style={{ position: "absolute", left: 960 + x, top: 540 + y, transform: `translate(-50%,-50%) translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`, filter: `blur(${blur}px)`, opacity }}>
      {children}
    </div>
  );
}

/** Pidgin line as a quiet quote with its English gloss. */
function Quote({ text, gloss, f, start, end, x, y }: { text: string; gloss: string; f: number; start: number; end: number; x: number; y: number }) {
  const o = tw(f, start, 10) * (1 - tw(f, end, 12));
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `translateY(${(1 - tw(f, start, 14, 0, 1, easeOut)) * 20}px)` }}>
      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 54, color: C.cream, letterSpacing: "-0.02em" }}>“{text}”</div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 20, color: "rgba(246,235,221,0.6)", marginTop: 8, letterSpacing: "0.04em" }}>{gloss}</div>
    </div>
  );
}

const CROWD = [
  { item: "Peak milk", who: "Ada?", amount: "₦2,200", tag: "paid?" },
  { item: "Indomie ×5", amount: "₦1,750", tag: "later" },
  { item: "Sugar", who: "Iya Basira", amount: "₦1,200" },
  { item: "Milo", who: "Emeka", amount: "₦4,500", tag: "next week" },
  { item: "Groundnut oil", who: "Tunde?", amount: "₦3,800" },
  { item: "Paid ₦2,000", who: "who?", amount: "₦2,000" },
  { item: "Cabin biscuit", who: "Ada", amount: "₦1,500", tag: "paid?" },
  { item: "Rice, 1 paint", amount: "₦3,000", tag: "tomorrow" },
];

export function M1Opening() {
  const f = useCurrentFrame();
  const m = "M1";
  // beats from the spoken words
  const bCustomer = at(m, "customer");
  const bThousand = at(m, "thousand");
  const bTomorrow = at(m, "I");
  const bNods = at(m, "nods.");
  const bBayo = at(m, "Bayo");
  const bThree = at(m, "three");
  const bFriday = at(m, "Friday");
  const bLater = at(m, "later.");
  const bEvening = at(m, "evening,");
  const bWhoTook = at(m, "Who");
  const bBiscuitQ = at(m, "biscuit");
  const bCartons = at(m, "How");
  const bHead = at(m, "head.");
  const bSelling = at(m, "selling");
  const bWriting = at(m, "writing");
  const bSame = at(m, "same");

  // ---------- footage layer ----------
  const footBlur = tw(f, bCustomer + 30, 40, 0, 7);
  const footDim = tw(f, bCustomer + 30, 40, 1, 0.55) * (1 - tw(f, bLater - 6, 14) * 0.45);
  const toEvening = tw(f, bEvening - 10, 30);
  const footSat = 1 - tw(f, bLater - 6, 14) * 0.85 + toEvening * 0.85;

  // ---------- card A: Cabin biscuit ----------
  const aIn = sp(f, bCustomer + 18, { damping: 16, stiffness: 90 });
  const aBack = tw(f, bNods + 10, 40);
  const aX = interpolate(aIn, [0, 1], [-60, -330]) + aBack * -260;
  const aY = interpolate(aIn, [0, 1], [420, -40]) + aBack * -170;
  const aZ = interpolate(aIn, [0, 1], [-500, 120]) - aBack * 620;
  // ---------- card B: groundnut oil ----------
  const bIn = sp(f, bBayo + 6, { damping: 16, stiffness: 90 });
  const bBack = tw(f, bLater - 20, 36);
  const bX = interpolate(bIn, [0, 1], [900, 360]) + bBack * 120;
  const bY = interpolate(bIn, [0, 1], [-80, 10]) + bBack * -230;
  const bZ = interpolate(bIn, [0, 1], [-300, 140]) - bBack * 560;

  // ---------- the evening swirl ----------
  const swirl = tw(f, bEvening, 50);
  const spin = (f - bEvening) / FPS;
  const tighten = tw(f, bHead, 60);
  const finalRush = 0; // handled in M2

  // ---------- "later." freeze ----------
  const laterIn = f >= bLater - 4;
  const laterOut = tw(f, bEvening - 8, 14);

  // camera drift for the whole movement
  const camZ = interpolate(f, [0, bLater, bEvening, bHead + 120], [0, 60, -40, 80], { extrapolateRight: "clamp", easing: easeIO });
  const camRY = interpolate(f, [bEvening, bHead + 150], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#120C08" }}>
      <Audio src={staticFile("vo/M1.mp3")} />
      {/* footage: Lagos stall, then the keke market at evening */}
      <AbsoluteFill style={{ filter: `blur(${footBlur}px) saturate(${footSat}) brightness(${footDim})`, transform: `scale(${1.08 + f / 4000})` }}>
        <AbsoluteFill style={{ opacity: 1 - toEvening }}>
          <OffthreadVideo src={staticFile("broll/lagos-women.mp4")} muted playbackRate={0.6} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(4px)" }} />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: (1 - tw(f, bCustomer - 10, 24)) * (1 - toEvening) }}>
          <OffthreadVideo src={staticFile("broll/market-keke.mp4")} muted playbackRate={0.55} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: toEvening }}>
          <Sequence from={bEvening - 10}>
            <OffthreadVideo src={staticFile("broll/market-keke.mp4")} muted playbackRate={0.5} startFrom={120} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Sequence>
        </AbsoluteFill>
      </AbsoluteFill>
      {/* warm grade, turning to dusk */}
      <AbsoluteFill style={{ background: `linear-gradient(160deg, rgba(214,140,70,${0.28 - toEvening * 0.1}) 0%, transparent 55%, rgba(20,30,60,${0.25 + toEvening * 0.35}) 100%)`, mixBlendMode: "soft-light" }} />
      <Glow x={1500} y={260} size={900} color={`rgba(255,170,90,${0.22 - toEvening * 0.1})`} />

      {/* opening title */}
      <div style={{ position: "absolute", left: 140, bottom: 210, opacity: 1 - tw(f, bCustomer + 10, 16) }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 20, letterSpacing: "0.28em", color: "rgba(246,235,221,0.75)", opacity: tw(f, 50, 20), marginBottom: 18 }}>A PROVISIONS SELLER · NIGERIAN MARKET</div>
        <Kinetic text="Nkechi." start={12} f={f} size={170} />
      </div>

      <Stage>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translateZ(${camZ}px) rotateY(${camRY}deg)` }}>
          {/* card A */}
          {f > bCustomer && (
            <Depth x={aX} y={aY} z={aZ} ry={interpolate(aIn, [0, 1], [-35, 8])} rz={-3} opacity={aIn * (1 - swirl)} focus={120}>
              <LaterCard item="Cabin biscuit" amount="₦1,500" tag="tomorrow?" f={f} amountAt={bThousand - 6} tagAt={bTomorrow + 30} />
            </Depth>
          )}
          {/* card B */}
          {f > bBayo && (
            <Depth x={bX} y={bY} z={bZ} ry={interpolate(bIn, [0, 1], [40, -8])} rz={3} opacity={bIn * (1 - swirl)} focus={140}>
              <LaterCard item="Groundnut oil" who="Bayo" amount="₦3,800" tag="Friday?" f={f} amountAt={bThree - 4} tagAt={bFriday} />
            </Depth>
          )}
          {/* the evening crowd of unwritten sales */}
          {swirl > 0 &&
            [{ item: "Cabin biscuit", amount: "₦1,500", tag: "tomorrow?" }, { item: "Groundnut oil", who: "Bayo", amount: "₦3,800", tag: "Friday?" }, ...CROWD].map((c, i, arr) => {
              const n = arr.length;
              const ang = (i / n) * Math.PI * 2 + spin * 0.35;
              const radius = interpolate(tighten, [0, 1], [640, 360]) + Math.sin(i * 1.7) * 90;
              const x = Math.cos(ang) * radius * 1.35;
              const z = Math.sin(ang) * radius - 200;
              const y = Math.sin(i * 2.3 + spin * 0.5) * 230 * (1 - tighten * 0.4);
              const appear = sp(f, bEvening + 6 + i * 4, { damping: 18, stiffness: 100 });
              // labels slide onto the wrong person
              const wrong = f > bWhoTook + i * 3 && i % 3 === 1;
              return (
                <Depth key={i} x={x} y={y} z={z} ry={-Math.sin(ang) * 28} focus={-60} opacity={appear * swirl * (1 - tw(f, bSelling - 10, 20) * 0.75)}>
                  <LaterCard item={c.item} who={wrong ? "who?" : c.who} amount={c.amount} tag={c.tag} f={f} amountAt={bEvening + i * 4} w={340} />
                </Depth>
              );
            })}
        </div>
      </Stage>

      {/* pidgin quotes */}
      <Quote text="I go pay you tomorrow." gloss="I'll pay you tomorrow." f={f} start={bTomorrow} end={bNods + 6} x={980} y={300} />
      <Quote text="Make I bring the money Friday." gloss="Let me bring the money on Friday." f={f} start={bFriday - 22} end={bLater - 10} x={140} y={190} />

      {/* "later." — the freeze */}
      {laterIn && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - laterOut, zIndex: 20 }}>
          <div style={{ position: "relative" }}>
            <Kinetic text="later." start={bLater - 4} f={f} size={300} italic stagger={3} />
            <Mark start={bLater + 18} f={f} width={760} top={300} left={-20} height={20} />
          </div>
        </AbsoluteFill>
      )}

      {/* evening questions, at different depths */}
      <div style={{ zIndex: 20, position: "absolute", left: 150, top: 170, opacity: tw(f, bWhoTook - 4, 8) * (1 - tw(f, bHead - 6, 10)) }}>
        <Kinetic text="Who took the oil?" start={bWhoTook - 4} f={f} size={86} stagger={0.8} />
      </div>
      <div style={{ zIndex: 20, position: "absolute", right: 160, top: 470, opacity: tw(f, bBiscuitQ - 8, 8) * (1 - tw(f, bHead - 6, 10)) }}>
        <Kinetic text="Paid?" start={bBiscuitQ - 8} f={f} size={120} italic stagger={1.2} />
      </div>
      <div style={{ zIndex: 20, position: "absolute", left: 300, bottom: 200, opacity: tw(f, bCartons - 4, 8) * (1 - tw(f, bHead - 6, 10)) }}>
        <Kinetic text="How many left?" start={bCartons - 4} f={f} size={76} stagger={0.8} color="rgba(246,235,221,0.85)" />
      </div>

      {/* selling vs writing */}
      {f > bSelling - 6 && (() => {
        const meet = tw(f, bWriting, 26, 0, 1, easeOut);
        const bounce = tw(f, bSame, 10, 0, 1, easeOut);
        const shake = f > bSame && f < bSame + 12 ? Math.sin(f * 3) * 8 : 0;
        const gap = interpolate(meet, [0, 1], [520, 30]) + bounce * 260;
        return (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", zIndex: 20 }}>
            <div style={{ position: "relative", width: 1, height: 1 }}>
              <div style={{ position: "absolute", right: gap / 2 + shake, top: -80 }}>
                <Kinetic text="selling" start={bSelling - 6} f={f} size={160} />
              </div>
              {f > bWriting - 6 && (
                <div style={{ position: "absolute", left: gap / 2 - shake, top: -80 }}>
                  <Kinetic text="writing" start={bWriting - 6} f={f} size={160} italic color={C.lav} />
                </div>
              )}
            </div>
          </AbsoluteFill>
        );
      })()}

      <Vignette strength={0.8} />
      <Grain />
      <Caption m={m} f={f} accent={["later", "nkechi", "selling"]} />
      <span style={{ display: "none" }}>{finalRush}</span>
    </AbsoluteFill>
  );
}

/* ---------- M2: the cards rush in, the [k] lands ---------- */
const TILE = "M170,0 H600 Q670,0 670,70 V260 Q670,330 740,330 H930 Q1000,330 1000,400 V830 Q1000,1000 830,1000 H170 Q0,1000 0,830 V170 Q0,0 170,0 Z";
const K = "M31 4 93 41Q104 48 108.0 54.0Q112 60 112 73V654Q112 672 109.5 676.0Q107 680 93 685L24 708V712L187 770H196V247L426 470Q433 477 433 481Q433 487 421 493L359 526V530H546V526L485 479L320 318L543 6V0H437L258 257L196 197V73Q196 60 200.5 54.0Q205 48 219 41L293 4V0H31Z";

export function M2Reveal() {
  const f = useCurrentFrame();
  const m = "M2";
  const bWrites = at(m, "writes");
  const bSells = at(m, "sells.");
  const rush = tw(f, 0, 22, 0, 1, easeIO);
  const flash = tw(f, 20, 4) * (1 - tw(f, 24, 18));
  const tileP = sp(f, 22, { damping: 13, stiffness: 120 });
  const kP = sp(f, 30, { damping: 16, stiffness: 140 });
  const stubDrop = sp(f, bWrites, { damping: 9, stiffness: 220, mass: 0.8 });
  const obo = tw(f, bWrites + 6, 18, 0, 1, easeOut);
  const tag = tw(f, bSells + 10, 18, 0, 1, easeOut);
  const bg = tw(f, 10, 40);
  return (
    <AbsoluteFill style={{ background: "#120C08" }}>
      <Audio src={staticFile("vo/M2.mp3")} />
      <Sequence from={bWrites - 1}>
        <Audio src={staticFile("music/percussions.mp3")} volume={(fr) => interpolate(fr, [0, 20, 36], [0.9, 0.6, 0], { extrapolateRight: "clamp" })} />
      </Sequence>
      <AbsoluteFill style={{ background: `radial-gradient(60% 70% at 50% 50%, rgba(146,169,225,${0.32 * bg}), transparent 70%), radial-gradient(80% 80% at 50% 120%, rgba(214,140,70,${0.25 * (1 - bg)}), transparent 70%)` }} />
      {/* last cards rushing into the centre */}
      {rush < 1 &&
        Array.from({ length: 10 }).map((_, i) => {
          const ang = (i / 10) * Math.PI * 2;
          const r = 700 * (1 - rush);
          return (
            <div key={i} style={{ position: "absolute", left: 960 + Math.cos(ang) * r * 1.3 - 150, top: 540 + Math.sin(ang) * r * 0.7 - 60, width: 300, height: 120, borderRadius: 16, background: C.paper, opacity: 0.9 * (1 - rush), transform: `scale(${1 - rush * 0.8}) rotate(${ang * 20}deg)`, filter: `blur(${rush * 6}px)` }} />
          );
        })}
      <AbsoluteFill style={{ background: C.lav, opacity: flash * 0.55, mixBlendMode: "screen" }} />
      {/* lockup */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 26, transform: `translateX(${(1 - obo) * 150}px)` }}>
          <svg viewBox="0 0 1000 1000" width={260} height={260} style={{ transform: `scale(${tileP}) rotate(${(1 - tileP) * -12}deg)`, overflow: "visible", filter: "drop-shadow(0 30px 60px rgba(146,169,225,0.45))" }}>
            <path d={TILE} fill={C.lav} />
            <rect x="716" y={-600 + 600 * stubDrop} width="284" height="284" rx="70" fill={C.cream} opacity={stubDrop > 0.02 ? 1 : 0} />
            <path transform="translate(164.1 916) scale(1.08 -1.08)" d={K} fill={C.ink} opacity={kP} />
          </svg>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 300, lineHeight: 0.8, letterSpacing: "-0.04em", color: C.cream, clipPath: `inset(0 ${(1 - obo) * 100}% 0 0)`, marginBottom: 6 }}>obo</div>
        </div>
        <div style={{ marginTop: 60, fontFamily: "var(--font-serif)", fontSize: 64, letterSpacing: "-0.02em", color: C.cream, opacity: tag, transform: `translateY(${(1 - tag) * 24}px)` }}>
          You sell. <span style={{ color: C.lav, fontStyle: "italic" }}>Kobo remembers.</span>
        </div>
      </AbsoluteFill>
      <Vignette strength={0.7} />
      <Grain />
      <Caption m={m} f={f} accent={["writes"]} />
    </AbsoluteFill>
  );
}
