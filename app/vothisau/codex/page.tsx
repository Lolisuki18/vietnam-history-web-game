import type { Metadata } from "next";

import { CodexPageView } from "@/features/vothisau/ui/codex-page-view";

export const metadata: Metadata = {
  title: "Hồ sơ lịch sử – Nữ anh hùng Võ Thị Sáu",
};

export default function VoThiSauCodexPage() {
  return <CodexPageView />;
}
