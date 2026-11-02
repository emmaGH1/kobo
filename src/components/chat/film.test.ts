import { describe, expect, it } from "vitest";
import { CHAPTERS, buildFilm, chapterStarts } from "./film";

describe("hero film", () => {
  const film = buildFilm();

  it("has all six chapters in order", () => {
    const starts = chapterStarts(film);
    expect(starts).toHaveLength(CHAPTERS.length);
    expect(starts.every((s, i) => s >= 0 && (i === 0 || s > starts[i - 1]))).toBe(true);
  });

  it("starts at ₦0 with an empty book", () => {
    expect(film[0].stats.owed).toBe("₦0");
    expect(film[0].book).toHaveLength(0);
  });

  it("never shows a total that confirmed rows don't add up to", () => {
    const kobo = (v: string) => Number(v.replace(/[^\d]/g, ""));
    for (const f of film) {
      const net = f.book.reduce((a, r) => a + (r.entry === "opening" || r.entry === "credit" ? kobo(r.amount) : r.entry === "paid" ? -kobo(r.amount) : 0), 0);
      expect(kobo(f.stats.owed)).toBe(net);
    }
  });

  it("shows opening balances as confirmed rows before any other entry", () => {
    const first = film.find((f) => f.book.length > 0)!;
    expect(first.book.every((r) => r.entry === "opening")).toBe(true);
    expect(first.caption.kind).toBe("opening");
  });

  it("adds day entries only after a confirming tap", () => {
    let saves = 0;
    let prev = 0;
    for (const f of film) {
      if (f.pressed === "save") saves++;
      const dayRows = f.book.filter((r) => r.entry !== "opening").length;
      if (dayRows > prev) expect(saves).toBeGreaterThan(0);
      prev = dayRows;
    }
  });

  it("asks about 'three eight' with both readings", () => {
    const ask = film.find((f) => f.caption.kind === "ask")!;
    expect(ask.caption).toMatchObject({ options: ["₦3,800", "₦38,000"] });
  });

  it("ends with code-calculated totals, a reminder and a drafted message", () => {
    const last = film[film.length - 1];
    expect(last.stats).toEqual({ collected: "₦23,800", stock: "₦290,000", owed: "₦87,500" });
    expect(last.book.filter((r) => r.entry !== "opening").map((r) => [r.entry, r.amount])).toEqual([
      ["stock", "₦290,000"],
      ["credit", "₦45,000"],
      ["paid", "₦20,000"],
      ["paid", "₦3,800"],
    ]);
    expect(last.reminders).toEqual([{ date: "Fri 6 Nov", name: "Mama Chidi", amount: "₦25,000" }]);
    expect(last.caption).toMatchObject({ kind: "draft", to: "Mama Chidi" });
    expect(JSON.stringify(last.caption)).toContain("₦25,000 balance");
  });

  it("every confirmed day row is flown in from words marked in Kobo's review bubble", () => {
    const flights = film.filter((f) => f.fly);
    expect(flights).toHaveLength(3);
    for (const f of flights) {
      const review = f.msgs.find((m) => m.id === f.fly!.msg)!;
      expect(review.view?.footer).toBe("1 save / 2 edit / 3 cancel");
      for (const it of f.fly!.items) {
        expect(review.view!.body).toContain(`*${it.text}*`); // a bold word in the real message
        expect(f.marks!.words).toContain(it.text);
        expect(f.book.some((r) => r.id === it.row)).toBe(true);
      }
    }
  });

  it("is deterministic (server and client render the same frames)", () => {
    expect(JSON.stringify(buildFilm())).toBe(JSON.stringify(film));
  });
});
