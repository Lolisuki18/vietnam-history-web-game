import type { CSSProperties } from "react";

import { cn } from "./cn";

/**
 * Icons that lucide-react does not have. Each one is a separate single-colour `.svg` file in
 * `public/assets/shared/icons/` (never inline `<svg>` in TSX: ESLint forbids it). Add the file, then register it
 * here.
 */
export const SVG_ICONS = {
  "dong-son-drum": "/assets/shared/icons/dong-son-drum.svg",
  /** A drawing pin, seen from above. */
  pin: "/assets/shared/icons/pin.svg",
  /** Faint old pattern for the top-left corner of a card; rotate it for the other corners. */
  "corner-ornament": "/assets/shared/icons/corner-ornament.svg",
} as const;

export type SvgIconName = keyof typeof SVG_ICONS;

interface SvgIconProps {
  name: SvgIconName;
  size?: number;
  className?: string;
  /** Accessible name. Leave out for decoration (the icon is then hidden from screen readers). */
  label?: string;
}

/**
 * Draws an `.svg` file from `public/assets/shared/icons/` in the current text colour: the file is used as a CSS
 * mask over a `currentColor` background, so `className="text-amber-500"` recolours it.
 */
export function SvgIcon({ name, size = 24, className, label }: SvgIconProps) {
  const url = `url(${SVG_ICONS[name]})`;
  const style: CSSProperties = {
    width: size,
    height: size,
    maskImage: url,
    WebkitMaskImage: url,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskSize: "contain",
    WebkitMaskSize: "contain",
  };
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block shrink-0 bg-current", className)}
      style={style}
    />
  );
}
