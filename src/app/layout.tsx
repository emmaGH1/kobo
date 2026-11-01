import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const familjen = localFont({
  src: "./fonts/FamiljenGrotesk.ttf",
  variable: "--font-familjen",
  weight: "400 700",
  display: "swap",
});

const plexMono = localFont({
  src: "./fonts/IBMPlexMono-Regular.ttf",
  variable: "--font-plex-mono",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kobo — your market notebook, now inside WhatsApp",
  description:
    "Talk or type your sales in Pidgin or English. Kobo writes them down, asks when a figure is unclear, and saves only when you say so.",
};

export const viewport: Viewport = { themeColor: "#F4F0E6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${familjen.variable} ${plexMono.variable}`}>
      <body className="min-h-svh bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
