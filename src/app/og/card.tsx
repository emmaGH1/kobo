import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SummaryCard, validateSummaryCard, type SummaryCardData } from "../../components/demo/summary-card";

export { formatNaira, type SummaryCardData } from "../../components/demo/summary-card";

/** Pre-calculated, owner-scoped ledger figures in; PNG out. Rendering never calculates balances. */
export async function renderSummaryCard(data: SummaryCardData): Promise<ImageResponse> {
  validateSummaryCard(data);
  const font = await readFile(join(process.cwd(), "src/app/og/DejaVuSans.ttf"));
  return new ImageResponse(<SummaryCard data={data} fontFamily="DejaVu" />, {
    width: 1080,
    height: 1350,
    fonts: [{ name: "DejaVu", data: font, style: "normal", weight: 400 }],
    headers: { "Cache-Control": "private, no-store" },
  });
}
