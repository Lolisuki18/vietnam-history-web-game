import { ChapterGrid } from "@/components/home/chapter-grid";
import { CodexShelf } from "@/components/home/codex-shelf";
import { Hero } from "@/components/home/hero";

function SectionHeading({ kicker, title, id }: { kicker: string; title: string; id: string }) {
  return (
    <header className="mb-8 flex flex-col gap-2 text-center sm:mb-10">
      <p className="text-xs font-semibold tracking-[0.3em] text-red-600 uppercase">{kicker}</p>
      <h2 id={id} className="font-serif text-3xl font-bold text-amber-500 sm:text-4xl">
        {title}
      </h2>
      <div className="mx-auto mt-1 h-px w-24 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
    </header>
  );
}

export default function HomePage() {
  return (
    <main>
      <Hero />

      <section
        id="chapters"
        aria-labelledby="chapters-heading"
        className="mx-auto max-w-6xl scroll-mt-4 px-5 py-16 sm:px-8 sm:py-24"
      >
        <SectionHeading kicker="Hành trình" title="Các chương" id="chapters-heading" />
        <ChapterGrid />
      </section>

      <section
        aria-labelledby="codex-heading"
        className="border-t border-amber-900/30 bg-stone-950/60"
      >
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <SectionHeading kicker="Tư liệu" title="Hồ sơ lịch sử" id="codex-heading" />
          <CodexShelf />
        </div>
      </section>

      <footer className="border-t border-amber-900/30 px-5 py-8 text-center text-sm text-stone-500">
        Hào khí Việt Nam · Trò chơi giáo dục lịch sử
      </footer>
    </main>
  );
}
