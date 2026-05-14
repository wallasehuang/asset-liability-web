import { format } from "date-fns";

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

type MonthParts = {
  year: number;
  month: number;
};

const MONTH_INPUT_PATTERN = /^(\d{4})-(\d{2})$/;

function padMonth(month: number) {
  return String(month).padStart(2, "0");
}

function getMonthParts(value: string | Date): MonthParts {
  if (value instanceof Date) {
    return {
      year: value.getUTCFullYear(),
      month: value.getUTCMonth() + 1,
    };
  }

  const monthMatch = MONTH_INPUT_PATTERN.exec(value);
  if (monthMatch) {
    const [, year, month] = monthMatch;
    return {
      year: Number(year),
      month: Number(month),
    };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`無法解析月份：${value}`);
  }

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

export function normalizeMonthInput(value: string) {
  const match = MONTH_INPUT_PATTERN.exec(value);
  if (!match) {
    throw new Error(`無效的月份格式：${value}`);
  }

  const [, year, month] = match;
  const normalizedMonth = Number(month);
  if (normalizedMonth < 1 || normalizedMonth > 12) {
    throw new Error(`無效的月份：${value}`);
  }

  return `${year}-${padMonth(normalizedMonth)}`;
}

export function formatMonthLabel(value: string | Date) {
  const { year, month } = getMonthParts(value);
  return `${year}.${padMonth(month)}`;
}

export function formatMonthLong(value: string | Date) {
  const { year, month } = getMonthParts(value);
  return `${year} 年 ${padMonth(month)} 月`;
}

export function toMonthInput(date: Date) {
  return format(date, "yyyy-MM");
}

export function monthInputToSnapshotDate(value: string) {
  const normalizedValue = normalizeMonthInput(value);
  const [year, month] = normalizedValue.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0, 0, 0, 0, 0));
}

export function monthInputToSnapshotRange(value: string) {
  const normalizedValue = normalizeMonthInput(value);
  const [year, month] = normalizedValue.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
  };
}

export function shiftMonthInput(value: string, offset: number) {
  const normalizedValue = normalizeMonthInput(value);
  const [year, month] = normalizedValue.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1, 0, 0, 0, 0));
  return `${shifted.getUTCFullYear()}-${padMonth(shifted.getUTCMonth() + 1)}`;
}

export function snapshotDateToMonthInput(value: string | Date) {
  const { year, month } = getMonthParts(value);
  return `${year}-${padMonth(month)}`;
}

export function snapshotDateToIso(date: Date) {
  return date.toISOString();
}

export function snapshotDateToDateOnly(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`無法解析日期：${value}`);
  }

  return `${date.getUTCFullYear()}-${padMonth(date.getUTCMonth() + 1)}-${String(date.getUTCDate()).padStart(2, "0")}`;
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
