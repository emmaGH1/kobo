// Generated from docs/design/logo/logo.svg (build-logo.py). Parts stay separate so the
// coin can be animated last in the demo. Letters use currentColor; the coin uses the accent.
const K = "M74 0V800H236V370H284L452 600H624V594L419 320L648 6V0H459L284 250H236V0Z";
const B = "M416 -12Q349 -12 309.0 14.0Q269 40 248 78H224V0H74V800H236V534H260Q282 570 320.0 591.0Q358 612 416 612Q496 612 549.5 573.0Q603 534 629.5 464.0Q656 394 656 301Q656 211 630.0 140.0Q604 69 551.0 28.5Q498 -12 416 -12ZM370 102Q425 102 456.5 151.5Q488 201 488 300Q488 399 456.5 448.5Q425 498 370 498Q309 498 272.5 445.0Q236 392 236 300Q236 209 272.5 155.5Q309 102 370 102Z";
const O = "M330 -15Q181 -15 107.5 70.5Q34 156 34 300Q34 444 107.5 529.5Q181 615 330 615Q479 615 552.5 529.5Q626 444 626 300Q626 156 552.5 70.5Q479 -15 330 -15ZM330 93Q396.4 93 427.2 145.0Q458 197 458 300.5Q458 404 427.2 455.5Q396.4 507 330 507Q263.6 507 232.8 455.5Q202 404 202 300.5Q202 197 232.8 145.0Q263.6 93 330 93Z";

type Props = {
  className?: string;
  /** "word" = kobo, "mark" = k + coin (square). */
  variant?: "word" | "mark";
  title?: string;
};

export function KoboLogo({ className, variant = "word", title = "Kobo" }: Props) {
  const mark = variant === "mark";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={mark ? "2 -1047 1293 1293" : "-72 -872 2652 959"}
      className={className}
      role="img"
      aria-label={title}
    >{" "}
      <g transform="scale(1 -1)">{" "}
        <path id="k0" d={K} fill="currentColor" />
        <circle id="coin" cx="936.0" cy="300.0" r="287.1" fill="var(--biro)" />
        {!mark && (
          <>
            <path id="b2" transform="translate(1212.0 0)" d={B} fill="currentColor" />
            <path id="o3" transform="translate(1848.0 0)" d={O} fill="currentColor" />
          </>
        )}
      </g>
    </svg>
  );
}
