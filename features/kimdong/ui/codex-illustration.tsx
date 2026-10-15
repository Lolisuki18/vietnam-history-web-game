import Image from "next/image";

import { cn } from "@/components/ui";

/**
 * Cover of the Kim Đồng chapter: the boy on a mountain trail in the morning mist
 * (`public/assets/kimdong/web/kimdong-cover.webp`, built by tools/kimdong-art). It fills its
 * container.
 */
export function KimDongArt({ className }: { className?: string }) {
  return (
    <Image
      src="/assets/kimdong/web/kimdong-cover.webp"
      alt="Minh họa: Kim Đồng băng qua núi rừng Cao Bằng trong sương sớm"
      width={1100}
      height={614}
      // Already compressed at build time: no need for the image optimizer.
      unoptimized
      className={cn("size-full object-cover", className)}
    />
  );
}

/**
 * The portrait card of Kim Đồng (name, years and role are part of the picture). `crop` shows only
 * the face, for the small card on the home page; otherwise the whole card.
 */
export function KimDongCodexArt({
  className,
  crop = false,
}: {
  className?: string;
  crop?: boolean;
}) {
  return (
    <Image
      src="/assets/kimdong/web/kimdong-codex.webp"
      alt="Chân dung Kim Đồng (Nông Văn Dền), 1929–1943, đội trưởng Đội Thiếu niên Tiền phong"
      width={896}
      height={1200}
      unoptimized
      className={cn(crop ? "size-full object-cover object-top" : "h-auto w-full", className)}
    />
  );
}
