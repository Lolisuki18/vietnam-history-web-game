"use client";

import { useState } from "react";

import { cn } from "@/components/ui";
import { CODEX, LORE, MONUMENT } from "@/features/vothisau/data/story";

type TabId = "biography" | "papers" | "monument";

const TABS: readonly { id: TabId; label: string }[] = [
  { id: "biography", label: "Tiểu sử" },
  { id: "papers", label: `Tư liệu (${LORE.length}/${LORE.length})` },
  { id: "monument", label: "Di tích" },
];

/** The historical dossier of Chị Sáu, in three tabs: biography, the papers of the game, memorial. */
export function CodexText({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("biography");

  return (
    <div className={cn("flex flex-col gap-6 text-stone-300", className)}>
      <div
        className="flex flex-wrap items-center gap-2 border-b border-amber-900/40 pb-3"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
              activeTab === tab.id
                ? "border border-amber-600 text-amber-300"
                : "border border-transparent text-stone-400 hover:text-stone-200",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "biography" && (
        <div className="flex animate-rise-in flex-col gap-9">
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

          <section className="flex flex-col gap-5">
            <h2 className="border-b border-amber-800/40 pb-2.5 font-serif text-2xl font-bold text-amber-400">
              Dòng thời gian
            </h2>
            <ol className="relative flex flex-col gap-6 border-l-2 border-amber-600/50 pl-6 sm:pl-8">
              {CODEX.timeline.map((entry) => (
                <li key={entry.date} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[1.95rem] size-3.5 rounded-full border-2 border-amber-300 bg-red-700 sm:-left-[2.45rem]"
                  />
                  <p className="font-serif text-lg font-black text-amber-400">{entry.date}</p>
                  <p className="mt-0.5 text-stone-300">{entry.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <blockquote className="rounded-xl border-l-4 border-red-700 bg-stone-950/70 p-4 text-sm leading-relaxed text-stone-400 italic">
            <p className="font-semibold text-stone-300 not-italic">Lưu ý tư liệu:</p>
            {CODEX.note}
          </blockquote>
        </div>
      )}

      {activeTab === "papers" && (
        <div className="flex animate-rise-in flex-col gap-6">
          <header className="rounded-xl border border-amber-800/40 bg-stone-950/70 p-4">
            <h2 className="font-serif text-xl font-bold text-amber-400">
              Năm tờ giấy trên đường đi
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              Truyền đơn, tờ báo, lệnh truy lùng và mật thư mà chị Sáu gặp trong trò chơi. Nội dung
              các tờ giấy là hư cấu; phần “Bạn có biết” dựa trên tư liệu lịch sử.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4">
            {LORE.map((paper, index) => (
              <div
                key={paper.title}
                className={cn(
                  "relative flex flex-col gap-3 rounded-lg border p-5",
                  paper.urgent
                    ? "border-red-600/70 bg-red-950/40"
                    : "border-amber-700/50 bg-stone-950/80",
                )}
              >
                <span
                  className={cn(
                    "font-serif text-sm font-bold",
                    paper.urgent ? "text-red-400" : "text-amber-400",
                  )}
                >
                  Tư liệu {index + 1} · {paper.title}
                </span>
                <p className="font-serif text-lg leading-relaxed text-amber-100 italic">
                  “{paper.quote}”
                </p>
                {paper.fact && (
                  <p className="rounded-md bg-stone-900 p-3 text-sm text-stone-300">
                    <strong className="text-amber-400">Bạn có biết:</strong> {paper.fact}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "monument" && (
        <div className="flex animate-rise-in flex-col gap-6">
          <header className="rounded-xl border border-amber-800/40 bg-stone-950/70 p-4">
            <h2 className="font-serif text-xl font-bold text-amber-400">{MONUMENT.title}</h2>
            <p className="mt-1 text-sm text-stone-400">Nơi chị Võ Thị Sáu yên nghỉ.</p>
          </header>
          <p className="text-base leading-relaxed text-stone-200">{MONUMENT.body}</p>
          <p className="rounded-md border-l-4 border-red-800 bg-stone-900 p-4 text-stone-200">
            Năm 1993, chị được Nhà nước truy tặng danh hiệu{" "}
            <strong>Anh hùng Lực lượng vũ trang nhân dân</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
