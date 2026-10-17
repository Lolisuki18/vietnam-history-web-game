import Image from "next/image";
import type { ReactNode } from "react";

interface StatusPageProps {
  /** Small red line above the mark, e.g. "Hồ sơ số 404". */
  kicker: string;
  /** The big thing in the middle: the number 404, or an icon. */
  mark: ReactNode;
  /** Text of the ink stamp under the mark. */
  stamp: string;
  title: string;
  description: string;
  /** Buttons and links under the text. */
  children?: ReactNode;
  /** Small print at the bottom (an error code). */
  note?: string;
}

/**
 * The layout shared by the 404, error and global-error pages, in the voice of the rest of the site:
 * a faint round seal behind, a big slab-serif mark, a tilted ink stamp. No state and no hooks, so
 * it works in server and client components alike.
 */
export function StatusPage({
  kicker,
  mark,
  stamp,
  title,
  description,
  children,
  note,
}: StatusPageProps) {
  return (
    <main className="relative flex min-h-[78svh] flex-col items-center justify-center overflow-hidden px-5 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
      >
        <Image
          src="/assets/shared/textures/stamp-viet-minh.png"
          alt=""
          width={640}
          height={640}
          unoptimized
          className="w-[min(80vw,520px)] rotate-12 opacity-[0.1]"
        />
      </div>

      <div className="relative z-10 flex max-w-xl animate-rise-in flex-col items-center gap-5">
        <p className="text-sm font-semibold tracking-[0.3em] text-red-500 uppercase">{kicker}</p>

        <div
          aria-hidden
          className="font-serif text-8xl leading-none font-black text-amber-400 sm:text-9xl"
        >
          {mark}
        </div>

        <span className="stamp -rotate-6 bg-stone-950/70 px-4 py-1 text-base text-red-500 sm:text-lg">
          {stamp}
        </span>

        <h1 className="mt-2 font-serif text-3xl font-bold text-balance text-amber-300 sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-md text-stone-300 sm:text-lg">{description}</p>

        {children ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{children}</div>
        ) : null}

        {note ? <p className="mt-4 text-xs text-stone-500">{note}</p> : null}
      </div>
    </main>
  );
}
