import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CARD } from "../../components/demo/card-kit";
import { SummaryCard, validateSummaryCard, type SummaryCardData } from "../../components/demo/summary-card";

export { formatNaira, type SummaryCardData } from "../../components/demo/summary-card";

/** Renders any Kobo card (built on card-kit) to a 1080×1350 PNG with the bundled DejaVu font. */
export async function renderCard(card: ReactElement): Promise<ImageResponse> {
  const font = await readFile(join(process.cwd(), "src/app/og/DejaVuSans.ttf"));
  return new ImageResponse(card, {
    ...CARD,
    fonts: [{ name: "DejaVu", data: font, style: "normal", weight: 400 }],
    headers: { "Cache-Control": "private, no-store" },
  });
}

/** Pre-calculated, owner-scoped ledger figures in; PNG out. Rendering never calculates balances. */
export async function renderSummaryCard(data: SummaryCardData): Promise<ImageResponse> {
  validateSummaryCard(data);
  return renderCard(<SummaryCard data={data} fontFamily="DejaVu" />);
}
