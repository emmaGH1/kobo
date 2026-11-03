import { ReceiptCard } from "../../../components/demo/receipt-card";
import { renderCard } from "../card";

// Public design preview with sample data only. Real receipts must go through an authenticated,
// owner-scoped path and be sent by the trader, never to a customer number Kobo stores.
export async function GET() {
  return renderCard(
    <ReceiptCard
      fontFamily="DejaVu"
      data={{
        sample: true,
        shop: "Nkechi Provisions",
        date: "MON 2 NOV · 12:11 PM",
        ref: "K-0002",
        customer: "Mama Chidi",
        item: "Rice",
        qty: "2 bags",
        amountKobo: 4_500_000,
        paidKobo: 2_000_000,
        owedKobo: 2_500_000,
        due: "Fri 6 Nov",
      }}
    />,
  );
}
