"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("design-pagination flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] pt-4", className)}>
      <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
        Page {currentPage} / {totalPages}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button tone="ghost" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          上一頁
        </Button>

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              aria-current={page === currentPage ? "page" : undefined}
              className={cn(
                "design-pagination-chip min-w-8 border px-2 py-1 text-[10px] font-semibold tracking-normal transition",
                page === currentPage
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bone)]"
                  : "border-[var(--color-line)] bg-transparent text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
              )}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>

        <Button tone="ghost" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          下一頁
        </Button>
      </div>
    </div>
  );
}
