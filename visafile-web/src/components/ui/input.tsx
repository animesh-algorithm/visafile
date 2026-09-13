import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-13 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-base text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus)] disabled:bg-[var(--surface-soft)]",
        className,
      )}
      {...props}
    />
  );
}
