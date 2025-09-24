import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

// Google Fonts (als CSS-Variablen)
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "LUZID Preview",
  description: "Dein persönliches astrologisches Briefing im Creator-Stil.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Erzwingt helles Farbschema (kein Auto-Dark) */}
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      {/* Global: weißer Hintergrund + schwarze Typo */}
      <body className="min-h-screen bg-white text-black">
        {children}
      </body>
    </html>
  );
}

