import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

// Google Fonts einbinden
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "LUZID Preview",
  description: "Dein persönliches astrologisches Briefing im Creator-Stil.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable}`}>
      {/* Standard: Weißer Hintergrund, schwarze Typografie */}
      <body className="bg-white text-black">{children}</body>
    </html>
  );
}

