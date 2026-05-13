"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

const tones: Record<NonNullable<ButtonProps["tone"]>, string> = {
  primary:
    "border border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bone)] hover:bg-transparent hover:text-[var(--color-ink)]",
  secondary:
    "border border-[var(--color-line)] bg-[var(--color-bone)] text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)]",
  ghost:
    "border border-[var(--color-line)] bg-transparent text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
  danger:
    "border border-[var(--color-alert)] bg-transparent text-[var(--color-alert-ink)] hover:bg-[var(--color-alert-soft)]",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-8 px-3 py-1 text-[10px]",
  md: "min-h-9 px-4 py-1.5 text-[11px]",
};

export function Button({ className, tone = "primary", size = "md", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "ui-button inline-flex items-center justify-center gap-2 rounded-none whitespace-nowrap text-center font-semibold leading-tight tracking-normal transition disabled:cursor-not-allowed disabled:opacity-45",
        tones[tone],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
