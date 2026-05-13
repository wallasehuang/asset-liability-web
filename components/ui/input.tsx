"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "ui-input min-h-10 w-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[14px] text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-ink)] focus:bg-[var(--color-bone)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
