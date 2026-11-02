import type { ReactNode } from "react";

/** Wraps marked words in a bold segment with the lavender mark; `data-fly` lets the film lift them out. */
function marked(text: string, marks: string[] | undefined): ReactNode {
  if (!marks?.length) return text;
  const hit = marks.find((m) => text.includes(m));
  if (!hit) return text;
  const i = text.indexOf(hit);
  return (
    <>
      {text.slice(0, i)}
      <span className="kmark" data-fly={hit}>
        {hit}
      </span>
      {text.slice(i + hit.length)}
    </>
  );
}

/** Renders the WhatsApp subset Kobo sends: *bold*, _italic_, > quote, - bullets, 1. lists, ``` blocks. */
function inline(text: string, marks?: string[]): ReactNode[] {
  return text.split(/(\*[^*\n]+\*|_[^_\n]+_)/g).map((part, i) => {
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*"))
      return (
        <strong key={i} className="font-semibold tnum">
          {marked(part.slice(1, -1), marks)}
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

/** Props only, no engine: safe to render in Remotion. `marks` highlights bold words Kobo picked out. */
export function WaText({ body, className = "", marks }: { body: string; className?: string; marks?: string[] }) {
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
              <span>{inline(t, marks)}</span>
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
            <li key={k}>{inline(t, marks)}</li>
          ))}
        </ol>,
      );
    } else if (line.trim() === "") {
      out.push(<div key={out.length} className="h-2" aria-hidden />);
      i++;
    } else {
      out.push(<p key={out.length}>{inline(line, marks)}</p>);
      i++;
    }
  }
  return <div className={className}>{out}</div>;
}
