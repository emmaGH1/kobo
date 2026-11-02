import { describe, expect, it } from "vitest";
import { buildFilm } from "./film";

describe("hero film", () => {
  const film = buildFilm();
  it("never writes to the book before the trader confirms", () => {
    let confirmed = 0;
    for (const f of film) {
      if (f.pressed === "save") confirmed++;
      // two scenes: rows may only exist after the matching save tap
      if (confirmed === 0) expect(f.book).toHaveLength(0);
    }
  });
  it("asks about 'three eight' with both readings and nothing saved", () => {
    const ask = film.find((f) => f.caption.kind === "ask")!;
    expect(ask.caption).toMatchObject({ options: ["₦3,800", "₦38,000"] });
    expect(ask.book).toHaveLength(2); // only Mama Chidi's two entries so far
  });
  it("ends with code-calculated balances", () => {
    const last = film[film.length - 1];
    expect(last.book.map((r) => [r.name, r.entry, r.amount, r.owes])).toEqual([
      ["Mama Chidi", "credit", "₦45,000", "₦53,500"],
      ["Mama Chidi", "paid", "₦20,000", "₦33,500"],
      ["Bayo", "paid", "₦3,800", "₦28,000"],
    ]);
    expect(last.owed).toBe("₦122,800");
  });
  it("is deterministic (server and client render the same frames)", () => {
    expect(JSON.stringify(buildFilm())).toBe(JSON.stringify(film));
  });
});
