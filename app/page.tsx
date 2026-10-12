import { ChapterGrid } from "@/components/home/chapter-grid";
import { CodexShelf } from "@/components/home/codex-shelf";
import { Hero } from "@/components/home/hero";
import { Footer } from "@/components/layout/footer";
import { DongSonDrum } from "@/components/ui";

function SectionHeading({ kicker, title, id }: { kicker: string; title: string; id: string }) {
  return (
    <header className="mb-10 flex flex-col items-center gap-2.5 text-center sm:mb-14">
      <div className="flex items-center gap-2">
        <DongSonDrum size={18} className="text-amber-500/80" />
        <p className="text-xs font-bold tracking-[0.28em] text-red-500 uppercase">{kicker}</p>
        <DongSonDrum size={18} className="text-amber-500/80" />
      </div>
      <h2
        id={id}
        className="font-serif text-3xl font-black tracking-tight text-amber-400 text-glow sm:text-4xl md:text-5xl"
      >
        {title}
      </h2>
      <div className="flex items-center gap-2 pt-1">
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-600/70 sm:w-24" />
        <span className="size-1.5 rotate-45 bg-amber-500" />
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-600/70 sm:w-24" />
      </div>
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
        <SectionHeading
          kicker="Hành trình cứu quốc"
          title="Các Chương Lịch Sử"
          id="chapters-heading"
        />
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
            kicker="Tàng Kinh Các"
            title="Hồ Sơ Anh Hùng Lịch Sử"
            id="codex-heading"
          />
          <CodexShelf />
        </div>
      </section>

      <Footer />
    </main>
  );
}
