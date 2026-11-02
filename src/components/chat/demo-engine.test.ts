import { describe, expect, it } from "vitest";
import { createDemo, dayTotals, dueReminders, formatNaira, naira, nextWeekday, step, type DemoState } from "./demo-engine";

const NOW = new Date(2026, 10, 1, 16, 12);
const bal = (s: DemoState, id: string) => s.customers.find((c) => c.id === id)!.balance;
const total = (s: DemoState) => s.customers.reduce((a, c) => a + c.balance, 0);

describe("formatNaira", () => {
  it("follows the DESIGN.md rules", () => {
    expect(formatNaira(naira(3800))).toBe("₦3,800");
    expect(formatNaira(naira(38000))).toBe("₦38,000");
    expect(formatNaira(380050)).toBe("₦3,800.50");
    expect(formatNaira(0)).toBe("₦0");
    expect(formatNaira(naira(1234567))).toBe("₦1,234,567");
  });
  it("rejects floats and negatives", () => {
    expect(() => formatNaira(1.5)).toThrow();
    expect(() => formatNaira(-1)).toThrow();
  });
});

describe("scripted demo", () => {
  it("asks about 'three eight' and never saves until answered and confirmed", () => {
    const s = createDemo("pcm");
    const before = total(s);
    let r = step(s, { text: "Bayo pay me three eight", now: NOW });
    expect(r.replies[0].buttons?.map((b) => b.title)).toEqual(["₦3,800", "₦38,000", "Another amount"]);
    expect(r.state.pending).toBeNull();
    // saving while the question is open is refused
    r = step(r.state, { text: "1", now: NOW });
    expect(total(r.state)).toBe(before);
    r = step(r.state, { action: `amount:${naira(3800)}`, now: NOW });
    expect(r.replies[0].body).toContain("*₦28,000*");
    expect(total(r.state)).toBe(before); // still nothing saved
    r = step(r.state, { text: "1 save", now: NOW });
    expect(bal(r.state, "bayo")).toBe(naira(28000));
    expect(total(r.state)).toBe(before - naira(3800));
  });

  it("rejects an amount that was not offered", () => {
    let s = createDemo();
    s = step(s, { text: "Bayo pay me three eight" }).state;
    const r = step(s, { action: `amount:${naira(380)}` });
    expect(r.state.pending).toBeNull();
  });

  it("computes the sale + payment review in code and saves once", () => {
    let r = step(createDemo(), { text: "Mama Chidi carry rice 45k, she pay 20k", now: NOW });
    expect(r.replies[0].body).toContain("*₦33,500*");
    expect(r.replies[0].footer).toBe("1 save / 2 edit / 3 cancel");
    r = step(r.state, { text: "1", now: NOW });
    expect(bal(r.state, "mama-chidi")).toBe(naira(33500));
    // a second "1" has nothing pending: no duplicate entry
    const again = step(r.state, { text: "1", now: NOW });
    expect(bal(again.state, "mama-chidi")).toBe(naira(33500));
  });

  it("undo is a reviewed reversal that restores the balance", () => {
    let r = step(createDemo(), { text: "Mama Chidi carry rice 45k, she pay 20k", now: NOW });
    r = step(r.state, { text: "1", now: NOW });
    r = step(r.state, { action: "undo", now: NOW });
    expect(bal(r.state, "mama-chidi")).toBe(naira(33500)); // not applied until confirmed
    r = step(r.state, { text: "1", now: NOW });
    expect(bal(r.state, "mama-chidi")).toBe(naira(8500));
    expect(r.state.customers[0].entries[0].kind).toBe("fix");
  });

  it("cancel and edit save nothing", () => {
    for (const choice of ["3", "2"]) {
      let r = step(createDemo(), { text: "Iya Basira don pay everything" });
      const before = total(r.state);
      r = step(r.state, { text: choice });
      expect(total(r.state)).toBe(before);
      expect(r.state.pending).toBeNull();
    }
  });

  it("lists debtors biggest first with a code-calculated total", () => {
    const r = step(createDemo(), { text: "Who dey owe me" });
    expect(r.replies[0].body).toContain("Total: *₦101,600*");
    expect(r.replies[0].list?.rows[0].title).toBe("Bayo");
    expect(r.counted).toBe(true);
  });

  it("does not count button taps or 1/2/3 toward the limit", () => {
    expect(step(createDemo(), { action: "debtors" }).counted).toBe(false);
    expect(step(createDemo(), { text: "1" }).counted).toBe(false);
  });

  it("falls back to the unknown-request reply instead of guessing", () => {
    const r = step(createDemo("en"), { text: "sell 40 bags of cement to Kunle" });
    expect(r.replies[0].body).toContain("I keep your book");
    expect(r.state.pending).toBeNull();
  });
});

describe("stock, due dates, reminders and the day summary", () => {
  const MON = new Date(2026, 10, 2, 7, 52); // Monday 2 Nov 2026
  const FRI = new Date(2026, 10, 6, 8, 0);

  it("records stock bought as money out, only after confirmation", () => {
    let r = step(createDemo(), { text: "I buy 5 bag rice from Alhaji, 290k", now: MON });
    expect(r.replies[0].body).toContain("*₦290,000*");
    expect(r.state.purchases).toHaveLength(0);
    r = step(r.state, { text: "1", now: MON });
    expect(r.state.purchases.map((p) => p.amount)).toEqual([naira(290000)]);
    expect(r.replies[0].body).toContain("₦290,000");
  });

  it("turns 'Friday' into a date in code and reminds on that morning", () => {
    let r = step(createDemo(), { text: "Mama Chidi carry rice 45k, she pay 20k, remain Friday", now: MON });
    expect(r.replies[0].body).toContain("Fri 6 Nov");
    expect(r.replies[0].body).toContain("₦25,000");
    r = step(r.state, { text: "1", now: MON });
    expect(r.replies[0].body).toContain("I go remind you Fri 6 Nov");
    expect(dueReminders(r.state, new Date(2026, 10, 5, 8))).toHaveLength(0); // Thursday: nothing
    const rem = dueReminders(r.state, FRI);
    expect(rem).toHaveLength(1);
    expect(rem[0].body).toContain("*₦25,000*");
    expect(rem[0].body).toContain("*₦33,500*");
    const draft = step(r.state, { action: "remind-draft:mama-chidi", now: FRI });
    expect(draft.replies[0].body).toContain("₦25,000 balance for the 2 bag rice");
    expect(draft.replies[0].footer).toContain("Nothing go out without you");
  });

  it("a promise with no day gets no due date", () => {
    const r = step(createDemo(), { text: "Mama Chidi carry rice 45k, she pay 20k", now: MON });
    expect(r.replies[0].body).not.toContain("Remain go pay");
  });

  it("sums the day from confirmed entries", () => {
    let s = createDemo();
    s = step(s, { text: "I buy 5 bag rice from Alhaji, 290k", now: MON }).state;
    s = step(s, { text: "1", now: MON }).state;
    s = step(s, { text: "Mama Chidi carry rice 45k, she pay 20k, remain Friday", now: MON }).state;
    s = step(s, { text: "1", now: MON }).state;
    expect(dayTotals(s, MON)).toMatchObject({ credit: naira(45000), collected: naira(20000), stock: naira(290000), entries: 3 });
    const sum = step(s, { text: "How market today?", now: MON });
    expect(sum.replies[0].body).toContain("Mon 2 Nov");
    expect(sum.replies[0].body).toContain("*₦290,000*");
    expect(sum.replies[0].body).toContain("*₦126,600*");
  });

  it("nextWeekday is strictly after the given day", () => {
    expect(nextWeekday(new Date(2026, 10, 6), 5).getDate()).toBe(13); // Friday -> next Friday
  });
});

describe("opening balances", () => {
  it("an empty book totals ₦0", () => {
    const s = createDemo("pcm", []);
    expect(s.customers).toHaveLength(0);
    expect(dayTotals(s, new Date(2026, 10, 2)).owed).toBe(0);
  });
  it("every demo balance is backed by confirmed entries", () => {
    for (const c of createDemo().customers) {
      expect(c.entries.length).toBeGreaterThan(0);
      expect(c.entries[0].owes).toBe(c.balance);
      const net = c.entries.reduce((a, e) => a + (e.kind === "paid" ? -e.amount : e.amount), 0);
      expect(net).toBe(c.balance);
    }
  });
});
