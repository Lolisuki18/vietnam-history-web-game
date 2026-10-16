import type { ReactNode } from "react";

import type { ChapterId } from "@/lib/engine";

import { CODEX } from "./kimdong/data/story";
import { KIMDONG_ID } from "./kimdong/types";
import { KimDongArt, KimDongCodexArt } from "./kimdong/ui/codex-illustration";
import { CODEX as VOTHISAU_CODEX } from "./vothisau/data/story";
import { VOTHISAU_ID } from "./vothisau/types";
import { VoThiSauArt, VoThiSauCodexArt } from "./vothisau/ui/codex-illustration";

/** What the home page needs to draw a chapter that lives in `features/<game>`. */
export interface ChapterView {
  /** Artwork of the chapter card. */
  cover: ReactNode;
  /** The trading card of the Codex shelf. */
  codex: {
    name: string;
    years: string;
    role: string;
    summary: string;
    art: ReactNode;
    /** What the locked card says. */
    lockedHint: string;
  };
}

/**
 * One entry per chapter id. It is a `Record<ChapterId, ...>`, so adding an id to `CHAPTER_IDS`
 * without describing it here is a compile error. This is the only place (besides `app/`) that
 * knows about every game.
 */
export const CHAPTER_VIEWS: Record<ChapterId, ChapterView> = {
  [KIMDONG_ID]: {
    cover: <KimDongArt />,
    codex: {
      name: "Anh hùng Kim Đồng",
      years: CODEX.years,
      role: "Người liên lạc nhỏ",
      summary: CODEX.cardSummary,
      art: <KimDongCodexArt crop />,
      lockedHint: "Hoàn thành Chương 1 – Kim Đồng để mở khóa hồ sơ này.",
    },
  },
  [VOTHISAU_ID]: {
    cover: <VoThiSauArt />,
    codex: {
      name: "Nữ anh hùng Võ Thị Sáu",
      years: VOTHISAU_CODEX.years,
      role: "Nữ chiến sĩ Đất Đỏ",
      summary: VOTHISAU_CODEX.cardSummary,
      art: <VoThiSauCodexArt crop />,
      lockedHint: "Hoàn thành Chương 3 – Võ Thị Sáu để mở khóa hồ sơ này.",
    },
  },
};
