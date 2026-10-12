import type { ComponentProps } from "react";

import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

// Primary and secondary buttons have a hand-cut edge (`rough-edge`). That mask would clip an
// outline, so keyboard focus is shown by inverting the colours and underlining the label.
const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-200 " +
  "focus-visible:underline focus-visible:outline-none " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "rough-edge bg-red-800 text-amber-50 hover:bg-amber-600 hover:text-stone-950 " +
    "focus-visible:bg-amber-600 focus-visible:text-stone-950",
  secondary:
    "rough-edge border-2 border-amber-600/70 bg-stone-900/60 text-amber-400 hover:bg-amber-600 " +
    "hover:text-stone-950 focus-visible:bg-amber-600 focus-visible:text-stone-950",
  ghost:
    "rounded-sm text-stone-300 hover:bg-white/10 hover:text-amber-300 " +
    "focus-visible:bg-white/10 focus-visible:text-amber-300",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/**
 * Class names of a button. Use it on links (`<a>`, `next/link`) so they look like buttons
 * without nesting a `<button>` inside an anchor.
 */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
