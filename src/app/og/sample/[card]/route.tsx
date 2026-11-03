import type { ReactElement } from "react";
import { CustomerHistoryCard } from "../../../../components/demo/customer-history-card";
import { DebtorsCard } from "../../../../components/demo/debtors-card";
import { InsightsCard } from "../../../../components/demo/insights-card";
import { NotebookImportCard } from "../../../../components/demo/notebook-import-card";
import { ReceiptCard } from "../../../../components/demo/receipt-card";
import { StockCard } from "../../../../components/demo/stock-card";
import { SummaryCard } from "../../../../components/demo/summary-card";
import * as S from "../../../../components/demo/samples";
import { renderCard } from "../../card";

// Design review only: every card rendered from SAMPLE data. Real cards must come from an
// authenticated, owner-scoped path in core.
const CARDS: Record<string, () => ReactElement> = {
  summary: () => <SummaryCard data={S.SAMPLE_SUMMARY} />,
  receipt: () => <ReceiptCard data={S.SAMPLE_RECEIPT} />,
  debtors: () => <DebtorsCard data={S.SAMPLE_DEBTORS} />,
  history: () => <CustomerHistoryCard data={S.SAMPLE_HISTORY} />,
  stock: () => <StockCard data={S.SAMPLE_STOCK} />,
  insights: () => <InsightsCard data={S.SAMPLE_INSIGHTS} />,
  import: () => <NotebookImportCard data={S.SAMPLE_IMPORT} />,
};

export async function GET(_req: Request, { params }: { params: Promise<{ card: string }> }) {
  const { card } = await params;
  const make = CARDS[card];
  if (!make) return new Response(`Unknown card. Try: ${Object.keys(CARDS).join(", ")}`, { status: 404 });
  return renderCard(make());
}
