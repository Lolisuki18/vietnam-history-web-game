import { buttonStyles } from "@/components/ui";
import { ChevronDown, Star } from "lucide-react";

/** Full-screen opening section of the home page. */
export function Hero() {
  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-hero px-5 py-16 text-center">
      <div className="flex max-w-4xl animate-rise-in flex-col items-center gap-6">
        <Star className="size-8 fill-amber-500 text-amber-500 drop-shadow-lg" aria-hidden />
        <h1 className="font-serif text-4xl leading-tight font-black tracking-[0.1em] text-balance text-amber-500 uppercase text-glow sm:text-6xl md:text-7xl lg:text-8xl">
          Hào khí Việt Nam
        </h1>
        <div className="flex items-center gap-3 text-red-700" aria-hidden>
          <span className="h-px w-12 bg-current sm:w-24" />
          <span className="size-2 rotate-45 bg-current" />
          <span className="h-px w-12 bg-current sm:w-24" />
        </div>
        <p className="max-w-xl font-serif text-lg text-balance text-stone-300 italic sm:text-xl md:text-2xl">
          Sống lại những trang sử vàng qua từng khoảnh khắc
        </p>
        <a href="#chapters" className={buttonStyles({ size: "lg", className: "mt-4" })}>
          Chọn chương
        </a>
      </div>
      <a
        href="#chapters"
        aria-label="Cuộn xuống danh sách chương"
        className="absolute bottom-6 animate-bounce text-amber-500/70 transition-colors hover:text-amber-400"
      >
        <ChevronDown className="size-8" aria-hidden />
      </a>
    </section>
  );
}
