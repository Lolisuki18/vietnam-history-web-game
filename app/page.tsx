import { ChapterGrid } from "@/components/home/chapter-grid";
import { CodexShelf } from "@/components/home/codex-shelf";
import { Hero } from "@/components/home/hero";
import { Footer } from "@/components/layout/footer";

function SectionHeading({ kicker, title, id }: { kicker: string; title: string; id: string }) {
  return (
    <header className="mb-10 sm:mb-12">
      <p className="text-sm font-semibold text-red-500">{kicker}</p>
      <h2 id={id} className="mt-1 font-serif text-3xl font-bold text-amber-400 sm:text-4xl">
        {title}
      </h2>
    </header>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />

      {/* Chapters Section */}
      <section
        id="chapters"
        aria-labelledby="chapters-heading"
        className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24"
      >
        <SectionHeading kicker="Các chương" title="Chọn một câu chuyện" id="chapters-heading" />
        <ChapterGrid />
      </section>

      {/* Codex / Dossiers Section */}
      <section
        id="codex"
        aria-labelledby="codex-heading"
        className="relative border-t border-amber-900/30 bg-stone-950/80"
      >
        <div className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24">
          <SectionHeading
            kicker="Hồ sơ lịch sử"
            title="Những con người trong từng chương"
            id="codex-heading"
          />
          <CodexShelf />
        </div>
      </section>

      <Footer />
    </main>
  );
}
