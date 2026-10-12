"use client";

import { buttonStyles, cn, SvgIcon } from "@/components/ui";
import { Menu, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { CHAPTERS, FIRST_PLAYABLE_HREF } from "@/data/chapters";
import { ambientSound } from "@/lib/audio/ambient-sound";
import { useProgressStore } from "@/stores/progress-store";
import { useProgressHydrated } from "@/stores/use-progress-hydrated";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/#chapters", label: "Các chương" },
  { href: "/#codex", label: "Hồ sơ lịch sử" },
] as const;

/** Routes where a game runs full screen (and plays its own sound): no site navbar there. */
const GAME_ROUTES: readonly string[] = CHAPTERS.flatMap((chapter) =>
  chapter.href ? [chapter.href] : [],
);

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const hydrated = useProgressHydrated();
  const finishedCount = useProgressStore((state) => Object.keys(state.completions).length);
  const progressLabel = `${hydrated ? finishedCount : 0}/${CHAPTERS.length}`;

  const musicOn = useSyncExternalStore(ambientSound.subscribe, ambientSound.getStatus, () => false);

  const isGameRoute = GAME_ROUTES.includes(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A game has its own sound and no navbar to turn this music off: stop it when entering one.
  useEffect(() => {
    if (isGameRoute) ambientSound.stop();
  }, [isGameRoute]);

  if (isGameRoute) return null;

  const linkClass =
    "rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap text-stone-300 transition-colors hover:text-amber-400";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-colors duration-300",
        scrolled
          ? "border-amber-900/50 bg-stone-950/95 backdrop-blur"
          : "border-amber-900/20 bg-stone-950/70 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap">
          <SvgIcon name="dong-son-drum" size={30} className="text-amber-500" />
          <span className="font-serif text-lg font-bold text-amber-400 sm:text-xl">
            Hào khí Việt Nam
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <p
            className="hidden text-xs whitespace-nowrap text-stone-400 sm:block"
            title="Số chương đã hoàn thành"
          >
            Đã hoàn thành <span className="font-bold text-amber-400">{progressLabel}</span>
          </p>

          <button
            type="button"
            onClick={() => (musicOn ? ambientSound.stop() : ambientSound.play())}
            aria-label={musicOn ? "Tắt nhạc nền" : "Bật nhạc nền"}
            aria-pressed={musicOn}
            className={cn(
              "flex size-9 items-center justify-center rounded-md border transition-colors",
              musicOn
                ? "border-amber-500 text-amber-300"
                : "border-stone-700 text-stone-400 hover:border-amber-600 hover:text-amber-300",
            )}
          >
            {musicOn ? (
              <Volume2 className="size-4" aria-hidden />
            ) : (
              <VolumeX className="size-4" aria-hidden />
            )}
          </button>

          <Link
            href={FIRST_PLAYABLE_HREF}
            className={buttonStyles({
              size: "sm",
              className: "hidden px-4 whitespace-nowrap sm:inline-flex",
            })}
          >
            Chơi ngay
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
            className="flex size-9 items-center justify-center rounded-md border border-stone-700 text-stone-300 hover:text-amber-400 lg:hidden"
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Menu di động"
          className="flex flex-col gap-1 border-t border-amber-900/40 bg-stone-950 px-4 py-4 lg:hidden"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-2.5 text-base font-semibold text-stone-200 hover:bg-stone-900 hover:text-amber-400"
            >
              {link.label}
            </Link>
          ))}
          <p className="px-3 pt-3 text-sm text-stone-400">
            Đã hoàn thành <span className="font-bold text-amber-400">{progressLabel}</span> chương
          </p>
          <Link
            href={FIRST_PLAYABLE_HREF}
            onClick={() => setMenuOpen(false)}
            className={buttonStyles({ size: "md", className: "mt-2 w-full justify-center" })}
          >
            Chơi ngay
          </Link>
        </nav>
      )}
    </header>
  );
}
