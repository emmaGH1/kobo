import { AbsoluteFill } from "remotion";
import "./compiled.css";
import { Phone, KoboBubble, TraderBubble, BookPanel } from "../../../src/components/demo";
import { review, marks, rows, stats } from "./sample";

type Look = "graphite" | "paper" | "dusk";

const BG: Record<Look, string> = {
  graphite: "radial-gradient(60% 70% at 38% 45%, rgba(146,169,225,0.32), rgba(146,169,225,0) 70%), #1E1D1B",
  paper:
    "repeating-linear-gradient(0deg, rgba(42,58,158,0.10) 0 1px, transparent 1px 34px), linear-gradient(90deg, transparent 0 150px, rgba(176,38,28,0.25) 150px 151px, transparent 151px), #F7F4EC",
  dusk: "radial-gradient(55% 65% at 40% 45%, rgba(214,140,70,0.35), rgba(214,140,70,0) 70%), radial-gradient(40% 40% at 80% 70%, rgba(146,169,225,0.22), transparent 70%), #24170F",
};
const INK: Record<Look, string> = { graphite: "#F4F0E6", paper: "#2D2C2A", dusk: "#F6EBDD" };

function Caption({ look }: { look: Look }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 40, color: INK[look], letterSpacing: "-0.01em" }}>
      Nothing goes in the book until she taps{" "}
      <span style={{ background: "#92A9E1", color: "#2D2C2A", padding: "0 10px", borderRadius: 6 }}>save</span>.
    </div>
  );
}

export function LookStill({ look }: { look: Look }) {
  const tilt = look === "paper" ? "none" : "perspective(1800px) rotateY(16deg) rotateX(6deg)";
  return (
    <AbsoluteFill style={{ background: BG[look], fontFamily: "var(--font-serif)" }}>
      {look === "dusk" && (
        <AbsoluteFill style={{ opacity: 0.12, backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>\")" }} />
      )}
      <div style={{ position: "absolute", left: 300, top: 90, transform: `${tilt} scale(1.32)`, transformOrigin: "left top" }}>
        <Phone label="Kobo chat" composer={<div style={{ height: 52 }} />}>
          <TraderBubble m={{ id: "v", from: "you", voice: true, text: "Bayo carry one groundnut oil, three eight. E go pay Friday.", time: "12:10 PM" }} transcriptNote="Heard" />
          <KoboBubble view={review} marks={marks} time="12:10 PM" pressed="1" />
        </Phone>
      </div>
      <div
        style={{
          position: "absolute",
          left: 880,
          top: 250,
          width: 760,
          transform: look === "paper" ? "none" : "perspective(1800px) rotateY(-8deg) translateZ(60px)",
          boxShadow: look === "paper" ? "0 2px 0 rgba(45,44,42,0.08)" : "0 60px 120px -30px rgba(0,0,0,0.6)",
          borderRadius: 24,
        }}
      >
        <BookPanel date="Mon 2 Nov" stats={stats} rows={rows} />
      </div>
      <Caption look={look} />
    </AbsoluteFill>
  );
}
