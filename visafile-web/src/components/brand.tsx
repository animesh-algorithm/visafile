import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 font-extrabold tracking-[-.03em]",
        light && "text-white",
      )}
      aria-label="VisaFile home"
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl bg-[var(--primary)] text-white",
          light && "bg-white text-[var(--primary)]",
        )}
      >
        <FileCheck2 className="size-5" aria-hidden="true" />
      </span>
      {!compact && <span className="text-xl">VisaFile</span>}
    </Link>
  );
}
