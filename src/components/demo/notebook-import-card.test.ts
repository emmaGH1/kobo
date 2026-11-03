import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NotebookImportCard, type NotebookImportCardData } from "./notebook-import-card";
import { SAMPLE_IMPORT } from "./samples";

const html = (d: NotebookImportCardData) => renderToStaticMarkup(h(NotebookImportCard, { data: d }));

describe("NotebookImportCard", () => {
  it("lists every line read, flags the unclear ones and counts both", () => {
    const out = html(SAMPLE_IMPORT);
    expect(out).toContain('data-demo="notebook-import-card"');
    expect(out).toContain("6 lines read");
    expect(out).toContain("3 CLEAR");
    expect(out).toContain("3 TO CHECK");
    expect(out.match(/>CHECK</g)).toHaveLength(3);
    for (const s of ["Mama Chidi", "₦8,500", "₦31,800", "Read “19,8??” · last digits smudged", "₦3,500 or ₦35,000?"]) expect(out).toContain(s);
    expect(out).toContain("1 save / 2 edit / 3 cancel");
  });
  it("never shows an unreadable amount as a number", () => {
    const out = html({ ...SAMPLE_IMPORT, lines: [{ name: "Tunde", amountKobo: null, read: "3 5" }] });
    expect(out).toContain(">?<");
    expect(out).not.toMatch(/₦3,500<|₦35,000</);
  });
  it("shows the photo when given and a placeholder otherwise", () => {
    expect(html({ ...SAMPLE_IMPORT, photo: { src: "https://example.com/p.jpg", alt: "Notebook page" } })).toContain('alt="Notebook page"');
    expect(html(SAMPLE_IMPORT)).toContain("PHOTO");
  });
  it("rejects empty or oversized reviews", () => {
    expect(() => html({ ...SAMPLE_IMPORT, lines: [] })).toThrow();
    expect(() => html({ ...SAMPLE_IMPORT, lines: Array.from({ length: 9 }, () => SAMPLE_IMPORT.lines[0]) })).toThrow();
  });
});
