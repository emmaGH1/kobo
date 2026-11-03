import { C, CardFrame, Hero, Label, formatNaira } from "./card-kit";
import {
  draftFooter,
  draftIntro,
  draftMessage,
  reminderBody,
  reminderButtons,
  reminderFooter,
  validateReminder,
  type ReminderData,
} from "./reminder-copy";

export type ReminderCardData = ReminderData & { date: string; sample?: boolean };

type Piece = { t: string; bold: boolean };

/** Splits WhatsApp text into words; *bold* runs stay whole and punctuation sticks to its word. */
export function richWords(text: string): Piece[][] {
  const words: Piece[][] = [];
  let word: Piece[] = [];
  const flush = () => {
    if (word.length) words.push(word);
    word = [];
  };
  for (const part of text.split(/(\*[^*]+\*)/g).filter(Boolean)) {
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
      word.push({ t: part.slice(1, -1), bold: true });
      continue;
    }
    for (const bit of part.split(/(\s+)/).filter(Boolean)) {
      if (/^\s+$/.test(bit)) flush();
      else word.push({ t: bit, bold: false });
    }
  }
  flush();
  return words;
}

/** Renders WhatsApp *bold* as emphasis: money in the owed colour with a lavender underline. */
function Rich({ text, size }: { text: string; size: number }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: Math.round(size * 0.28), rowGap: 6, fontSize: size, lineHeight: 1.3 }}>
      {richWords(text).map((w, i) => (
        <span key={i} style={{ display: "flex" }}>
          {w.map((p, k) => (
            <span key={k} style={p.bold ? { display: "flex", color: p.t.startsWith("₦") ? C.owed : C.ink, borderBottom: `3px solid ${C.lav}` } : { display: "flex" }}>
              {p.t}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

/** WhatsApp-style quick-reply pills, in the order DESIGN.md 4.10 gives them. */
function Replies({ labels }: { labels: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 36 }}>
      {labels.map((l) => (
        <span key={l} style={{ display: "flex", justifyContent: "center", border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 0", fontSize: 26, color: "#027EB5" }}>
          {l}
        </span>
      ))}
    </div>
  );
}

/** DESIGN.md 4.10 as a card: Kobo reminds the TRADER on the due date. */
export function ReminderCard({ data, fontFamily = "DejaVu" }: { data: ReminderCardData; fontFamily?: string }) {
  validateReminder(data);
  const b = reminderButtons(data.lang);
  const [line1, line2] = reminderBody(data);
  return (
    <CardFrame demo="reminder-card" date={data.date} sample={data.sample} kicker={data.shop} fontFamily={fontFamily} footer={reminderFooter(data.lang)}>
      <Label mt={40}>{`Reminder · ${data.dueLabel}`}</Label>
      <Hero label={`${data.customer} · due today`} value={formatNaira(data.dueKobo)} tone="owed" mt={8} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40 }}>
        <Rich text={line1} size={32} />
        <Rich text={line2} size={30} />
      </div>
      <Replies labels={[b.draft, b.paid, b.later]} />
    </CardFrame>
  );
}

/** DESIGN.md 4.11 as a card: the message the trader copies and forwards. Kobo never sends it. */
export function DraftMessageCard({ data, fontFamily = "DejaVu" }: { data: ReminderCardData; fontFamily?: string }) {
  validateReminder(data);
  return (
    <CardFrame demo="draft-message-card" date={data.date} sample={data.sample} kicker={data.shop} fontFamily={fontFamily} footer={draftFooter(data.lang)}>
      <Label mt={40}>Drafted for you to forward</Label>
      <span style={{ display: "flex", fontSize: 40, marginTop: 8 }}>{draftIntro(data)}</span>
      <div style={{ display: "flex", marginTop: 32, padding: "32px 36px", background: "#F7F6F2", borderLeft: `6px solid ${C.lav}` }}>
        <span style={{ display: "flex", fontSize: 34, lineHeight: 1.45 }}>{draftMessage(data)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, fontSize: 22, color: C.ink2 }}>
        <span style={{ display: "flex" }}>{`To ${data.customer} · from your own WhatsApp`}</span>
        <span style={{ display: "flex" }}>{`Balance due ${formatNaira(data.dueKobo)}`}</span>
      </div>
    </CardFrame>
  );
}
