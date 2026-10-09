import type { Metadata } from "next";
import type { ReactNode } from "react";

import { StoreHydrator } from "@/components/store-hydrator";

import "./globals.css";

export const metadata: Metadata = {
  title: "Lịch sử Việt Nam – Trò chơi",
  description: "Học lịch sử Việt Nam qua các chương trò chơi tương tác.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-amber-50 font-sans text-stone-900 antialiased">
        <StoreHydrator />
        {children}
      </body>
    </html>
  );
}
