import { snapshotDateToDateOnly } from "@/lib/finance";
import type { SnapshotDetailRecord } from "@/lib/types";

function escapeCell(value: string | number) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

export function buildSnapshotCsv(snapshot: SnapshotDetailRecord) {
  const header = [
    "month_end",
    "type",
    "category_code",
    "category_name",
    "item_name",
    "institution",
    "currency",
    "amount_original",
    "fx_rate",
    "amount_twd",
    "note",
  ];

  const rows = snapshot.entries.map((entry) => [
    snapshotDateToDateOnly(snapshot.snapshotDate),
    entry.entryType,
    entry.categoryCode,
    entry.categoryName,
    entry.itemName,
    entry.institution,
    entry.currency,
    entry.amountOriginal,
    entry.fxRate,
    entry.amountTwd,
    entry.note,
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell)).join(","))
    .join("\n");
}
