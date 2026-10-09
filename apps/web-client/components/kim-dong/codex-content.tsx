import { CODEX } from "@/data/kimdong-story";

import { CodexIllustration } from "./codex-illustration";

/** The Codex article (dark theme). Presentational only, used by the overlay and the standalone page. */
export function CodexContent() {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 text-amber-50">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-sm font-semibold tracking-widest text-amber-300 uppercase">
          {CODEX.kicker}
        </p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{CODEX.title}</h1>
        <p className="text-lg text-amber-100/80">{CODEX.subtitle}</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,18rem)_1fr] sm:items-start">
        <CodexIllustration />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl border border-amber-200/20 bg-black/30 p-4 text-sm">
          {CODEX.facts.map((fact) => (
            <div key={fact.label} className="contents">
              <dt className="font-semibold text-amber-300">{fact.label}</dt>
              <dd className="text-amber-50/90">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {CODEX.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-amber-300">{section.heading}</h2>
          <p className="leading-relaxed text-amber-50/90">{section.body}</p>
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-amber-300">Dòng thời gian</h2>
        <ol className="flex flex-col gap-3 border-l-2 border-amber-300/40 pl-5">
          {CODEX.timeline.map((entry) => (
            <li key={entry.date} className="relative">
              <span
                aria-hidden
                className="absolute top-1.5 -left-[1.65rem] size-3 rounded-full bg-red-600 ring-2 ring-amber-200/60"
              />
              <p className="text-sm font-bold text-amber-200">{entry.date}</p>
              <p className="text-amber-50/90">{entry.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="rounded-lg border border-amber-200/20 bg-black/30 p-4 text-sm leading-relaxed text-amber-100/70">
        {CODEX.note}
      </p>
    </article>
  );
}
