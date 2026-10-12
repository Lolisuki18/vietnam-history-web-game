import { SvgIcon } from "@/components/ui";
import Link from "next/link";

import { CHAPTERS } from "@/data/chapters";

const PLAYABLE = CHAPTERS.filter((chapter) => chapter.href);

export function Footer() {
  return (
    <footer id="footer" className="border-t border-amber-900/40 bg-stone-950/70 text-stone-400">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="flex flex-col gap-4 md:col-span-5">
            <div className="flex items-center gap-2.5">
              <SvgIcon name="dong-son-drum" size={30} className="text-amber-500" />
              <span className="font-serif text-xl font-bold text-amber-400">Hào khí Việt Nam</span>
            </div>
            <blockquote className="border-l-2 border-amber-700/70 pl-4 font-serif text-stone-300 italic">
              “Dân ta phải biết sử ta,
              <br />
              Cho tường gốc tích nước nhà Việt Nam.”
              <footer className="mt-1.5 font-sans text-xs text-stone-500 not-italic">
                Hồ Chí Minh, Lịch sử nước ta (1942)
              </footer>
            </blockquote>
          </div>

          <nav aria-label="Liên kết" className="flex flex-col gap-3 md:col-span-3">
            <h3 className="font-serif text-base font-bold text-amber-400">Khám phá</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link href="/" className="hover:text-amber-300">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/#chapters" className="hover:text-amber-300">
                  Các chương
                </Link>
              </li>
              {PLAYABLE.map((chapter) => (
                <li key={chapter.href}>
                  <Link href={chapter.href!} className="hover:text-amber-300">
                    {chapter.chapterLabel}: {chapter.character}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-3 md:col-span-4">
            <h3 className="font-serif text-base font-bold text-amber-400">Về dự án</h3>
            <p className="text-sm leading-relaxed">
              Một trò chơi học lịch sử Việt Nam, không vì lợi nhuận. Tư liệu trong game được tổng
              hợp từ sách giáo khoa và các nguồn chính thống; tình tiết minh họa là hư cấu.
            </p>
          </div>
        </div>

        <p className="mt-10 border-t border-stone-800 pt-5 text-xs text-stone-500">
          Phiên bản 0.2.0
        </p>
      </div>
    </footer>
  );
}
