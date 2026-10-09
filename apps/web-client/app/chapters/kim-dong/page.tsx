import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ChapterFrame } from "@/components/chapter-frame";

export const metadata: Metadata = {
  title: "Kim Đồng – Người liên lạc nhỏ",
};

export default function KimDongPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="size-4" aria-hidden /> Về trang chủ
      </Link>
      <h1 className="text-3xl font-black tracking-tight">Kim Đồng – Người liên lạc nhỏ</h1>
      <ChapterFrame />
    </main>
  );
}
