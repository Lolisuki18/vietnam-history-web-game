"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/components/ui";

function initials(name: string): string {
  return name
    .split(" ")
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * A speaker's portrait. The pictures are made later (see the asset list), so when a file is not
 * there yet, a round badge with the speaker's initials stands in.
 */
export function Portrait({
  src,
  name,
  className,
}: {
  src?: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <Image
        src={src}
        alt=""
        width={64}
        height={64}
        unoptimized
        onError={() => setFailed(true)}
        className={cn(
          "size-16 shrink-0 rounded-sm border-2 border-red-950 object-cover",
          className,
        )}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-red-950 bg-red-800 font-serif text-xl font-black text-amber-100",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
