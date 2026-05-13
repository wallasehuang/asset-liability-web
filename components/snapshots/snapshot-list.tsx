"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatMonthLong, parseNumericInput, toMonthInput } from "@/lib/finance";
import type { SnapshotRecord } from "@/lib/types";

type SnapshotListProps = {
  snapshots: SnapshotRecord[];
};

const PAGE_SIZE = 8;

export function SnapshotList({ snapshots: initialSnapshots }: SnapshotListProps) {
  const router = useRouter();
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [message, setMessage] = useState("");
  const [month, setMonth] = useState(toMonthInput(new Date()));
  const [sourceSnapshotId, setSourceSnapshotId] = useState("");
  const [usdFxRate, setUsdFxRate] = useState(
    initialSnapshots[0]?.usdFxRate ? String(initialSnapshots[0].usdFxRate) : "31.5",
  );
  const [currentPage, setCurrentPage] = useState(1);

  const snapshotOptions = useMemo(
    () =>
      snapshots.map((snapshot) => ({
        id: snapshot.id,
        label: formatMonthLong(new Date(snapshot.snapshotDate)),
        usdFxRate: snapshot.usdFxRate,
      })),
    [snapshots],
  );

  const totalPages = Math.max(1, Math.ceil(snapshots.length / PAGE_SIZE));
  const pagedSnapshots = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return snapshots.slice(start, start + PAGE_SIZE);
  }, [currentPage, snapshots]);

  async function createSnapshot() {
    const response = await fetch("/api/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month,
        sourceSnapshotId: sourceSnapshotId || undefined,
        usdFxRate: parseNumericInput(usdFxRate, initialSnapshots[0]?.usdFxRate ?? 31.5),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "建立月結失敗");
      return;
    }

    router.push(`/snapshots/${data.snapshot.id}`);
  }

  async function removeSnapshot(id: string) {
    const response = await fetch(`/api/snapshots/${id}`, { method: "DELETE" });
    const data = await response.json();
    setMessage(response.ok ? "草稿月結已刪除" : (data.error ?? "刪除失敗"));
    if (response.ok) {
      setSnapshots(data.snapshots);
      setCurrentPage((page) => Math.min(page, Math.max(1, Math.ceil(data.snapshots.length / PAGE_SIZE))));
    }
  }

  function handleTemplateChange(value: string) {
    setSourceSnapshotId(value);
    const selected = snapshotOptions.find((snapshot) => snapshot.id === value);
    if (selected) {
      setUsdFxRate(String(selected.usdFxRate));
    }
  }

  return (
    <div className="grid gap-6">
      <section className="design-panel section-box grid gap-4 border border-[var(--color-line)] bg-[var(--color-surface)] p-4 md:p-5">
        <div className="grid gap-2">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Create snapshot</div>
          <h2 className="font-display text-[26px] tracking-[0.05em]">建立新月份</h2>
          <p className="text-[12px] leading-6 text-[var(--color-muted)]">
            預設會沿用最新月結或複製來源月結的 `USD/TWD` 匯率，之後在這個月份內的所有美元項目都會自動套用。
          </p>
        </div>

        <div className="grid items-end gap-3 lg:grid-cols-[180px_minmax(0,1fr)_140px_auto]">
          <div className="grid gap-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">月份</div>
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">複製範本</div>
            <Select value={sourceSnapshotId} onChange={(event) => handleTemplateChange(event.target.value)}>
              <option value="">空白月結</option>
              {snapshotOptions.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  複製 {snapshot.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">本月匯率</div>
            <Input
              type="number"
              step="0.0001"
              value={usdFxRate}
              onChange={(event) => setUsdFxRate(event.target.value)}
              placeholder="USD/TWD"
            />
          </div>
          <Button
            size="sm"
            className="w-full self-end px-5 lg:w-auto"
            onClick={() => startTransition(() => void createSnapshot())}
          >
            新增月結
          </Button>
        </div>
      </section>

      {message ? <div className="text-[12px] text-[var(--color-muted)]">{message}</div> : null}
      <section className="grid gap-5">
        {pagedSnapshots.map((snapshot) => (
          <article key={snapshot.id} className="design-list-card grid gap-3 border border-[var(--color-line)] bg-[var(--color-bone)] p-5 lg:grid-cols-[minmax(0,1fr)_220px_144px] lg:items-start">
            <div className="grid gap-2">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                {snapshot.status === "draft" ? "草稿" : "定稿"}
              </div>
              <div className="font-display text-[28px] leading-none tracking-[0.05em] md:text-[30px]">
                {formatMonthLong(new Date(snapshot.snapshotDate))}
              </div>
              <div className="text-[12px] leading-6 text-[var(--color-muted)]">
                標準匯率 USD/TWD {snapshot.usdFxRate.toFixed(4)}
                <br />
                {snapshot.note || "尚無備註"}
              </div>
            </div>

            <div className="grid gap-1 text-[12px] leading-6 text-[var(--color-muted)] lg:pt-7">
              <div>總資產 {formatCurrency(snapshot.totalAssets)}</div>
              <div>總負債 {formatCurrency(snapshot.totalLiabilities)}</div>
              <div>淨資產 {formatCurrency(snapshot.netWorth)}</div>
              <div>{snapshot.entryCount} 筆項目</div>
            </div>

            <div className="grid gap-2 lg:justify-items-end lg:pt-7">
              <Link href={`/snapshots/${snapshot.id}`}>
                <Button tone="ghost" size="sm">{snapshot.status === "draft" ? "編輯月結" : "查看月結"}</Button>
              </Link>
              {snapshot.status === "draft" ? (
                <Button tone="danger" size="sm" onClick={() => startTransition(() => void removeSnapshot(snapshot.id))}>
                  刪除
                </Button>
              ) : (
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">定稿不可刪除</div>
              )}
            </div>
          </article>
        ))}

        <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </section>
    </div>
  );
}
