import type { ComponentProps } from "react";

import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-300 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-red-800 text-amber-50 hover:-translate-y-0.5 hover:bg-amber-600 " +
    "hover:text-stone-950 active:translate-y-0",
  secondary:
    "border border-amber-500/50 bg-stone-900/60 text-amber-400 " +
    "hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-600 hover:text-stone-950 active:translate-y-0",
  ghost: "text-stone-300 hover:bg-white/10 hover:text-amber-300",
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
