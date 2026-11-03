import { Composition, Still } from "remotion";
import { LookStill } from "./Looks";
import { Film, filmFrames } from "./Film";
import { OpeningFilm, openingFrames } from "./film2/OpeningFilm";

export const Root = () => (
  <>
    <Composition id="opening" component={OpeningFilm} durationInFrames={openingFrames} fps={30} width={1920} height={1080} />
    <Composition id="kobo-film" component={Film} durationInFrames={filmFrames} fps={30} width={1920} height={1080} />
    <Still id="look-graphite" component={() => <LookStill look="graphite" />} width={1920} height={1080} />
    <Still id="look-paper" component={() => <LookStill look="paper" />} width={1920} height={1080} />
    <Still id="look-dusk" component={() => <LookStill look="dusk" />} width={1920} height={1080} />
  </>
);
