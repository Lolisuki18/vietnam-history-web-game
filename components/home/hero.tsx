import { buttonStyles, DongSonDrum } from "@/components/ui";
import { BookOpen, ChevronDown, Flame, Play, ShieldAlert, Sparkles, Star } from "lucide-react";
import Link from "next/link";

/**
 * Epic opening Hero section with Dong Son bronze drum ambient watermark,
 * glowing lacquer red aura, dual CTAs and historical highlights ribbon.
 */
export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden bg-hero px-5 py-20 text-center"
    >
      {/* Background Rotating Dong Son Bronze Drum Watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
      >
        <div className="relative animate-spin-slow opacity-15">
          <DongSonDrum size={720} className="text-amber-400" />
        </div>
        {/* Soft Radial Center Glow */}
        <div className="absolute size-96 animate-pulse-slow rounded-full bg-gradient-to-r from-red-600/20 via-amber-600/25 to-transparent blur-3xl" />
      </div>

      {/* Floating Embers / Stars decoration */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        <span className="absolute top-1/4 left-1/6 size-1 animate-ping rounded-full bg-amber-400/80 shadow-[0_0_8px_#f59e0b]" />
        <span className="absolute top-1/3 right-1/5 size-1.5 animate-pulse rounded-full bg-red-400/80 shadow-[0_0_10px_#ef4444]" />
        <span className="absolute bottom-1/4 left-1/4 size-1 rounded-full bg-amber-300/60 shadow-[0_0_6px_#fcd34d]" />
        <span className="absolute right-1/4 bottom-1/3 size-1.5 animate-bounce rounded-full bg-amber-500/70 shadow-[0_0_8px_#f59e0b]" />
      </div>

      <div className="relative z-10 flex max-w-5xl animate-rise-in flex-col items-center gap-7">
        {/* Top Tag Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/40 bg-stone-900/80 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-amber-400 uppercase shadow-lg shadow-black/50 backdrop-blur">
          <Star className="size-3.5 animate-pulse fill-amber-400 text-amber-400" aria-hidden />
          <span>Dự án Web Game Lịch Sử Việt Nam</span>
          <Sparkles className="size-3.5 text-amber-400" aria-hidden />
        </div>

        {/* Main Title */}
        <h1 className="font-serif text-4xl leading-tight font-black tracking-[0.06em] text-balance text-amber-400 uppercase text-glow sm:text-6xl md:text-7xl lg:text-8xl">
          Hào khí Việt Nam
        </h1>

        {/* Traditional Imperial Divider */}
        <div className="flex items-center gap-3 text-red-600" aria-hidden>
          <span className="h-px w-14 bg-gradient-to-r from-transparent to-red-600 sm:w-28" />
          <span className="size-2 rotate-45 border border-amber-400 bg-red-700" />
          <span className="h-px w-14 bg-gradient-to-l from-transparent to-red-600 sm:w-28" />
        </div>

        {/* Subtitle */}
        <p className="max-w-2xl font-serif text-lg leading-relaxed text-balance text-stone-200 italic sm:text-xl md:text-2xl">
          Sống lại những trang sử vàng qua từng khoảnh khắc hào hùng của dân tộc
        </p>

        {/* Quick Highlights Ribbon */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 text-xs sm:gap-4 sm:text-sm">
          <div className="flex items-center gap-2 rounded-lg border border-amber-900/40 bg-stone-900/70 px-3.5 py-2 text-stone-300 backdrop-blur">
            <Flame className="size-4 text-red-500" aria-hidden />
            <span>Nhiệm vụ dã chiến Cao Bằng</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-900/40 bg-stone-900/70 px-3.5 py-2 text-stone-300 backdrop-blur">
            <ShieldAlert className="size-4 text-amber-500" aria-hidden />
            <span>Thu thập 5 mật thư sống còn</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-900/40 bg-stone-900/70 px-3.5 py-2 text-stone-300 backdrop-blur">
            <BookOpen className="size-4 text-emerald-400" aria-hidden />
            <span>Tàng Kinh Các hồ sơ lịch sử</span>
          </div>
        </div>

        {/* Dual Call To Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/kimdong"
            className={buttonStyles({
              size: "lg",
              className:
                "group px-7 py-3.5 text-base font-bold shadow-xl ring-1 shadow-red-950/60 ring-amber-500/50 hover:ring-amber-400",
            })}
          >
            <Play className="size-5 transition-transform group-hover:scale-110" aria-hidden />
            Bắt đầu hành trình
          </Link>

          <a
            href="#codex"
            className={buttonStyles({
              variant: "secondary",
              size: "lg",
              className: "px-7 py-3.5 text-base font-semibold",
            })}
          >
            <BookOpen className="size-5" aria-hidden />
            Khám phá Hồ sơ Sử
          </a>
        </div>
      </div>

      {/* Bottom Scroll Down Link */}
      <a
        href="#chapters"
        aria-label="Cuộn xuống danh sách chương"
        className="group absolute bottom-5 flex flex-col items-center gap-1 text-xs font-semibold text-amber-500/80 transition-colors hover:text-amber-300"
      >
        <span className="tracking-wider uppercase opacity-80 group-hover:opacity-100">
          Chọn chương
        </span>
        <ChevronDown className="size-6 animate-bounce" aria-hidden />
      </a>
    </section>
  );
}
