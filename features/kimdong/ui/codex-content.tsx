"use client";

import { cn } from "@/components/ui";
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
            "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "biography"
              ? "border border-amber-600 text-amber-300"
              : "border border-transparent text-stone-400 hover:text-stone-200",
          )}
        >
          Tiểu sử
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "letters"}
          onClick={() => setActiveTab("letters")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "letters"
              ? "border border-amber-600 text-amber-300"
              : "border border-transparent text-stone-400 hover:text-stone-200",
          )}
        >
          Mật thư (5/5)
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "monument"}
          onClick={() => setActiveTab("monument")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "monument"
              ? "border border-amber-600 text-amber-300"
              : "border border-transparent text-stone-400 hover:text-stone-200",
          )}
        >
          Di tích
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
                className="rounded-lg border border-stone-800 bg-stone-900 p-4 text-center"
              >
                <dd className="font-serif text-3xl font-bold text-amber-400">{stat.value}</dd>
                <dt className="mt-1 text-sm text-stone-400">{stat.label}</dt>
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
            <h2 className="border-b border-amber-800/40 pb-2.5 font-serif text-2xl font-bold text-amber-400">
              Dòng thời gian
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
            <h2 className="font-serif text-xl font-bold text-amber-400">Năm mảnh mật thư</h2>
            <p className="mt-1 text-sm text-stone-400">
              Các bức thư mật người chơi đã thu thập và bảo vệ an toàn trong màn chơi Kim Đồng.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4">
            {LETTERS.map((letter, idx) => (
              <div
                key={letter.title}
                className={cn(
                  "relative flex flex-col gap-3 rounded-lg border p-5",
                  letter.urgent
                    ? "border-red-600/70 bg-red-950/40"
                    : "border-amber-700/50 bg-stone-950/80",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "font-serif text-sm font-bold",
                      letter.urgent ? "text-red-400" : "text-amber-400",
                    )}
                  >
                    Mật thư {idx + 1} · {letter.title}
                  </span>
                  {letter.urgent && (
                    <span className="rounded bg-red-700/80 px-2 py-0.5 text-xs font-semibold text-white">
                      Khẩn cấp
                    </span>
                  )}
                </div>

                <p className="font-serif text-lg leading-relaxed text-amber-100 italic">
                  “{letter.quote}”
                </p>

                {letter.fact && (
                  <p className="rounded-md bg-stone-900 p-3 text-sm text-stone-300">
                    <strong className="text-amber-400">Bạn có biết:</strong> {letter.fact}
                  </p>
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
            <h2 className="font-serif text-xl font-bold text-amber-400">
              Khu di tích Kim Đồng (Cao Bằng)
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

            <p className="rounded-md border-l-4 border-red-800 bg-stone-900 p-4 text-stone-200">
              Năm 1997, Kim Đồng được Nhà nước truy tặng danh hiệu{" "}
              <strong>Anh hùng Lực lượng Vũ trang Nhân dân</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
