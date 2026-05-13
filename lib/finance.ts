import { endOfMonth, format, parse } from "date-fns";

export type FinanceRow = {
  entryType: "asset" | "liability";
  amountTwd: number;
};

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateAmountTwd(amountOriginal: number, fxRate: number) {
  return roundCurrency(amountOriginal * fxRate);
}

export function summarizeEntries(entries: FinanceRow[]) {
  const totalAssets = roundCurrency(
    entries.filter((entry) => entry.entryType === "asset").reduce((sum, entry) => sum + entry.amountTwd, 0),
  );
  const totalLiabilities = roundCurrency(
    entries
      .filter((entry) => entry.entryType === "liability")
      .reduce((sum, entry) => sum + entry.amountTwd, 0),
  );
  const netWorth = roundCurrency(totalAssets - totalLiabilities);

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
  };
}

export function formatCurrency(value: number, currency = "TWD") {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatMonthLabel(date: Date) {
  return format(date, "yyyy.MM");
}

export function formatMonthLong(date: Date) {
  return format(date, "yyyy 年 MM 月");
}

export function toMonthInput(date: Date) {
  return format(date, "yyyy-MM");
}

export function monthInputToSnapshotDate(value: string) {
  return endOfMonth(parse(`${value}-01`, "yyyy-MM-dd", new Date()));
}

export function snapshotDateToIso(date: Date) {
  return date.toISOString();
}

export function parseNumericInput(value: string | number | null | undefined, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (!value) {
    return fallback;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

export function getVariance(current: number, previous: number) {
  return roundCurrency(current - previous);
}
