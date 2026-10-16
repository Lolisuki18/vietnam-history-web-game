import type { Metadata } from "next";

import { ChapterShell } from "@/features/vothisau/ui/chapter-shell";

export const metadata: Metadata = {
  title: "Võ Thị Sáu – Mùa hoa lê-ki-ma",
};

export default function VoThiSauPage() {
  return <ChapterShell />;
}
