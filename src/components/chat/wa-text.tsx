import type { ReactNode } from "react";

/** Renders the WhatsApp subset Kobo sends: *bold*, _italic_, > quote, - bullets, 1. lists, ``` blocks. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*[^*\n]+\*|_[^_\n]+_)/g).map((part, i) => {
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*"))
      return (
        <strong key={i} className="font-semibold tnum">
          {part.slice(1, -1)}
        </strong>
      );
    if (part.length > 2 && part.startsWith("_") && part.endsWith("_"))
      return (
        <em key={i} className="text-ink-2">
          {part.slice(1, -1)}
        </em>
      );
    return part;
  });
}

export function WaText({ body }: { body: string }) {
  const lines = body.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const block: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) block.push(lines[i++]);
      i++;
      out.push(
        <pre key={out.length} className="my-1 overflow-x-auto font-mono text-[13px] leading-6 text-ink">
          {block.join("\n")}
        </pre>,
      );
    } else if (line.startsWith("> ")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) q.push(lines[i++].slice(2));
      out.push(
        <blockquote key={out.length} className="border-l-2 border-rule pl-3 italic text-ink-2">
          {q.join(" ")}
        </blockquote>,
      );
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) items.push(lines[i++].slice(2));
      out.push(
        <ul key={out.length}>
          {items.map((t, k) => (
            <li key={k} className="flex gap-2">
              <span aria-hidden className="text-ink-3">–</span>
              <span>{inline(t)}</span>
            </li>
          ))}
        </ul>,
      );
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) items.push(lines[i++]);
      out.push(
        <ol key={out.length}>
          {items.map((t, k) => (
            <li key={k}>{inline(t)}</li>
          ))}
        </ol>,
      );
    } else if (line.trim() === "") {
      out.push(<div key={out.length} className="h-3.5" aria-hidden />);
      i++;
    } else {
      out.push(<p key={out.length}>{inline(line)}</p>);
      i++;
    }
  }
  return <div className="text-[16px] leading-7">{out}</div>;
}
