import { Roboto_Slab } from "next/font/google";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/navbar";
import { StoreHydrator } from "@/components/store-hydrator";

import "./globals.css";

/** One slab-serif ("chữ bệt") family for the whole site; variable weights, with Vietnamese. */
const slab = Roboto_Slab({
  subsets: ["vietnamese", "latin"],
  variable: "--font-slab",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hào khí Việt Nam – Trò chơi lịch sử",
  description: "Sống lại những trang sử vàng qua từng khoảnh khắc: trò chơi lịch sử Việt Nam.",
};

export const viewport: Viewport = {
  themeColor: "#2a2013",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={slab.variable}>
      <body className="min-h-screen bg-paper font-sans text-stone-200 antialiased selection:bg-amber-600 selection:text-white">
        <StoreHydrator />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
