// Sample data for look stills only (Nkechi and Bayo are fictional).
import type { ReplyView, BookRow } from "../../../src/components/demo";

export const review: ReplyView = {
  lang: "pcm",
  kind: "buttons",
  body:
    'Make I write am like this?\n> "Bayo carry one groundnut oil, three eight. E go pay Friday."\n*Credit sale*\n- 1 groundnut oil, *Bayo*: *₦3,800*\n- Remain go pay: *Fri 6 Nov* (₦3,800)',
  buttons: [
    { id: "1", title: "1 Save" },
    { id: "2", title: "2 Edit" },
    { id: "3", title: "3 Cancel" },
  ],
};
export const marks = ["Bayo", "₦3,800", "Fri 6 Nov"];

export const rows: BookRow[] = [
  { id: "a", time: "Opening", name: "Ada · Cabin biscuit", entry: "opening", amount: "₦1,500", owes: "₦1,500" },
  { id: "b", time: "12:10 PM", name: "Bayo · groundnut oil", entry: "credit", amount: "₦3,800", owes: "₦3,800" },
];
export const stats = { owed: "₦5,300", collected: "₦0", stock: "₦0" };
