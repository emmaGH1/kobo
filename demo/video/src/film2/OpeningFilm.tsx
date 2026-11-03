import { AbsoluteFill, Audio, Series, interpolate, staticFile } from "remotion";
import "../compiled.css";
import durations from "../durations.json";
import { M1Opening, M2Reveal } from "./opening";
import { at } from "./fx";

export const M1F = Math.round((durations.M1 + 1.0) * 30);
export const M2F = Math.round(6.0 * 30);
export const openingFrames = M1F + M2F;

export function OpeningFilm() {
  const later = at("M1", "later");
  const evening = at("M1", "evening");
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music/opening-africa.mp3")}
        volume={(f) =>
          interpolate(f, [0, 30, later - 10, later + 4, evening - 4, evening + 20, M1F - 20, M1F + 10], [0, 0.2, 0.2, 0.04, 0.04, 0.22, 0.22, 0], { extrapolateRight: "clamp" })
        }
      />
      <Series>
        <Series.Sequence durationInFrames={M1F}>
          <M1Opening />
        </Series.Sequence>
        <Series.Sequence durationInFrames={M2F}>
          <M2Reveal />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
