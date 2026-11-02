import { Incoming } from "../chat/phone";
import type { ReplyView } from "../chat/types";

/**
 * Kobo's review message ("Make I write am like this?" + 1 save / 2 edit / 3 cancel) as a
 * standalone, props-only component. `marks` highlights the words Kobo picked out; `pressed`
 * shows a button mid-tap.
 */
export function ReviewCard({ view, time, pressed, marks, live = true }: { view: ReplyView; time?: string; pressed?: string; marks?: string[]; live?: boolean }) {
  return (
    <div data-demo="review-card-frame" className="flex flex-col font-sans" style={{ color: "#111B21" }}>
      <Incoming view={view} time={time} pressed={pressed} marks={marks} live={live} />
    </div>
  );
}
