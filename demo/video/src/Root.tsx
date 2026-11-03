import { Composition, Still } from "remotion";
import { LookStill } from "./Looks";
import { Film, filmFrames } from "./Film";
import { OpeningFilm, openingFrames } from "./film2/OpeningFilm";
import { Opening3Film, opening3Frames } from "./film2/Opening3Film";
import { ProductTest, productFrames } from "./film2/ProductTest";
import { FullFilm, fullFrames } from "./film2/FullFilm";

export const Root = () => (
  <>
    <Composition id="kobo-v3" component={FullFilm} durationInFrames={fullFrames} fps={30} width={1920} height={1080} />
    <Composition id="product" component={ProductTest} durationInFrames={productFrames} fps={30} width={1920} height={1080} />
    <Composition id="opening3" component={Opening3Film} durationInFrames={opening3Frames} fps={30} width={1920} height={1080} />
    <Composition id="opening" component={OpeningFilm} durationInFrames={openingFrames} fps={30} width={1920} height={1080} />
    <Composition id="kobo-film" component={Film} durationInFrames={filmFrames} fps={30} width={1920} height={1080} />
    <Still id="look-graphite" component={() => <LookStill look="graphite" />} width={1920} height={1080} />
    <Still id="look-paper" component={() => <LookStill look="paper" />} width={1920} height={1080} />
    <Still id="look-dusk" component={() => <LookStill look="dusk" />} width={1920} height={1080} />
  </>
);
