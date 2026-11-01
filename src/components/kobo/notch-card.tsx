import type { CSSProperties, ReactNode } from "react";

/**
 * The theme's signature shape: a rounded card with its top-right corner notched out, and a
 * small tile sitting in the notch. Pure CSS: the notch and its two inverse corners are painted
 * in the surrounding page colour (`cut`), so the card must sit on a solid background.
 */
export function NotchCard({
  children,
  className = "",
  style,
  notch = 76,
  radius = 28,
  inner = 20,
  gap = 8,
  cut = "var(--paper)",
  tile,
  tileClassName = "bg-ink text-paper",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  notch?: number;
  radius?: number;
  inner?: number;
  gap?: number;
  cut?: string;
  tile?: ReactNode;
  tileClassName?: string;
}) {
  const corner = `radial-gradient(circle at 0 100%, transparent ${inner - 0.5}px, ${cut} ${inner}px)`;
  return (
    <div className={`relative ${className}`} style={{ borderRadius: radius, ...style }}>
      {children}
      <span aria-hidden className="pointer-events-none absolute right-0 top-0" style={{ width: notch, height: notch, background: cut, borderBottomLeftRadius: inner }} />
      <span aria-hidden className="pointer-events-none absolute top-0" style={{ right: notch, width: inner, height: inner, background: corner }} />
      <span aria-hidden className="pointer-events-none absolute right-0" style={{ top: notch, width: inner, height: inner, background: corner }} />
      {tile && (
        <span
          className={`absolute right-0 top-0 flex items-center justify-center ${tileClassName}`}
          style={{ width: notch - gap, height: notch - gap, borderRadius: inner }}
        >
          {tile}
        </span>
      )}
    </div>
  );
}
