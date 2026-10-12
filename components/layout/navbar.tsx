"use client";

import { buttonStyles, DongSonDrum } from "@/components/ui";
import { BookOpen, Menu, ScrollText, ShieldCheck, Swords, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ambientSound } from "@/lib/audio/ambient-sound";
import { KIMDONG_ID } from "@/features/kimdong/types";
import { selectIsCompleted, useProgressStore } from "@/stores/progress-store";
import { useProgressHydrated } from "@/stores/use-progress-hydrated";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const hydrated = useProgressHydrated();
  const kimDongCompleted = useProgressStore(selectIsCompleted(KIMDONG_ID));
  const completedCount = hydrated && kimDongCompleted ? 1 : 0;

  // Don't show the website navbar when playing full-screen inside game routes if not desired,
  // or show a streamlined version. For /kimdong, the Phaser game has its own shell.
  const isGameRoute = pathname === "/kimdong";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSound = () => {
    const active = ambientSound.toggle();
    setIsAudioPlaying(active);
  };

  if (isGameRoute) {
    // In game screen, render minimal or return null so game canvas has complete control
    return null;
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-amber-900/50 bg-stone-950/90 shadow-xl shadow-black/60 backdrop-blur-md"
          : "border-b border-amber-900/20 bg-stone-950/60 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-transform hover:scale-[1.02]"
        >
          <div className="relative flex size-10 items-center justify-center rounded-full border border-amber-500/60 bg-gradient-to-br from-amber-600/30 to-red-950/80 shadow-md shadow-amber-900/40">
            <DongSonDrum
              size={32}
              className="text-amber-400 transition-transform duration-700 group-hover:rotate-45"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-black tracking-wider text-amber-400 uppercase text-glow sm:text-xl">
              Hào Khí Việt Nam
            </span>
            <span className="text-[10px] font-semibold tracking-[0.25em] text-red-400 uppercase">
              Web Game Lịch Sử
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-1 md:flex lg:gap-2" aria-label="Điều hướng chính">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-800/60 hover:text-amber-400"
          >
            <ScrollText className="size-4 text-amber-500/80" />
            Trang chủ
          </Link>

          <Link
            href="/#chapters"
            className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-800/60 hover:text-amber-400"
          >
            <Swords className="size-4 text-amber-500/80" />
            Hành trình
          </Link>

          <Link
            href="/#codex"
            className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-800/60 hover:text-amber-400"
          >
            <BookOpen className="size-4 text-amber-500/80" />
            Tàng Kinh Các
          </Link>

          <Link
            href="/kimdong/codex"
            className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-800/60 hover:text-amber-400"
          >
            <ShieldCheck className="size-4 text-amber-500/80" />
            Hồ sơ Kim Đồng
          </Link>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Progress Indicator */}
          <div
            title="Tiến độ hoàn thành các chương"
            className="hidden items-center gap-2 rounded-full border border-amber-800/50 bg-stone-900/80 px-3 py-1.5 text-xs font-semibold text-amber-300/90 shadow-inner sm:flex"
          >
            <span className="size-2 animate-pulse rounded-full bg-amber-400" />
            <span>Tiến độ:</span>
            <span className="font-bold text-amber-400">{completedCount}/3</span>
          </div>

          {/* Ambient Audio Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isAudioPlaying ? "Tắt âm thanh không gian" : "Bật âm thanh không gian"}
            title={isAudioPlaying ? "Tắt âm thanh không gian" : "Bật âm thanh hào hùng"}
            className={`flex size-9 items-center justify-center rounded-lg border transition-all ${
              isAudioPlaying
                ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-500/30"
                : "border-stone-700 bg-stone-900/60 text-stone-400 hover:border-amber-600 hover:text-amber-300"
            }`}
          >
            {isAudioPlaying ? (
              <Volume2 className="size-4 animate-pulse text-amber-400" />
            ) : (
              <VolumeX className="size-4" />
            )}
          </button>

          {/* Play Now Direct Button */}
          <Link
            href="/kimdong"
            className={buttonStyles({
              size: "sm",
              className: "hidden px-4 font-bold tracking-wide shadow-md sm:inline-flex",
            })}
          >
            Chơi ngay
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
            className="flex size-9 items-center justify-center rounded-lg border border-stone-700 bg-stone-900/60 text-stone-300 hover:text-amber-400 md:hidden"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="animate-rise-in border-t border-amber-900/40 bg-stone-950/95 px-5 py-5 shadow-2xl backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-stone-200 hover:bg-stone-800/80 hover:text-amber-400"
            >
              <ScrollText className="size-5 text-amber-500" />
              Trang chủ
            </Link>

            <Link
              href="/#chapters"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-stone-200 hover:bg-stone-800/80 hover:text-amber-400"
            >
              <Swords className="size-5 text-amber-500" />
              Hành trình các chương
            </Link>

            <Link
              href="/#codex"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-stone-200 hover:bg-stone-800/80 hover:text-amber-400"
            >
              <BookOpen className="size-5 text-amber-500" />
              Tàng Kinh Các (Hồ sơ)
            </Link>

            <Link
              href="/kimdong/codex"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-stone-200 hover:bg-stone-800/80 hover:text-amber-400"
            >
              <ShieldCheck className="size-5 text-amber-500" />
              Hồ sơ Anh hùng Kim Đồng
            </Link>

            <div className="mt-3 flex items-center justify-between border-t border-stone-800 pt-4">
              <span className="text-sm text-stone-400">Tiến độ lưu:</span>
              <span className="rounded-full border border-amber-700/60 bg-amber-950/60 px-3 py-0.5 text-xs font-bold text-amber-400">
                {completedCount}/3 Chương
              </span>
            </div>

            <div className="mt-2 pt-2">
              <Link
                href="/kimdong"
                onClick={() => setMobileMenuOpen(false)}
                className={buttonStyles({
                  size: "md",
                  className: "w-full justify-center text-center",
                })}
              >
                Vào chơi Chapter Kim Đồng
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
