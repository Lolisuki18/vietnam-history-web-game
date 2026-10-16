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
  difficulty?: string;
  estimatedTime?: string;
  tag?: string;
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
      "Nhập vai Dền, băng qua núi rừng Cao Bằng, nhặt mật thư, tránh tầm mắt của lính tuần và bảo vệ cán bộ cách mạng.",
    href: "/kimdong",
    codexHref: "/kimdong/codex",
    difficulty: "Vừa phải (3/5)",
    estimatedTime: "~5 phút",
    tag: "Kháng chiến chống Pháp",
  },
  {
    chapterLabel: "Chương 2",
    character: "Trần Quốc Toản",
    title: "Bóp nát quả cam",
    period: "Bình Than · 1282",
    description:
      "Tuổi trẻ chí lớn giương cao lá cờ 'Phá cường địch, báo hoàng ân', xuất trận cùng quân dân Đại Việt chặn đứng vó ngựa Nguyên Mông.",
    difficulty: "Thách thức (4/5)",
    estimatedTime: "Sắp ra mắt",
    tag: "Chống quân Nguyên Mông",
  },
  {
    chapterLabel: "Chương 3",
    character: "Võ Thị Sáu",
    title: "Mùa hoa lê-ki-ma",
    period: "Đất Đỏ · 1948 – 1952",
    description:
      "Lẩn qua rừng cao su, hòa vào chợ Đất Đỏ, rồi đối mặt phòng thẩm vấn: người con gái Đất Đỏ kiên trung, bất khuất trước kẻ thù.",
    href: "/vothisau",
    codexHref: "/vothisau/codex",
    difficulty: "Kịch tính (4/5)",
    estimatedTime: "~10 phút",
    tag: "Kháng chiến chống Pháp",
  },
];

/** Route of the first chapter that can be played (the "Chơi ngay" / hero buttons go there). */
export const FIRST_PLAYABLE_HREF = CHAPTERS.find((chapter) => chapter.href)?.href ?? "/";
