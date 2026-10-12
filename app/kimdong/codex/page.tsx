import type { Metadata } from "next";

import { CodexPageView } from "@/features/kimdong/ui/codex-page-view";

export const metadata: Metadata = {
  title: "Hồ sơ lịch sử – Anh hùng Kim Đồng",
};

export default function KimDongCodexPage() {
  return <CodexPageView />;
}
