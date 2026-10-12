"use client";

import { cn } from "@/components/ui";
import { BookOpen, Calendar, Compass, Flame, Info, Mail, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";

import { CODEX, LETTERS } from "@/features/kimdong/data/story";

type TabId = "biography" | "letters" | "monument";

/**
 * Enhanced historical dossier reader with tabs:
 * 1. Tiểu sử & Chiến công
 * 2. Kho Mật thư Lịch sử
 * 3. Di tích & Tưởng niệm
 */
export function CodexText({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("biography");

  return (
    <div className={cn("flex flex-col gap-6 text-stone-300", className)}>
      {/* Tab Navigation */}
      <div
        className="flex flex-wrap items-center gap-2 border-b border-amber-900/40 pb-3"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "biography"}
          onClick={() => setActiveTab("biography")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold tracking-wide transition-all",
            activeTab === "biography"
              ? "border border-amber-500 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-900/30"
              : "border border-transparent bg-stone-900/60 text-stone-400 hover:border-amber-900/50 hover:text-stone-200",
          )}
        >
          <BookOpen className="size-4 text-amber-400" />
          Tiểu sử & Cuộc đời
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "letters"}
          onClick={() => setActiveTab("letters")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold tracking-wide transition-all",
            activeTab === "letters"
              ? "border border-amber-500 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-900/30"
              : "border border-transparent bg-stone-900/60 text-stone-400 hover:border-amber-900/50 hover:text-stone-200",
          )}
        >
          <Mail className="size-4 text-amber-400" />
          Kho Mật Thư (5/5)
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "monument"}
          onClick={() => setActiveTab("monument")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold tracking-wide transition-all",
            activeTab === "monument"
              ? "border border-amber-500 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-900/30"
              : "border border-transparent bg-stone-900/60 text-stone-400 hover:border-amber-900/50 hover:text-stone-200",
          )}
        >
          <MapPin className="size-4 text-amber-400" />
          Di tích Cao Bằng
        </button>
      </div>

      {/* Tab 1: Biography & Life */}
      {activeTab === "biography" && (
        <div className="flex animate-rise-in flex-col gap-9">
          {/* Key Stats Grid */}
          <dl className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {CODEX.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-amber-700/50 bg-stone-950/70 p-4 text-center shadow-lg shadow-black/40"
              >
                <dd className="font-serif text-3xl font-black text-amber-400 text-glow">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-xs font-bold tracking-wider text-stone-400 uppercase">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>

          {/* Sections */}
          {CODEX.sections.map((section, index) => (
            <section key={section.heading} className="flex flex-col gap-3">
              <h2 className="flex items-baseline gap-3 border-b border-amber-800/40 pb-2.5 font-serif text-2xl font-bold text-amber-400">
                <span className="font-mono text-sm font-black text-red-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>
              <p className="text-base leading-relaxed text-stone-200 sm:text-lg sm:leading-8">
                {section.body}
              </p>
            </section>
          ))}

          {/* Timeline */}
          <section className="flex flex-col gap-5">
            <h2 className="flex items-center gap-2.5 border-b border-amber-800/40 pb-2.5 font-serif text-2xl font-bold text-amber-400">
              <Calendar className="size-5 text-red-500" />
              Dòng Thời Gian Lịch Sử
            </h2>
            <ol className="relative flex flex-col gap-6 border-l-2 border-amber-600/50 pl-6 sm:pl-8">
              {CODEX.timeline.map((entry) => (
                <li key={entry.date} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[1.95rem] size-3.5 rounded-full border-2 border-amber-300 bg-red-700 shadow sm:-left-[2.45rem]"
                  />
                  <p className="font-serif text-lg font-black text-amber-400">{entry.date}</p>
                  <p className="mt-0.5 text-stone-300">{entry.text}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Note Footer */}
          <blockquote className="rounded-xl border-l-4 border-red-700 bg-stone-950/70 p-4 text-sm leading-relaxed text-stone-400 italic">
            <p className="font-semibold text-stone-300 not-italic">Lưu ý tư liệu:</p>
            {CODEX.note}
          </blockquote>
        </div>
      )}

      {/* Tab 2: Secret Letters Archive */}
      {activeTab === "letters" && (
        <div className="flex animate-rise-in flex-col gap-6">
          <header className="rounded-xl border border-amber-800/40 bg-stone-950/70 p-4">
            <h2 className="font-serif text-xl font-bold text-amber-400">
              Tài Liệu Mật Thư Kháng Chiến (5 Mảnh Mật Thư)
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              Các bức thư mật người chơi đã thu thập và bảo vệ an toàn trong màn chơi Kim Đồng.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4">
            {LETTERS.map((letter, idx) => (
              <div
                key={letter.title}
                className={cn(
                  "relative flex flex-col gap-3 rounded-xl border p-5 shadow-lg",
                  letter.urgent
                    ? "border-red-600/70 bg-red-950/40"
                    : "border-amber-700/50 bg-stone-950/80",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "font-serif text-sm font-bold tracking-wider uppercase",
                      letter.urgent ? "text-red-400" : "text-amber-400",
                    )}
                  >
                    Mật thư số 0{idx + 1} · {letter.title}
                  </span>
                  {letter.urgent && (
                    <span className="flex items-center gap-1 rounded bg-red-700/80 px-2 py-0.5 text-[11px] font-bold text-white">
                      <Flame className="size-3" /> KHẨN CẤP
                    </span>
                  )}
                </div>

                <p className="font-serif text-lg leading-relaxed text-amber-100 italic">
                  “{letter.quote}”
                </p>

                {letter.fact && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-900/40 bg-stone-900/60 p-3 text-sm text-stone-300">
                    <Info className="mt-0.5 size-4 shrink-0 text-amber-400" />
                    <span>
                      <strong className="text-amber-400">Tư liệu lịch sử:</strong> {letter.fact}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Historical Monument */}
      {activeTab === "monument" && (
        <div className="flex animate-rise-in flex-col gap-6">
          <header className="rounded-xl border border-amber-800/40 bg-stone-950/70 p-4">
            <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-amber-400">
              <Compass className="size-5 text-red-500" />
              Khu Di Tích Lịch Sử Kim Đồng (Cao Bằng)
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              Thôn Nà Mạ, xã Trường Hà, huyện Hà Quảng, tỉnh Cao Bằng – nơi sinh ra và yên nghỉ của
              người anh hùng nhỏ tuổi.
            </p>
          </header>

          <div className="flex flex-col gap-4 text-base leading-relaxed text-stone-200">
            <p>
              Khu di tích lịch sử Kim Đồng nằm tại làng Nà Mạ, xã Trường Hà, huyện Hà Quảng, tỉnh
              Cao Bằng, cách di tích Pác Bó chỉ vài cây số. Đây là nơi anh Nông Văn Dền cất tiếng
              khóc chào đời năm 1929 và cũng là mảnh đất thiêng liêng nơi anh ngã xuống khi làm
              nhiệm vụ vào ngày 15/2/1943.
            </p>

            <div className="rounded-xl border border-amber-700/40 bg-stone-900/80 p-5">
              <h3 className="font-serif text-lg font-bold text-amber-400">
                Tượng đài và Mộ Anh Kim Đồng
              </h3>
              <p className="mt-2 text-stone-300">
                Khuôn viên di tích được xây dựng trang nghiêm với khu mộ và cụm tượng đài Anh Kim
                Đồng tạc bằng đá trắng nguyên khối. Tượng đài khắc họa hình ảnh anh Dền hiên ngang,
                tay nâng cánh chim bồ câu biểu tượng của hòa bình và tin báo cách mạng. Phía sau mộ
                là bức phù điêu lớn tái hiện lễ thành lập Đội Nhi đồng Cứu quốc ngày 15/5/1941.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-red-800/50 bg-red-950/30 p-4 text-amber-200">
              <Sparkles className="size-5 shrink-0 text-amber-400" />
              <span>
                Năm 1997, Kim Đồng được Nhà nước truy tặng danh hiệu cao quý{" "}
                <strong>Anh hùng Lực lượng Vũ trang Nhân dân</strong>.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
