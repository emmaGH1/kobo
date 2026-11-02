import { Still } from "remotion";
import { LookStill } from "./Looks";

export const Root = () => (
  <>
    <Still id="look-graphite" component={() => <LookStill look="graphite" />} width={1920} height={1080} />
    <Still id="look-paper" component={() => <LookStill look="paper" />} width={1920} height={1080} />
    <Still id="look-dusk" component={() => <LookStill look="dusk" />} width={1920} height={1080} />
  </>
);
