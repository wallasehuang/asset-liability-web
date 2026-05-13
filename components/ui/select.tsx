"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="ui-select-wrap relative w-full">
        <select
          ref={ref}
          className={cn(
            "ui-select min-h-10 w-full appearance-none border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 pr-10 text-[14px] text-[var(--color-ink)] outline-none transition focus:border-[var(--color-ink)] focus:bg-[var(--color-bone)]",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        />
      </div>
    );
  },
);

Select.displayName = "Select";
