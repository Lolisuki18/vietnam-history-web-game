import { Button, ChapterCard } from "@vhg/ui";
import { Play, ScrollText } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-700">
          <ScrollText className="size-4" aria-hidden /> Trò chơi lịch sử
        </span>
        <h1 className="text-4xl font-black tracking-tight text-stone-900 sm:text-5xl">
          Hành trình lịch sử Việt Nam
        </h1>
        <p className="max-w-2xl text-lg text-stone-600">
          Nhập vai vào những nhân vật lịch sử, hoàn thành nhiệm vụ và khám phá các chương của lịch
          sử dân tộc.
        </p>
      </header>

      <section aria-labelledby="chapters" className="flex flex-col gap-4">
        <h2 id="chapters" className="text-2xl font-bold">
          Các chương
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <ChapterCard
            period="1941 – 1943"
            title="Kim Đồng – Người liên lạc nhỏ"
            description="Vào vai anh Kim Đồng, băng qua núi rừng Cao Bằng, thu thập mật thư và tránh tầm mắt của lính tuần."
            action={
              <Link href="/chapters/kim-dong">
                <Button>
                  <Play className="size-4" aria-hidden /> Chơi ngay
                </Button>
              </Link>
            }
          />
        </div>
      </section>
    </main>
  );
}
