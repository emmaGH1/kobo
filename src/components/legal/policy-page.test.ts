import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PolicyPage } from "./policy-page";

const plain = (text: string) => text.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

describe("public policies", () => {
  for (const document of ["PRIVACY_POLICY", "DATA_DELETION"] as const) {
    it(`preserves every approved content block in ${document} and links both pages`, () => {
      const html = renderToStaticMarkup(createElement(PolicyPage, { document }));
      const rendered = plain(html);
      const source = readFileSync(`docs/${document}.md`, "utf8");
      for (const line of source.split("\n").filter(Boolean)) {
        const content = line.replace(/^#{1,2} |^- /g, "").replace(/\*\*|`/g, "");
        expect(rendered).toContain(content);
      }
      expect(html).toContain('href="/privacy"');
      expect(html).toContain('href="/data-deletion"');
      expect(html).toContain('href="mailto:emma080355@gmail.com"');
      expect(html.match(/<h1[ >]/g)).toHaveLength(1);
      expect(html).not.toContain("<script");
    });
  }
});
