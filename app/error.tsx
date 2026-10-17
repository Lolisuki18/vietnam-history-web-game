"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonStyles } from "@/components/ui";
import { StatusPage } from "@/components/layout/status-page";

/** Shown when a page fails while rendering; the navigation bar and the rest of the site keep working. */
export default function ErrorPage({
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
    <StatusPage
      kicker="Sự cố"
      mark={<AlertTriangle className="mx-auto size-24 sm:size-28" strokeWidth={1.6} />}
      stamp="Đường dây bị cắt"
      title="Có lỗi xảy ra"
      description="Trang này gặp sự cố khi tải. Bạn thử lại, nếu vẫn lỗi thì quay về trang chủ và vào lại sau."
      note={error.digest ? `Mã lỗi: ${error.digest}` : undefined}
    >
      <Button size="lg" onClick={reset}>
        <RotateCcw className="size-4" aria-hidden /> Thử lại
      </Button>
      <Link href="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
        Về trang chủ
      </Link>
    </StatusPage>
  );
}
