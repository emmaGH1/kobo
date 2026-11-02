import { renderSummaryCard } from "./card";

// Public design preview only. Real trader data must use an authenticated delivery path.
export async function GET() {
  return renderSummaryCard({
    sample: true,
    date: "MON 2 NOV",
    shop: "Nkechi Provisions",
    owedKobo: 12_280_000,
    creditKobo: 4_500_000,
    collectedKobo: 2_380_000,
    stockKobo: 29_000_000,
    entries: 4,
    biggest: [
      { name: "Mama Chidi", owedKobo: 3_350_000 },
      { name: "Bayo", owedKobo: 2_800_000 },
      { name: "Iya Basira", owedKobo: 2_600_000 },
    ],
  });
}
