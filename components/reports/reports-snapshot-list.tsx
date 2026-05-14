"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatCurrency, formatMonthLong } from "@/lib/finance";
import type { SnapshotRecord } from "@/lib/types";

const PAGE_SIZE = 8;

type ReportsSnapshotListProps = {
  snapshots: SnapshotRecord[];
  latestSnapshotId: string | null;
};

export function ReportsSnapshotList({ snapshots, latestSnapshotId }: ReportsSnapshotListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(snapshots.length / PAGE_SIZE));

  const pagedSnapshots = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return snapshots.slice(start, start + PAGE_SIZE);
  }, [currentPage, snapshots]);

  return (
    <div className="grid gap-4">
      {pagedSnapshots.map((snapshot) => (
        <div key={snapshot.id} className="design-list-card grid gap-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] p-4 md:grid-cols-[1fr_auto] md:items-start">
          <div className="grid gap-2">
            <div className="text-[15px] font-semibold">{formatMonthLong(snapshot.snapshotDate)}</div>
            <div className="text-[12px] text-[var(--color-muted)]">
              淨資產 {formatCurrency(snapshot.netWorth)} / 總資產 {formatCurrency(snapshot.totalAssets)} / 總負債 {formatCurrency(snapshot.totalLiabilities)}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:pt-1">
            <Link href={`/snapshots/${snapshot.id}`}>
              <Button tone="ghost" size="sm">查看月結</Button>
            </Link>
            <a href={`/api/reports/export/snapshot/${snapshot.id}`}>
              <Button tone={snapshot.id === latestSnapshotId ? "secondary" : "ghost"} size="sm">匯出 CSV</Button>
            </a>
          </div>
        </div>
      ))}

      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
