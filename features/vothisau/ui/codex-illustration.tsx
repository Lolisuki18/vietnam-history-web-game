"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/components/ui";

/**
 * A picture that may not have been made yet: when the file is missing, a flat panel with the
 * given caption stands in. (The art for this chapter comes later, see the asset list.)
 */
function MaybeImage({
  src,
  alt,
  width,
  height,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex size-full items-center justify-center bg-gradient-to-b from-stone-800 to-stone-950 p-4 text-center font-serif text-lg text-amber-300/80",
          className,
        )}
      >
        {fallback}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

/** Cover of the chapter: Chị Sáu at the edge of a rubber forest at dusk (`web/vothisau-cover.webp`). */
export function VoThiSauArt({ className }: { className?: string }) {
  return (
    <MaybeImage
      src="/assets/vothisau/web/vothisau-cover.webp"
      alt="Minh họa: chị Võ Thị Sáu giữa rừng cao su Đất Đỏ lúc chạng vạng"
      width={1100}
      height={614}
      fallback="Võ Thị Sáu · Mùa hoa lê-ki-ma"
      className={cn("size-full object-cover", className)}
    />
  );
}

/**
 * The portrait card of Chị Sáu (`web/vothisau-codex.webp`). `crop` shows only the face, for the
 * small card on the home page; otherwise the whole card.
 */
export function VoThiSauCodexArt({
  className,
  crop = false,
}: {
  className?: string;
  crop?: boolean;
}) {
  return (
    <MaybeImage
      src="/assets/vothisau/web/vothisau-codex.webp"
      alt="Chân dung chị Võ Thị Sáu (1933–1952), nữ anh hùng Đất Đỏ"
      width={896}
      height={1200}
      fallback="Võ Thị Sáu 1933 – 1952"
      className={cn(
        crop ? "size-full object-cover object-top" : "aspect-[3/4] h-auto w-full",
        className,
      )}
    />
  );
}
