"use client";

import { buttonStyles, CodexCard } from "@vhg/ui";
import Link from "next/link";

import { KimDongArt } from "@/components/kim-dong/codex-illustration";
import { CHAPTERS } from "@/data/chapters";
import { CODEX } from "@/data/kimdong-story";
import { selectIsCodexUnlocked, useProgressStore } from "@/stores/progress-store";
import { useProgressHydrated } from "@/stores/use-progress-hydrated";

/** One historical card per chapter; a card turns from a padlock into a biography once unlocked. */
export function CodexShelf() {
  const hydrated = useProgressHydrated();
  const isCodexUnlocked = useProgressStore(selectIsCodexUnlocked("kim-dong"));

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {CHAPTERS.map((chapter) => {
        if (chapter.id !== "kim-dong") {
          return (
            <CodexCard
              key={chapter.chapterLabel}
              unlocked={false}
              name={chapter.character}
              summary=""
              lockedHint="Hồ sơ này sẽ mở khi chương mới ra mắt."
            />
          );
        }
        const unlocked = hydrated && isCodexUnlocked;
        return (
          <CodexCard
            key={chapter.id}
            unlocked={unlocked}
            name="Anh hùng Kim Đồng"
            years={CODEX.years}
            role="Người liên lạc nhỏ"
            summary={CODEX.cardSummary}
            art={<KimDongArt />}
            lockedHint="Hoàn thành Chương 1 – Kim Đồng để mở khóa hồ sơ này."
            footer={
              unlocked && chapter.codexHref ? (
                <Link
                  href={chapter.codexHref}
                  className={buttonStyles({ variant: "secondary", className: "w-full" })}
                >
                  Xem hồ sơ
                </Link>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}
