"use client";

import type React from "react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateAmountTwd,
  formatCurrency,
  formatMonthLong,
  parseNumericInput,
  summarizeEntries,
} from "@/lib/finance";
import type { ItemRecord, SnapshotDetailRecord, SnapshotEntryRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type SnapshotEditorProps = {
  snapshot: SnapshotDetailRecord;
  items: ItemRecord[];
};

type EditableEntry = SnapshotEntryRecord;

export function SnapshotEditor({ snapshot, items }: SnapshotEditorProps) {
  const router = useRouter();
  const isReadonly = snapshot.status === "final";
  const [entries, setEntries] = useState<EditableEntry[]>(snapshot.entries);
  const [status, setStatus] = useState(snapshot.status);
  const [note, setNote] = useState(snapshot.note);
  const [usdFxRate, setUsdFxRate] = useState(String(snapshot.usdFxRate));
  const [message, setMessage] = useState("");
  const hasGlobalNote = note.trim().length > 0;

  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const fxRateNumber = parseNumericInput(usdFxRate, snapshot.usdFxRate || 31.5);

  const normalizedEntries = useMemo(
    () =>
      entries.map((entry) => {
        const fxRate = entry.currency === "USD" ? fxRateNumber : 1;
        return {
          ...entry,
          fxRate,
          amountTwd: calculateAmountTwd(parseNumericInput(entry.amountOriginal), fxRate),
        };
      }),
    [entries, fxRateNumber],
  );

  const totals = useMemo(
    () =>
      summarizeEntries(
        normalizedEntries.map((entry) => ({
          entryType: entry.entryType,
          amountTwd: entry.amountTwd,
        })),
      ),
    [normalizedEntries],
  );

  const groupedEntries = useMemo(
    () => ({
      asset: normalizedEntries.filter((entry) => entry.entryType === "asset"),
      liability: normalizedEntries.filter((entry) => entry.entryType === "liability"),
    }),
    [normalizedEntries],
  );

  const availableItemsByType = useMemo(
    () => ({
      asset: items.filter((item) => item.entryType === "asset" && !entries.some((entry) => entry.itemId === item.id)),
      liability: items.filter((item) => item.entryType === "liability" && !entries.some((entry) => entry.itemId === item.id)),
    }),
    [entries, items],
  );

  function patchEntry(itemId: string, updater: (entry: EditableEntry) => EditableEntry) {
    setEntries((current) => current.map((entry) => (entry.itemId === itemId ? updater(entry) : entry)));
  }

  function addEntry(entryType: "asset" | "liability", itemId: string) {
    if (!itemId) return;

    const item = itemMap.get(itemId);
    if (!item) return;

    setEntries((current) => [
      ...current,
      {
        itemId: item.id,
        categoryId: item.categoryId,
        entryType: item.entryType,
        categoryCode: item.categoryCode,
        categoryName: item.categoryName,
        itemName: item.name,
        institution: item.institution,
        currency: item.currency,
        amountOriginal: 0,
        fxRate: item.currency === "USD" ? fxRateNumber : 1,
        amountTwd: 0,
        sortOrder: current.length,
        note: "",
      },
    ]);
  }

  async function saveSnapshot() {
    if (isReadonly) {
      setMessage("定稿月結不可再編輯");
      return;
    }

    const payload = {
      status,
      note,
      usdFxRate: fxRateNumber,
      entries: normalizedEntries.map((entry) => ({
        id: entry.id,
        itemId: entry.itemId,
        amountOriginal: parseNumericInput(entry.amountOriginal),
        note: entry.note,
      })),
    };

    const response = await fetch(`/api/snapshots/${snapshot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setMessage(response.ok ? "月結已儲存" : (data.error ?? "儲存失敗"));
    if (response.ok) {
      router.refresh();
    }
  }

  const primaryActionLabel = status === "final" ? "儲存並定稿" : "儲存月結";

  return (
    <div className={cn("grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:pb-0", isReadonly ? "pb-4" : "pb-28")}>
      <aside className="order-first xl:order-last xl:sticky xl:top-6 xl:self-start">
        <div className="design-summary-panel design-panel grid gap-2.5 border border-[var(--color-line)] bg-[var(--color-bone)] p-5">
          <div className="design-divider border-b border-[var(--color-line)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Monthly summary</div>
            <h2 className="mt-1 font-display text-[24px] tracking-[0.05em]">本月總覽</h2>
          </div>
          <SummaryLine label="總資產" value={totals.totalAssets} />
          <SummaryLine label="總負債" value={totals.totalLiabilities} />
          <SummaryLine label="淨資產" value={totals.netWorth} strong />
          <div className="design-summary-note rounded-none border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-1.5 text-[12px] leading-6 text-[var(--color-muted)]">
            {isReadonly
              ? `這份月結已定稿，內容與本月匯率 ${snapshot.usdFxRate.toFixed(4)} 已鎖定，現在只能查看。`
              : `美元項目會統一使用本月 USD/TWD ${fxRateNumber.toFixed(4)}，不需要逐列輸入匯率。`}
          </div>
          {message ? <div className="text-[12px] text-[var(--color-muted)]">{message}</div> : null}
          {!isReadonly ? (
            <Button tone="primary" size="sm" className="hidden xl:inline-flex" onClick={() => startTransition(() => void saveSnapshot())}>
              {status === "final" ? "儲存並定稿" : "儲存本月月結"}
            </Button>
          ) : null}
        </div>
      </aside>

      <section className="grid gap-5">
        {isReadonly ? (
          <div className="design-panel section-box grid gap-2 border border-[var(--color-line)] bg-[var(--color-surface)] p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_120px_140px] lg:items-start">
            <StaticField
              label="Snapshot"
              value={
                <div className="font-display text-[28px] leading-none tracking-[0.04em] md:text-[32px]">
                  {formatMonthLong(new Date(snapshot.snapshotDate))}
                </div>
              }
              variant="plain"
            />
            <StaticField label="狀態" value="定稿" variant="plain" />
            <StaticField label="本月 USD/TWD" value={snapshot.usdFxRate.toFixed(4)} variant="plain" />
          </div>
        ) : (
          <div className="design-panel section-box grid gap-3 border border-[var(--color-line)] bg-[var(--color-surface)] p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_156px_132px_auto] lg:items-end">
            <div className="grid gap-1.5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Snapshot</div>
              <div className="font-display text-[27px] leading-none tracking-[0.04em] md:text-[31px]">
                {formatMonthLong(new Date(snapshot.snapshotDate))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">狀態</div>
              <Select value={status} onChange={(event) => setStatus(event.target.value as "draft" | "final")}>
                <option value="draft">草稿</option>
                <option value="final">定稿</option>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">本月 USD/TWD</div>
              <Input
                type="number"
                step="0.0001"
                value={usdFxRate}
                onChange={(event) => setUsdFxRate(event.target.value)}
                placeholder="USD/TWD"
              />
            </div>
            <Button tone="primary" size="sm" className="w-full self-end px-4 lg:w-auto" onClick={() => startTransition(() => void saveSnapshot())}>
              {primaryActionLabel}
            </Button>
            {status === "final" ? (
              <div className="lg:col-span-full text-[12px] leading-6 text-[var(--color-muted)]">
                儲存後這份月結會立即鎖定，之後不可再編輯、增刪項目或從列表刪除。
              </div>
            ) : null}
          </div>
        )}

        <EntrySection
          title="資產項目"
          entryType="asset"
          entries={groupedEntries.asset}
          availableItems={availableItemsByType.asset}
          onAdd={addEntry}
          onChange={patchEntry}
          onRemove={(itemId) => setEntries((current) => current.filter((entry) => entry.itemId !== itemId))}
          readonly={isReadonly}
          summary={isReadonly ? `${groupedEntries.asset.length} 筆已定稿項目` : `${groupedEntries.asset.length} 筆項目`}
        />

        <EntrySection
          title="負債項目"
          entryType="liability"
          entries={groupedEntries.liability}
          availableItems={availableItemsByType.liability}
          onAdd={addEntry}
          onChange={patchEntry}
          onRemove={(itemId) => setEntries((current) => current.filter((entry) => entry.itemId !== itemId))}
          readonly={isReadonly}
          summary={isReadonly ? `${groupedEntries.liability.length} 筆已定稿項目` : `${groupedEntries.liability.length} 筆項目`}
        />

        {!isReadonly || hasGlobalNote ? (
          <section className="design-panel section-box grid gap-2 border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">備註</div>
            {isReadonly ? (
              <div className="design-static-value design-static-value-plain whitespace-pre-wrap rounded-none border border-[var(--color-line)] bg-[var(--color-bone)] px-4 py-2 text-[14px] leading-7 text-[var(--color-ink)]">
                {note}
              </div>
            ) : (
              <Textarea
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="例如：本月有補款、資產移轉、信用卡尚未結帳等。"
              />
            )}
          </section>
        ) : null}
      </section>

      {!isReadonly ? (
        <div className="design-floating-bar fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-line)] bg-[var(--color-bone)] px-4 py-3 shadow-[0_-8px_20px_rgba(33,31,26,0.06)] xl:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">淨資產</div>
              <div className="truncate font-display text-[22px] tracking-[0.04em]">{formatCurrency(totals.netWorth)}</div>
            </div>
            <Button tone="primary" size="sm" className="min-w-[124px]" onClick={() => startTransition(() => void saveSnapshot())}>
              {status === "final" ? "儲存並定稿" : "儲存變更"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EntrySection({
  title,
  entryType,
  entries,
  availableItems,
  onAdd,
  onChange,
  onRemove,
  readonly,
  summary,
}: {
  title: string;
  entryType: "asset" | "liability";
  entries: EditableEntry[];
  availableItems: ItemRecord[];
  onAdd: (entryType: "asset" | "liability", itemId: string) => void;
  onChange: (itemId: string, updater: (entry: EditableEntry) => EditableEntry) => void;
  onRemove: (itemId: string) => void;
  readonly: boolean;
  summary?: string;
}) {
  const [draftItemId, setDraftItemId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState("");

  useEffect(() => {
    if (readonly) {
      setShowAddForm(false);
      setExpandedItemId("");
      return;
    }

    if (expandedItemId && !entries.some((entry) => entry.itemId === expandedItemId)) {
      setExpandedItemId("");
    }

    if (draftItemId && !availableItems.some((item) => item.id === draftItemId)) {
      setDraftItemId("");
    }
  }, [availableItems, draftItemId, entries, expandedItemId, readonly]);

  function handleAddEntry() {
    if (!draftItemId) return;
    onAdd(entryType, draftItemId);
    setExpandedItemId(draftItemId);
    setDraftItemId("");
    setShowAddForm(false);
  }

  function toggleEntry(itemId: string) {
    setExpandedItemId((current) => (current === itemId ? "" : itemId));
    setShowAddForm(false);
  }

  return (
    <section className="design-panel section-box grid gap-3 border border-[var(--color-line)] bg-[var(--color-surface)] p-4 md:p-5">
      <div className="design-divider grid gap-2.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Entries</div>
            <h2 className="mt-1 font-display text-[27px] leading-none tracking-[0.03em]">{title}</h2>
          </div>
          {summary ? <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{summary}</div> : null}
        </div>

        {readonly ? (
          <p className="max-w-2xl text-[12px] leading-6 text-[var(--color-muted)]">
            定稿後僅保留最終內容與台幣結果，不再提供新增、移除或調整。
          </p>
        ) : (
          <div className="grid gap-2">
            <div className="flex flex-wrap justify-end gap-4">
              <Button tone="ghost" className="px-0" onClick={() => setShowAddForm((current) => !current)}>
                {showAddForm ? "收合新增" : `新增${entryType === "asset" ? "資產" : "負債"}項目`}
              </Button>
            </div>
            {showAddForm ? (
              <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
                <Select value={draftItemId} onChange={(event) => setDraftItemId(event.target.value)}>
                  <option value="">選擇要加入的{entryType === "asset" ? "資產" : "負債"}項目</option>
                  {availableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.categoryName} / {item.name}
                    </option>
                  ))}
                </Select>
                <Button tone="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  收合
                </Button>
                <Button tone="primary" size="sm" onClick={handleAddEntry} disabled={!draftItemId}>
                  加入項目
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="design-panel border border-dashed border-[var(--color-line)] bg-[var(--color-bone)] px-4 py-6 text-sm leading-6 text-[var(--color-muted)]">
          {readonly
            ? `這個月份目前沒有${entryType === "asset" ? "資產" : "負債"}項目。`
            : `目前還沒有${entryType === "asset" ? "資產" : "負債"}項目，從上方選擇主檔後加入即可。`}
        </div>
      ) : (
        <div className={cn("grid", readonly ? "gap-2.5" : "gap-2")}>
          {entries.map((entry) => (
            <EntryCard
              key={entry.id ?? entry.itemId}
              entry={entry}
              onChange={onChange}
              onRemove={onRemove}
              readonly={readonly}
              isExpanded={expandedItemId === entry.itemId}
              onToggle={() => toggleEntry(entry.itemId)}
              onCollapse={() => setExpandedItemId("")}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EntryCard({
  entry,
  onChange,
  onRemove,
  readonly,
  isExpanded,
  onToggle,
  onCollapse,
}: {
  entry: EditableEntry;
  onChange: (itemId: string, updater: (entry: EditableEntry) => EditableEntry) => void;
  onRemove: (itemId: string) => void;
  readonly: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onCollapse: () => void;
}) {
  const hasEntryNote = entry.note.trim().length > 0;
  const secondaryMeta = [entry.institution || "未設定機構", entry.currency];

  if (entry.currency === "USD") {
    secondaryMeta.push(`USD ${entry.amountOriginal.toFixed(2)}`);
  }

  return (
    <article className={cn("design-entry-card bg-[var(--color-bone)] px-4 py-3", readonly ? "grid gap-1.5" : "grid gap-2")}>
      {readonly ? (
        <>
          <div className="grid gap-1 md:grid-cols-[minmax(0,1fr)_200px] md:items-start">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">{entry.categoryName}</div>
              <div className="mt-0.5 break-words text-[16px] font-semibold leading-[1.2] text-[var(--color-ink)] md:text-[18px]">
                {entry.itemName}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] leading-5 text-[var(--color-muted)]">
                {secondaryMeta.map((meta) => (
                  <span key={meta}>{meta}</span>
                ))}
              </div>
              {hasEntryNote ? <div className="mt-1 text-[12px] leading-5 text-[var(--color-muted)]">{entry.note}</div> : null}
            </div>
            <div className="grid gap-0.5 text-left md:text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">最終台幣金額</div>
              <div className="font-display text-[18px] tracking-[0.04em] text-[var(--color-ink)]">{formatCurrency(entry.amountTwd)}</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <button type="button" onClick={onToggle} className="grid w-full gap-1 text-left transition hover:text-[var(--color-ink)]">
            <div className="grid gap-1 md:grid-cols-[minmax(0,1fr)_200px] md:items-start">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">{entry.categoryName}</div>
                <div className="mt-0.5 break-words text-[16px] font-semibold leading-[1.2] text-[var(--color-ink)] md:text-[18px]">
                  {entry.itemName}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] leading-5 text-[var(--color-muted)]">
                  {secondaryMeta.map((meta) => (
                    <span key={meta}>{meta}</span>
                  ))}
                  {entry.currency === "USD" ? <span>本月匯率 {entry.fxRate.toFixed(4)}</span> : null}
                </div>
              </div>
              <div className="grid gap-0.5 text-left md:text-right">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{isExpanded ? "編輯中" : "點擊編輯"}</div>
                <div className="font-display text-[18px] tracking-[0.04em] text-[var(--color-ink)]">{formatCurrency(entry.amountTwd)}</div>
              </div>
            </div>
          </button>

          {isExpanded ? (
            <div className="grid gap-2.5 pt-1">
              <div className="grid gap-2.5 lg:grid-cols-[160px_minmax(0,1fr)] lg:items-start">
                <div className="grid gap-1.5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">原幣金額</div>
                  <Input
                    type="number"
                    step="0.01"
                    value={String(entry.amountOriginal)}
                    onChange={(event) =>
                      onChange(entry.itemId, (current) => ({
                        ...current,
                        amountOriginal: parseNumericInput(event.target.value),
                      }))
                    }
                  />
                </div>

                <div className="grid gap-1.5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">備註</div>
                  <Textarea
                    rows={3}
                    value={entry.note}
                    onChange={(event) =>
                      onChange(entry.itemId, (current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="補充這筆資料背景"
                    className="min-h-[72px] resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 transition hover:text-[var(--color-ink)]"
                  onClick={() => onRemove(entry.itemId)}
                >
                  <X size={12} />
                  移除
                </button>
                <Button tone="ghost" className="px-0" onClick={onCollapse}>
                  收合
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}

function StaticField({
  label,
  value,
  className,
  variant = "panel",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  variant?: "panel" | "plain";
}) {
  return (
    <div
      className={cn(
        "design-static-value grid rounded-none",
        variant === "panel"
          ? "gap-1.5 border border-[var(--color-line)] bg-[var(--color-bone)] px-4 py-3"
          : "design-static-value-plain gap-1 px-0 py-0",
        className,
      )}
    >
      <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">{label}</div>
      <div className="text-[14px] leading-6 text-[var(--color-ink)]">{value}</div>
    </div>
  );
}

function SummaryLine({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={strong ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]"}>{label}</span>
      <span className={strong ? "font-display text-[21px] tracking-[0.04em]" : "font-display text-[17px] tracking-[0.04em]"}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
