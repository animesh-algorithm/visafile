import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition-[background,color,transform,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus)] disabled:pointer-events-none disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--primary)] text-white shadow-[0_5px_0_var(--primary-deep)] hover:bg-[var(--primary-hover)]",
        secondary:
          "bg-white text-[var(--ink)] ring-1 ring-inset ring-[var(--border)] hover:bg-[var(--surface-soft)]",
        ghost: "text-[var(--ink)] hover:bg-black/5",
        light: "bg-white text-[var(--primary-deep)] hover:bg-[var(--cream)]",
      },
      size: {
        default: "h-12",
        sm: "min-h-10 px-4",
        lg: "min-h-14 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
