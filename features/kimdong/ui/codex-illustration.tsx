import Image from "next/image";

import { cn } from "@/components/ui";

/**
 * Cover / card art: Cao Bằng mountains at dusk with a red neckerchief. The drawing is a separate
 * file (`public/art/kimdong-cao-bang.svg`); swap it for a real photo later. It fills its container.
 */
export function KimDongArt({ className }: { className?: string }) {
  return (
    <Image
      src="/art/kimdong-cao-bang.svg"
      alt="Minh họa: núi rừng Cao Bằng lúc chiều tối và chiếc khăn quàng đỏ"
      width={320}
      height={200}
      // SVG needs no resizing, and the optimizer refuses SVG by default.
      unoptimized
      className={cn("size-full object-cover", className)}
    />
  );
}
