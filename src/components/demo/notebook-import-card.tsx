import { CONFIRMATION_PROMPT } from "../../core/contract";
import { C, CardFrame, Label, Tag, assertCount, formatNaira } from "./card-kit";

/**
 * Kobo's review of a notebook photo: the lines it read, each with name and amount, and a flag on
 * anything unclear. Unclear amounts are never shown as decided numbers (DESIGN.md §3 rule 8).
 * Nothing is saved until the trader confirms.
 */
export type NotebookLine = {
  name: string;
  /** null when the amount couldn't be read with certainty. */
  amountKobo: number | null;
  /** Exactly what Kobo read on the page, e.g. "19,8??" or "3 5". */
  read: string;
  /** Why this line needs checking. Present ⇒ flagged. */
  unclear?: string;
};
export type NotebookImportCardData = {
  shop: string;
  date: string;
  /** Absolute URL or data URI of the photo (Satori needs one of those). null shows a placeholder. */
  photo: { src: string; alt: string } | null;
  lines: NotebookLine[];
  sample?: boolean;
};

export const MAX_IMPORT_LINES = 8;

export function validateImport(d: NotebookImportCardData) {
  if (d.lines.length === 0 || d.lines.length > MAX_IMPORT_LINES) throw new Error(`1 to ${MAX_IMPORT_LINES} lines per card`);
  for (const l of d.lines) if (l.amountKobo !== null) assertCount(l.amountKobo, "line amount");
}

const flagged = (l: NotebookLine) => Boolean(l.unclear) || l.amountKobo === null;

function Thumb({ photo }: { photo: NotebookImportCardData["photo"] }) {
  const box = { width: 230, height: 290, border: `1px solid ${C.border}`, background: "#F7F6F2" } as const;
  // Plain <img> on purpose: Satori (next/og) and Remotion render this card, and neither supports next/image.
  // eslint-disable-next-line @next/next/no-img-element
  if (photo) return <img src={photo.src} alt={photo.alt} width={230} height={290} style={{ ...box, objectFit: "cover" }} />;
  return (
    <div style={{ ...box, display: "flex", flexDirection: "column", position: "relative", paddingTop: 22 }}>
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ display: "flex", height: 1, background: "rgba(45,44,42,0.10)", marginTop: 28 }} />
      ))}
      <div style={{ display: "flex", position: "absolute", top: 0, bottom: 0, left: 42, width: 1, background: "rgba(166,61,42,0.35)" }} />
      <span style={{ display: "flex", position: "absolute", left: 56, bottom: 16, fontSize: 18, color: C.ink3 }}>PHOTO</span>
    </div>
  );
}

export function NotebookImportCard({ data, fontFamily = "DejaVu" }: { data: NotebookImportCardData; fontFamily?: string }) {
  validateImport(data);
  const toCheck = data.lines.filter(flagged).length;
  const clear = data.lines.length - toCheck;
  return (
    <CardFrame
      demo="notebook-import-card"
      date={data.date}
      sample={data.sample}
      kicker={data.shop}
      fontFamily={fontFamily}
      footer={`Nothing is saved until you confirm · ${CONFIRMATION_PROMPT}`}
    >
      <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
        <Thumb photo={data.photo} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ display: "flex", fontSize: 24, letterSpacing: 2 }}>FROM YOUR NOTEBOOK</span>
          <span style={{ display: "flex", fontSize: 72, marginTop: 8, letterSpacing: -2 }}>{`${data.lines.length} lines read`}</span>
          <div style={{ display: "flex", height: 6, width: 245, background: C.lav, marginTop: 10 }} />
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <Tag>{`${clear} clear`}</Tag>
            {toCheck > 0 && <Tag tone="owed">{`${toCheck} to check`}</Tag>}
          </div>
        </div>
      </div>
      <Label mt={44}>Check before saving</Label>
      {data.lines.map((l, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `1px solid ${C.rule}`, padding: "12px 0", fontSize: 28 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ display: "flex" }}>{l.name}</span>
              {flagged(l) && <Tag tone="owed">Check</Tag>}
            </div>
            {flagged(l) && <span style={{ display: "flex", fontSize: 19, color: C.owed, marginTop: 4 }}>{`Read “${l.read}”${l.unclear ? ` · ${l.unclear}` : ""}`}</span>}
          </div>
          <span style={{ display: "flex", color: l.amountKobo === null ? C.owed : C.ink }}>{l.amountKobo === null ? "?" : formatNaira(l.amountKobo)}</span>
        </div>
      ))}
    </CardFrame>
  );
}
