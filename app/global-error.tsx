"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { StatusPage } from "@/components/layout/status-page";
import { Button, buttonStyles } from "@/components/ui";

import "./globals.css";

/**
 * The last safety net: used when the root layout itself fails, so it replaces the layout and brings
 * its own `<html>` and `<body>` (and the global styles). There is no navigation bar here, and the
 * home link is a plain anchor because the router may be what broke.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-paper font-sans text-stone-200 antialiased selection:bg-amber-600 selection:text-white">
        <title>Có lỗi xảy ra – Hào khí Việt Nam</title>
        <StatusPage
          kicker="Sự cố nghiêm trọng"
          mark={<AlertTriangle className="mx-auto size-24 sm:size-28" strokeWidth={1.6} />}
          stamp="Mất liên lạc"
          title="Trò chơi không khởi động được"
          description="Có sự cố ở phần nền của trang web. Bạn thử tải lại; nếu vẫn lỗi, hãy quay lại sau ít phút."
          note={error.digest ? `Mã lỗi: ${error.digest}` : undefined}
        >
          <Button size="lg" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden /> Thử lại
          </Button>
          {/* A plain anchor on purpose: a full page load resets whatever broke. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
            Về trang chủ
          </a>
        </StatusPage>
      </body>
    </html>
  );
}
