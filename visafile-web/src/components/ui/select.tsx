import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-13 w-full appearance-none rounded-2xl border border-[var(--border)] bg-white px-4 pr-11 text-base text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus)]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
      />
    </div>
  );
}
