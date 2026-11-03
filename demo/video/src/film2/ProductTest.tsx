import { AbsoluteFill, Series } from "remotion";
import "../compiled.css";
import durations from "../durations.json";
import { M3v3, M4v3 } from "./product";

export const P_M3 = Math.round((durations.M3 + 0.5) * 30);
export const P_M4 = Math.round((durations.M4 + 0.5) * 30);
export const productFrames = P_M3 + P_M4;
export function ProductTest() {
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={P_M3}><M3v3 /></Series.Sequence>
        <Series.Sequence durationInFrames={P_M4}><M4v3 /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
