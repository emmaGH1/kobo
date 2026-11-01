import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/** Geist Serif (Vercel, OFL) is the site's default face. It has no ₦ glyph, so a one-glyph
 *  subset of Source Serif 4 follows it in the stack; Geist Sans gets the same from Public Sans. */
const geistSerif = localFont({ src: "./fonts/GeistSerifVF.woff2", variable: "--font-geist-serif", display: "swap" });
const nairaSerif = localFont({ src: "./fonts/naira-serif.woff2", variable: "--font-naira-serif", display: "swap", preload: false });
const geistSans = localFont({ src: "./fonts/Geist-Variable.woff2", variable: "--font-geist-sans", weight: "100 900", display: "swap" });
const nairaSans = localFont({ src: "./fonts/naira-sans.woff2", variable: "--font-naira-sans", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Kobo — your market notebook, now inside WhatsApp",
  description:
    "Send a voice note in Pidgin or English. Kobo writes it in your book, asks when a figure is unclear, and saves only when you say so.",
};

export const viewport: Viewport = { themeColor: "#FFFFFF" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSerif.variable} ${nairaSerif.variable} ${geistSans.variable} ${nairaSans.variable}`}
    >
      <body className="min-h-svh bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
