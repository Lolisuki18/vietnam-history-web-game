import { buttonStyles } from "@/components/ui";
import Image from "next/image";
import Link from "next/link";

import { FIRST_PLAYABLE_HREF } from "@/data/chapters";

/** Opening section: the title, one line of promise and two buttons. */
export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-5 py-20 text-center"
    >
      {/* An old round seal, faint and a little crooked, behind the title. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
      >
        <Image
          src="/art/stamp-viet-minh.png"
          alt=""
          width={640}
          height={640}
          unoptimized
          className="w-[min(80vw,560px)] -rotate-12 opacity-[0.13]"
        />
      </div>

      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6">
        <h1 className="font-serif text-5xl leading-tight font-bold text-balance text-amber-400 sm:text-6xl md:text-7xl">
          Hào khí Việt Nam
        </h1>

        <p className="max-w-xl font-serif text-xl text-balance text-stone-300 sm:text-2xl">
          Sống lại những trang sử vàng qua từng khoảnh khắc
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={FIRST_PLAYABLE_HREF}
            className={buttonStyles({ size: "lg", className: "px-7 py-3 text-base" })}
          >
            Bắt đầu chơi
          </Link>
          <a
            href="#codex"
            className={buttonStyles({
              variant: "secondary",
              size: "lg",
              className: "px-7 py-3 text-base",
            })}
          >
            Xem hồ sơ lịch sử
          </a>
        </div>
      </div>
    </section>
  );
}
