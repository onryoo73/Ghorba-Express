"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-electricBlue text-white shadow-glow-light dark:shadow-glow hover:bg-[#3f8bff] active:scale-[0.98]",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-hover active:scale-[0.98]",
  ghost: "bg-transparent text-foreground hover:bg-surface active:scale-[0.98]"
};

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electricBlue disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
