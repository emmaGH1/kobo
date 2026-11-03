import { Series } from "remotion";
import "./compiled.css";
import { SCENES } from "./film/scenes";
import { ORDER, sceneFrames } from "./film/kit";

export const filmFrames = ORDER.reduce((a, m) => a + sceneFrames(m), 0);

export function Film() {
  return (
    <Series>
      {ORDER.map((m) => {
        const S = SCENES[m];
        return (
          <Series.Sequence key={m} durationInFrames={sceneFrames(m)} name={m}>
            <S />
          </Series.Sequence>
        );
      })}
    </Series>
  );
}
