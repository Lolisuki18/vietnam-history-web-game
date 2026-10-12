import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/navbar";
import { StoreHydrator } from "@/components/store-hydrator";

import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["vietnamese", "latin"],
  variable: "--font-playfair",
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["vietnamese", "latin"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hào khí Việt Nam – Trò chơi lịch sử",
  description: "Sống lại những trang sử vàng qua từng khoảnh khắc: trò chơi lịch sử Việt Nam.",
};

export const viewport: Viewport = {
  themeColor: "#1c1917",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${playfair.variable} ${beVietnam.variable}`}>
      <body className="min-h-screen bg-stone-950 font-sans text-stone-200 antialiased selection:bg-amber-600 selection:text-white">
        <StoreHydrator />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
