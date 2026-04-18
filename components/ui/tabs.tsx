"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  options: { label: string; value: string }[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function Tabs({
  options,
  value,
  onValueChange,
  className
}: TabsProps): JSX.Element {
  return (
    <div
      className={cn(
        "grid grid-cols-2 rounded-2xl border border-border bg-surface p-1",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onValueChange(option.value)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-electricBlue text-white shadow-glow-light dark:shadow-glow"
                : "text-muted hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
