import { describe, expect, it } from "vitest";
import { createDemo, formatNaira, naira, step, type DemoState } from "./demo-engine";

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
