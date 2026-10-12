"use client";

import { Button, buttonStyles } from "@/components/ui";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

/** Shown when a page fails while rendering; the rest of the site keeps working. */
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
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <AlertTriangle className="size-10 text-amber-500" aria-hidden />
      <h1 className="font-serif text-2xl font-bold text-amber-500">Có lỗi xảy ra</h1>
      <p className="text-stone-300">
        Trang này không tải được. Bạn có thể thử lại hoặc quay về trang chủ.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw className="size-4" aria-hidden /> Thử lại
        </Button>
        <Link href="/" className={buttonStyles({ variant: "secondary" })}>
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
