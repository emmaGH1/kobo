/** Props-only shapes for the camera-ready components. No engine imports here. */
export interface BookRow {
  id: string;
  time: string;
  name: string;
  entry: "credit" | "paid" | "stock" | "fix" | "opening";
  amount: string;
  owes?: string;
}
export interface BookStats {
  owed: string;
  collected: string;
  stock: string;
}
export interface BookReminder {
  date: string;
  name: string;
  amount: string;
}
