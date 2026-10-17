import type { Metadata } from "next";
import Link from "next/link";

import { buttonStyles } from "@/components/ui";
import { Footer } from "@/components/layout/footer";
import { StatusPage } from "@/components/layout/status-page";
import { CHAPTERS } from "@/data/chapters";

export const metadata: Metadata = {
  title: "Không tìm thấy trang – Hào khí Việt Nam",
};

const PLAYABLE = CHAPTERS.filter((chapter) => chapter.href);

/** 404: shown for any address that does not exist (and when a page calls `notFound()`). */
export default function NotFound() {
  return (
    <>
      <StatusPage
        kicker="Hồ sơ số 404"
        mark="404"
        stamp="Không tìm thấy"
        title="Mật thư này không có địa chỉ"
        description="Đường dẫn bạn mở không có trong hồ sơ: có thể đã gõ sai, hoặc trang đã được dời đi. Hãy quay về và chọn lại."
      >
        <Link href="/" className={buttonStyles({ size: "lg" })}>
          Về trang chủ
        </Link>
        <Link href="/#chapters" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          Chọn một chương
        </Link>
      </StatusPage>

      <nav aria-label="Các chương chơi được" className="mx-auto max-w-xl px-5 pb-16 text-center">
        <p className="text-sm text-stone-400">Hoặc vào chơi ngay:</p>
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {PLAYABLE.map((chapter) => (
            <li key={chapter.href}>
              <Link
                href={chapter.href!}
                className="font-serif text-lg font-bold text-amber-400 hover:text-amber-200 hover:underline"
              >
                {chapter.chapterLabel}: {chapter.character}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Footer />
    </>
  );
}
