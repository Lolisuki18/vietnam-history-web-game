import type { Metadata } from "next";

import { ChapterShell } from "@/components/kim-dong/chapter-shell";

export const metadata: Metadata = {
  title: "Kim Đồng – Người liên lạc nhỏ",
};

export default function KimDongPage() {
  return <ChapterShell />;
}
