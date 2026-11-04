import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import type { ReactNode } from "react";

type PolicyDocument = "PRIVACY_POLICY" | "DATA_DELETION";

// Only the approved, repository-owned documents are read at static build time.
// This deliberately supports their small Markdown subset, not arbitrary HTML.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|emma080355@gmail\.com|https:\/\/trykobo\.xyz)/g).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i}>{inline(part.slice(2, -2))}</strong>;
    if (part.startsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part === "emma080355@gmail.com") return <a key={i} className="underline underline-offset-4" href={`mailto:${part}`}>{part}</a>;
    if (part === "https://trykobo.xyz") return <Link key={i} className="underline underline-offset-4" href="/">{part}</Link>;
    return part;
  });
}

export function PolicyPage({ document }: { document: PolicyDocument }) {
  const source = readFileSync(join(process.cwd(), "docs", `${document}.md`), "utf8");
  const blocks = source.trim().split(/\n\s*\n/);
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8 sm:py-12">
      <header className="border-b border-ink/15 pb-6">
        <Link className="text-3xl" href="/" aria-label="Kobo home">Kobo</Link>
        <nav aria-label="Policy pages" className="mt-5 flex flex-wrap gap-x-6 gap-y-3 font-sans text-sm">
          <Link className="underline underline-offset-4" href="/privacy" aria-current={document === "PRIVACY_POLICY" ? "page" : undefined}>Privacy policy</Link>
          <Link className="underline underline-offset-4" href="/data-deletion" aria-current={document === "DATA_DELETION" ? "page" : undefined}>Data deletion instructions</Link>
        </nav>
      </header>
      <main id="main-content" className="py-10">
        <article className="space-y-5 break-words font-sans text-base leading-7 text-ink">
          {blocks.map((block, i) => {
            if (block.startsWith("# ")) return <h1 key={i} className="font-serif text-4xl leading-tight sm:text-5xl">{block.slice(2)}</h1>;
            if (block.startsWith("## ")) return <h2 key={i} className="pt-5 font-serif text-2xl leading-snug sm:text-3xl">{block.slice(3)}</h2>;
            if (block.startsWith("- ")) return <ul key={i} className="list-disc space-y-3 pl-6">{block.split("\n").map((line, j) => <li key={j}>{inline(line.slice(2))}</li>)}</ul>;
            return <p key={i}>{inline(block.replace(/\n/g, " "))}</p>;
          })}
        </article>
      </main>
      <footer className="border-t border-ink/15 pt-6 font-sans text-sm leading-6">
        Privacy contact: <a className="underline underline-offset-4" href="mailto:emma080355@gmail.com">emma080355@gmail.com</a>
      </footer>
    </div>
  );
}
