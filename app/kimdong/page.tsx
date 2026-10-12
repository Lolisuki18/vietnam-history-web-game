import type { Metadata } from "next";

import { ChapterShell } from "@/features/kimdong/ui/chapter-shell";

export const metadata: Metadata = {
  title: "Kim Đồng – Người liên lạc nhỏ",
};

export default function KimDongPage() {
  return <ChapterShell />;
}
