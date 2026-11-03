import { AbsoluteFill, Audio, Sequence, Series, interpolate, staticFile } from "remotion";
import "../compiled.css";
import durations from "../durations.json";
import { M1v3, M2v3 } from "./opening3";
import { M3v3, M4v3 } from "./product";
import { M5v3, M6v3, M7v3, M8v3 } from "./product2";
import { at } from "./fx";

const s = (sec: number) => Math.round(sec * 30);
export const LEN = {
  M1: s(durations.M1 + 0.5),
  M2: s(5.4),
  M3: s(durations.M3 + 0.25),
  M4: s(durations.M4 + 0.25),
  M5: s(durations.M5 + 0.25),
  M6: s(durations.M6 + 0.25),
  M7: s(durations.M7 + 0.25),
  M8: s(6.4),
};
const START: Record<string, number> = {};
let acc = 0;
for (const k of Object.keys(LEN)) { START[k] = acc; acc += LEN[k as keyof typeof LEN]; }
export const fullFrames = acc;

/** One music bed placed over a span, with fades in and out. */
function Bed({ src, from, len, vol, fadeIn = 20, fadeOut = 30, loop }: { src: string; from: number; len: number; vol: number; fadeIn?: number; fadeOut?: number; loop?: boolean }) {
  return (
    <Sequence from={from} durationInFrames={len}>
      <Audio src={staticFile(src)} loop={loop} volume={(f) => interpolate(f, [0, fadeIn, len - fadeOut, len], [0, vol, vol, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </Sequence>
  );
}

export function FullFilm() {
  const later = at("M1", "later");
  const evening = at("M1", "evening");
  return (
    <AbsoluteFill style={{ background: "#0B0807" }}>
      {/* opening: market bed, ducked for "later." */}
      <Sequence from={0} durationInFrames={LEN.M1 + 20}>
        <Audio src={staticFile("music/opening-africa.mp3")} volume={(f) => interpolate(f, [0, 20, later - 8, later + 2, evening - 10, evening + 14, LEN.M1 - 10, LEN.M1 + 20], [0, 0.2, 0.2, 0.03, 0.03, 0.22, 0.18, 0], { extrapolateRight: "clamp" })} />
      </Sequence>
      <Bed src="music/pulse-tutorial.mp3" from={START.M3 - 10} len={LEN.M3 + LEN.M4 + 10} vol={0.14} loop />
      <Bed src="music/groove-afro-vibration.mp3" from={START.M5} len={LEN.M5 + 10} vol={0.16} fadeIn={12} />
      <Bed src="music/soft-loop.mp3" from={START.M6} len={LEN.M6} vol={0.17} fadeIn={30} />
      <Bed src="music/pulse-tutorial.mp3" from={START.M7} len={LEN.M7} vol={0.13} loop />
      <Bed src="music/soft-loop.mp3" from={START.M8 - 10} len={LEN.M8 + 10} vol={0.2} fadeOut={45} />
      <Series>
        <Series.Sequence durationInFrames={LEN.M1}><M1v3 /></Series.Sequence>
        <Series.Sequence durationInFrames={LEN.M2}><M2v3 total={LEN.M2} /></Series.Sequence>
        <Series.Sequence durationInFrames={LEN.M3}><M3v3 /></Series.Sequence>
        <Series.Sequence durationInFrames={LEN.M4}><M4v3 /></Series.Sequence>
        <Series.Sequence durationInFrames={LEN.M5}><M5v3 /></Series.Sequence>
        <Series.Sequence durationInFrames={LEN.M6}><M6v3 /></Series.Sequence>
        <Series.Sequence durationInFrames={LEN.M7}><M7v3 /></Series.Sequence>
        <Series.Sequence durationInFrames={LEN.M8}><M8v3 /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
