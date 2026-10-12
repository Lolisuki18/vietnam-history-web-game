import type { ChapterId } from "@/lib/engine";

export interface ChapterInfo {
  /** Present for chapters that exist; "coming soon" slots have no id yet. */
  id?: ChapterId;
  chapterLabel: string;
  character: string;
  title: string;
  period: string;
  description: string;
  href?: string;
  codexHref?: string;
}

/**
 * The chapter list on the home page, in display order. To add a game: add its id to
 * `CHAPTER_IDS` (lib/engine/chapter.ts), describe it here and in `features/registry.tsx`.
 * `href` is `/<slug>` and `codexHref` is `/<slug>/codex` (checked by chapters.test.ts).
 */
export const CHAPTERS: readonly ChapterInfo[] = [
  {
    id: "kim-dong",
    chapterLabel: "Chương 1",
    character: "Anh hùng Kim Đồng",
    title: "Người liên lạc nhỏ",
    period: "Cao Bằng · 1941 – 1943",
    description:
      "Nhập vai Dền, băng qua núi rừng Cao Bằng, nhặt mật thư, tránh tầm mắt của lính tuần và bảo vệ cán bộ.",
    href: "/kimdong",
    codexHref: "/kimdong/codex",
  },
  {
    chapterLabel: "Chương 2",
    character: "Đang cập nhật",
    title: "Một trang sử mới",
    period: "Sắp ra mắt",
    description: "Một câu chuyện lịch sử mới đang được chuẩn bị. Hãy quay lại sau nhé.",
  },
  {
    chapterLabel: "Chương 3",
    character: "Đang cập nhật",
    title: "Một trang sử mới",
    period: "Sắp ra mắt",
    description: "Một câu chuyện lịch sử mới đang được chuẩn bị. Hãy quay lại sau nhé.",
  },
];
