import { AbsoluteFill, Audio, Series, interpolate, staticFile } from "remotion";
import "../compiled.css";
import durations from "../durations.json";
import { M1v3, M2v3 } from "./opening3";
import { at } from "./fx";

export const O3_M1 = Math.round((durations.M1 + 1.2) * 30);
export const O3_M2 = Math.round(6.4 * 30);
export const opening3Frames = O3_M1 + O3_M2;

export function Opening3Film() {
  const later = at("M1", "later");
  const evening = at("M1", "evening");
  const head = at("M1", "head");
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music/opening-africa.mp3")}
        volume={(f) =>
          interpolate(
            f,
            [0, 20, later - 8, later + 2, evening - 10, evening + 14, head, O3_M1 - 10, O3_M1 + 8],
            [0, 0.22, 0.22, 0.03, 0.03, 0.24, 0.2, 0.12, 0],
            { extrapolateRight: "clamp" },
          )
        }
      />
      <Series>
        <Series.Sequence durationInFrames={O3_M1}>
          <M1v3 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={O3_M2}>
          <M2v3 total={O3_M2} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
