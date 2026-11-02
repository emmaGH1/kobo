import { Bell } from "lucide-react";
import type { BookReminder, BookRow, BookStats } from "./types";

const ENTRY = { credit: "Credit sale", paid: "Paid", stock: "Stock bought", fix: "Correction", opening: "Opening balance" } as const;
const LABEL = "font-sans text-[12px] uppercase tracking-[0.12em] text-ink-3";

/**
 * The book: totals, confirmed rows and upcoming reminders. Props only (safe for Remotion).
 * Rows carry data-row / data-fly-target hooks for the signature motion.
 */
export function BookPanel({
  date,
  stats,
  rows,
  reminders = [],
  landing,
  className = "",
}: {
  date: string;
  stats: BookStats;
  rows: BookRow[];
  reminders?: BookReminder[];
  /** Row ids being flown into right now: their highlight waits for the words to land. */
  landing?: Set<string>;
  className?: string;
}) {
  return (
    <div data-demo="book" className={`rounded-[24px] border border-ink/12 bg-[#FAFAF8] p-6 lg:p-7 ${className}`}>
      <div className="flex items-baseline justify-between">
        <p className={LABEL}>The book · {date}</p>
        <p className="font-sans text-[12px] text-ink-3">Only confirmed entries</p>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-4">
        {[
          { l: "People owe you", v: stats.owed, c: "" },
          { l: "Collected today", v: stats.collected, c: "text-paid" },
          { l: "Stock bought", v: stats.stock, c: "" },
        ].map((x) => (
          <div key={x.l}>
            <dt className="font-sans text-[12px] text-ink-2 sm:text-[13px]">{x.l}</dt>
            <dd className={`tnum mt-1 text-[20px] leading-none tracking-[-0.02em] sm:text-[30px] lg:text-[28px] xl:text-[32px] ${x.c}`}>{x.v}</dd>
          </div>
        ))}
      </dl>
      <table className="mt-6 w-full border-t border-ink/12 font-sans text-[14px]">
        <thead className="sr-only">
          <tr>
            <th>Time</th>
            <th>Who or what</th>
            <th>Entry</th>
            <th>Amount</th>
            <th>Owes</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-ink-3">Nothing written yet. Kobo only writes after you confirm.</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} data-row={r.id} data-landing={landing?.has(r.id) || undefined} className="book-row border-b border-ink/8 last:border-0">
              <td className="tnum hidden py-2.5 pr-3 text-ink-3 sm:table-cell lg:hidden xl:table-cell">{r.time}</td>
              <td className="py-2.5 pr-3 font-serif text-[15px] leading-tight sm:text-[16px]">
                <span data-fly-target="name">{r.name}</span>
              </td>
              <td className="hidden py-2.5 pr-3 text-ink-2 sm:table-cell">{ENTRY[r.entry]}</td>
              <td className={`tnum whitespace-nowrap py-2.5 pr-3 text-right ${r.entry === "credit" || r.entry === "opening" ? "text-owed" : r.entry === "paid" ? "text-paid" : ""}`}>
                {r.entry === "stock" ? "−" : ""}
                <span data-fly-target="amount">{r.amount}</span>
              </td>
              <td className="tnum whitespace-nowrap py-2.5 text-right text-[12px] text-ink-2 sm:text-[14px]">{r.owes ? `owes ${r.owes}` : "out"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {reminders.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink/12 pt-4 font-sans text-[13px] text-ink-2">
          <Bell className="size-4 text-ink" strokeWidth={1.5} />
          <span className="text-ink">Reminders</span>
          {reminders.map((r) => (
            <span key={r.name}>
              {r.date} · {r.name} · <span className="tnum">{r.amount}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
