"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

export function Tooltip({
  children,
  content,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={8}
            className="z-50 max-w-64 rounded-xl bg-[var(--ink)] px-3 py-2 text-xs leading-relaxed text-white shadow-lg"
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-[var(--ink)]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
