import { cn } from "@vhg/ui";

import { CODEX } from "@/data/kimdong-story";

/**
 * The historical text of the Codex (key numbers, sections, timeline, note) in sharp serif
 * typography (the right-hand column of the Codex page).
 */
export function CodexText({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-10 text-stone-300", className)}>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CODEX.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-amber-700/40 bg-stone-950/60 px-4 py-4 text-center"
          >
            <dd className="font-serif text-3xl font-bold text-amber-500">{stat.value}</dd>
            <dt className="mt-1 text-xs font-semibold tracking-wide text-stone-400 uppercase">
              {stat.label}
            </dt>
          </div>
        ))}
      </dl>

      {CODEX.sections.map((section, index) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="flex items-baseline gap-3 border-b border-amber-700/40 pb-2 font-serif text-2xl font-bold text-amber-500">
            <span className="text-base text-red-600">{String(index + 1).padStart(2, "0")}</span>
            {section.heading}
          </h2>
          <p className="text-base leading-8 text-stone-300 sm:text-lg">{section.body}</p>
        </section>
      ))}

      <section className="flex flex-col gap-4">
        <h2 className="border-b border-amber-700/40 pb-2 font-serif text-2xl font-bold text-amber-500">
          Dòng thời gian
        </h2>
        <ol className="flex flex-col gap-5 border-l-2 border-amber-600/50 pl-6">
          {CODEX.timeline.map((entry) => (
            <li key={entry.date} className="relative">
              <span
                aria-hidden
                className="absolute top-1.5 -left-[1.95rem] size-3.5 rounded-full bg-red-700 ring-2 ring-amber-400/70"
              />
              <p className="font-serif text-lg font-bold text-amber-400">{entry.date}</p>
              <p className="text-stone-300">{entry.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <blockquote className="rounded-lg border-l-4 border-red-800 bg-stone-950/60 p-4 text-sm leading-relaxed text-stone-400 italic">
        {CODEX.note}
      </blockquote>
    </div>
  );
}
