import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { StoreHydrator } from "@/components/store-hydrator";

import "./globals.css";

export const metadata: Metadata = {
  title: "Hào khí Việt Nam – Trò chơi lịch sử",
  description: "Sống lại những trang sử vàng qua từng khoảnh khắc: trò chơi lịch sử Việt Nam.",
};

export const viewport: Viewport = {
  themeColor: "#1c1917",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-stone-900 font-sans text-stone-200 antialiased">
        <StoreHydrator />
        {children}
      </body>
    </html>
  );
}
