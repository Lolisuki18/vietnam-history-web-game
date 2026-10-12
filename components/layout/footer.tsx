"use client";

import { DongSonDrum } from "@/components/ui";
import { ArrowUp, Heart, Sparkles } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      id="footer"
      className="relative border-t border-amber-900/40 bg-stone-950 text-stone-400"
    >
      {/* Top subtle gold divider */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          {/* Col 1: Brand & Quote */}
          <div className="flex flex-col gap-4 md:col-span-5">
            <div className="flex items-center gap-3">
              <DongSonDrum size={36} className="text-amber-500" />
              <span className="font-serif text-xl font-black tracking-wider text-amber-400 uppercase text-glow">
                Hào Khí Việt Nam
              </span>
            </div>

            <blockquote className="border-l-2 border-amber-600/70 pl-4 font-serif text-base text-stone-300 italic">
              “Dân ta phải biết sử ta,
              <br />
              Cho tường gốc tích nước nhà Việt Nam.”
              <footer className="mt-1.5 font-sans text-xs text-amber-500/90 not-italic">
                — Chủ tịch Hồ Chí Minh (Lịch sử nước ta, 1942)
              </footer>
            </blockquote>

            <p className="text-xs leading-relaxed text-stone-400">
              Dự án web game giáo dục lịch sử phi lợi nhuận, tái hiện sống động những thời khắc oai
              hùng của các thế hệ anh hùng dân tộc Việt Nam.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="flex flex-col gap-3 md:col-span-3">
            <h3 className="font-serif text-sm font-bold tracking-widest text-amber-400 uppercase">
              Hành Trình
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link href="/" className="transition-colors hover:text-amber-300">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/#chapters" className="transition-colors hover:text-amber-300">
                  Danh sách các chương
                </Link>
              </li>
              <li>
                <Link href="/kimdong" className="transition-colors hover:text-amber-300">
                  Chương 1: Kim Đồng
                </Link>
              </li>
              <li>
                <Link href="/kimdong/codex" className="transition-colors hover:text-amber-300">
                  Hồ sơ Lịch sử: Anh hùng Kim Đồng
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Educational Context */}
          <div className="flex flex-col gap-3 md:col-span-4">
            <h3 className="font-serif text-sm font-bold tracking-widest text-amber-400 uppercase">
              Sứ Mệnh & Tư Liệu
            </h3>
            <p className="text-xs leading-relaxed text-stone-400">
              Các sự kiện, mật thư và tư liệu lịch sử trong game được đối chiếu theo các nguồn sử
              liệu Việt Nam. Dành tặng thế hệ trẻ với lòng biết ơn sâu sắc những người con đã ngã
              xuống vì độc lập tự do của Tổ quốc.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-400/80">
              <Sparkles className="size-3.5 text-amber-400" />
              <span>Phiên bản 0.2.0 · Sử Việt ngàn năm</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-stone-800/80 pt-6 sm:flex-row">
          <p className="flex items-center gap-1.5 text-xs text-stone-400">
            <span>Được xây dựng với</span>
            <Heart className="size-3.5 fill-red-600 text-red-600" aria-label="yêu nước" />
            <span>dành cho thế hệ trẻ Việt Nam.</span>
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="hover:bg-stone-850 flex items-center gap-2 rounded-full border border-amber-800/50 bg-stone-900/80 px-4 py-1.5 text-xs font-semibold text-amber-400 transition-all hover:border-amber-500 hover:text-amber-300 hover:shadow-md hover:shadow-amber-900/20"
          >
            <span>Lên đầu trang</span>
            <ArrowUp className="size-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
