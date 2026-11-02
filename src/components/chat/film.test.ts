import { describe, expect, it } from "vitest";
import { CHAPTERS, buildFilm, chapterStarts } from "./film";

describe("hero film", () => {
  const film = buildFilm();

  it("has all six chapters in order", () => {
    const starts = chapterStarts(film);
    expect(starts).toHaveLength(CHAPTERS.length);
    expect(starts.every((s, i) => s >= 0 && (i === 0 || s > starts[i - 1]))).toBe(true);
  });

  it("never adds a book row without a confirming tap first", () => {
    let saves = 0;
    let prevRows = 0;
    for (const f of film) {
      if (f.pressed === "save") saves++;
      if (f.book.length > prevRows) expect(saves).toBeGreaterThan(0);
      prevRows = f.book.length;
    }
  });

  it("asks about 'three eight' with both readings", () => {
    const ask = film.find((f) => f.caption.kind === "ask")!;
    expect(ask.caption).toMatchObject({ options: ["₦3,800", "₦38,000"] });
  });

  it("ends with code-calculated totals, a reminder and a drafted message", () => {
    const last = film[film.length - 1];
    expect(last.stats).toEqual({ collected: "₦23,800", stock: "₦290,000", owed: "₦122,800" });
    expect(last.book.map((r) => [r.entry, r.amount])).toEqual([
      ["stock", "₦290,000"],
      ["credit", "₦45,000"],
      ["paid", "₦20,000"],
      ["paid", "₦3,800"],
    ]);
    expect(last.reminders).toEqual([{ date: "Fri 6 Nov", name: "Mama Chidi", amount: "₦25,000" }]);
    expect(last.caption).toMatchObject({ kind: "draft", to: "Mama Chidi" });
    expect(JSON.stringify(last.caption)).toContain("₦25,000 balance");
  });

  it("is deterministic (server and client render the same frames)", () => {
    expect(JSON.stringify(buildFilm())).toBe(JSON.stringify(film));
  });
});
