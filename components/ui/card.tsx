import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-glow-light dark:shadow-glow",
        className
      )}
      {...props}
    />
  );
}
