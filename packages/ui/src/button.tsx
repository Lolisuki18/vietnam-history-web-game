import type { ComponentProps } from "react";

import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-red-700 text-amber-50 hover:bg-red-800 focus-visible:outline-red-700",
  secondary:
    "border border-stone-300 bg-white text-stone-900 hover:bg-stone-100 focus-visible:outline-stone-500",
  ghost: "text-stone-700 hover:bg-stone-200/60 focus-visible:outline-stone-500",
};

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
