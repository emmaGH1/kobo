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
        <em key={i} className="opacity-70">
          {part.slice(1, -1)}
        </em>
      );
    return part;
  });
}

export function WaText({ body, className = "" }: { body: string; className?: string }) {
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
        <pre key={out.length} className="my-1 overflow-x-auto font-mono text-[11.5px] leading-[1.5]">
          {block.join("\n")}
        </pre>,
      );
    } else if (line.startsWith("> ")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) q.push(lines[i++].slice(2));
      out.push(
        <blockquote key={out.length} className="border-l-[3px] border-black/15 pl-2 italic opacity-80">
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
              <span aria-hidden className="opacity-50">•</span>
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
      out.push(<div key={out.length} className="h-2" aria-hidden />);
      i++;
    } else {
      out.push(<p key={out.length}>{inline(line)}</p>);
      i++;
    }
  }
  return <div className={className}>{out}</div>;
}
