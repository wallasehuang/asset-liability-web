import { Prisma, SnapshotStatus } from "@prisma/client";

import { buildSnapshotCsv } from "@/lib/csv";
import {
  calculateAmountTwd,
  formatMonthLabel,
  getVariance,
  monthInputToSnapshotDate,
  monthInputToSnapshotRange,
  shiftMonthInput,
  snapshotDateToMonthInput,
  summarizeEntries,
  toMonthInput,
} from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import type {
  CategoryRecord,
  DashboardSummary,
  MasterDataRecord,
  ItemRecord,
  SnapshotDetailRecord,
  SnapshotEntryRecord,
  SnapshotRecord,
} from "@/lib/types";

const categoryInclude = {
  category: true,
} satisfies Prisma.ItemInclude;

type SnapshotLookupClient = Pick<typeof prisma, "snapshot">;

function decimalToNumber(value: number | string | null | undefined) {
  if (value == null) return 0;
  return Number(value);
}

function mapCategory(category: {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability";
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CategoryRecord {
  return {
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function mapItem(item: Prisma.ItemGetPayload<{ include: typeof categoryInclude }>): ItemRecord {
  return {
    id: item.id,
    categoryId: item.categoryId,
    categoryCode: item.category.code,
    categoryName: item.category.name,
    entryType: item.category.type,
    name: item.name,
    institution: item.institution ?? "",
    currency: item.currency,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    note: item.note ?? "",
  };
}

function mapEntry(entry: Prisma.SnapshotEntryGetPayload<Record<string, never>>): SnapshotEntryRecord {
  return {
    id: entry.id,
    itemId: entry.itemId ?? "",
    categoryId: entry.categoryId,
    entryType: entry.entryType,
    categoryCode: entry.categoryCode,
    categoryName: entry.categoryName,
    itemName: entry.itemName,
    institution: entry.institution ?? "",
    currency: entry.currency,
    amountOriginal: decimalToNumber(entry.amountOriginal),
    fxRate: decimalToNumber(entry.fxRate),
    amountTwd: decimalToNumber(entry.amountTwd),
    sortOrder: entry.sortOrder,
    note: entry.note ?? "",
  };
}

function mapSnapshot(summary: {
  id: string;
  snapshotDate: Date;
  status: SnapshotStatus;
  usdFxRate: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  entries: Array<{ entryType: "asset" | "liability"; amountTwd: number }>;
}): SnapshotRecord {
  const totals = summarizeEntries(
    summary.entries.map((entry) => ({
      entryType: entry.entryType,
      amountTwd: decimalToNumber(entry.amountTwd),
    })),
  );

  return {
    id: summary.id,
    snapshotDate: summary.snapshotDate.toISOString(),
    status: summary.status,
    usdFxRate: summary.usdFxRate,
    note: summary.note ?? "",
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString(),
    entryCount: summary.entries.length,
    totalAssets: totals.totalAssets,
    totalLiabilities: totals.totalLiabilities,
    netWorth: totals.netWorth,
  };
}

export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map(mapCategory);
}

export async function getItems() {
  const items = await prisma.item.findMany({
    include: categoryInclude,
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return items.map(mapItem);
}

export async function getMasterData(): Promise<MasterDataRecord> {
  const [categories, items] = await Promise.all([
    prisma.category.findMany({
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.item.findMany({
      include: categoryInclude,
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return {
    categories: categories.map((category) => ({
      ...mapCategory(category),
      itemCount: category._count.items,
    })),
    items: items.map(mapItem),
  };
}

export async function getActiveItems() {
  const items = await prisma.item.findMany({
    where: { isActive: true, category: { isActive: true } },
    include: categoryInclude,
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return items.map(mapItem);
}

export async function getSnapshots() {
  const snapshots = await prisma.snapshot.findMany({
    orderBy: { snapshotDate: "desc" },
    include: {
      entries: {
        select: {
          entryType: true,
          amountTwd: true,
        },
      },
    },
  });

  return snapshots.map(mapSnapshot);
}

export async function getSnapshotDetail(snapshotId: string): Promise<SnapshotDetailRecord | null> {
  const snapshot = await prisma.snapshot.findUnique({
    where: { id: snapshotId },
    include: {
      entries: {
        orderBy: [{ entryType: "asc" }, { sortOrder: "asc" }, { itemName: "asc" }],
      },
    },
  });

  if (!snapshot) return null;

  return {
    id: snapshot.id,
    snapshotDate: snapshot.snapshotDate.toISOString(),
    status: snapshot.status,
    usdFxRate: snapshot.usdFxRate,
    note: snapshot.note ?? "",
    entries: snapshot.entries.map(mapEntry),
  };
}

export async function getSnapshotEditorData(snapshotId: string) {
  const [snapshot, categories, items] = await Promise.all([
    getSnapshotDetail(snapshotId),
    getCategories(),
    getActiveItems(),
  ]);

  const snapshotItems = snapshot?.entries
    .filter((entry) => entry.itemId && !items.some((item) => item.id === entry.itemId))
    .map((entry) => ({
      id: entry.itemId,
      categoryId: entry.categoryId ?? "",
      categoryCode: entry.categoryCode,
      categoryName: entry.categoryName,
      entryType: entry.entryType,
      name: entry.itemName,
      institution: entry.institution,
      currency: entry.currency,
      sortOrder: entry.sortOrder,
      isActive: false,
      note: entry.note,
    })) ?? [];

  return {
    snapshot,
    categories,
    items: [...items, ...snapshotItems],
  };
}

export async function assertSnapshotEditable(snapshotId: string, client: SnapshotLookupClient = prisma) {
  const snapshot = await client.snapshot.findUnique({
    where: { id: snapshotId },
    select: { id: true, status: true },
  });

  if (!snapshot) {
    throw new Error("找不到指定月結。");
  }

  if (snapshot.status === SnapshotStatus.final) {
    throw new Error("定稿月結不可再編輯或刪除。");
  }

  return snapshot;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const snapshots = await getSnapshots();
  const latestSnapshot = snapshots[0] ?? null;
  const previousSnapshot = snapshots[1] ?? null;
  const monthChange = latestSnapshot && previousSnapshot ? getVariance(latestSnapshot.netWorth, previousSnapshot.netWorth) : 0;

  const trendSnapshots = snapshots.slice(0, 12).reverse();

  let assetBreakdown: Array<{ name: string; value: number }> = [];
  let liabilityBreakdown: Array<{ name: string; value: number }> = [];

  if (latestSnapshot) {
    const detail = await getSnapshotDetail(latestSnapshot.id);
    if (detail) {
      const grouped = detail.entries.reduce<Record<string, number>>((accumulator, entry) => {
        const key = `${entry.entryType}:${entry.categoryName}`;
        accumulator[key] = (accumulator[key] ?? 0) + entry.amountTwd;
        return accumulator;
      }, {});

      assetBreakdown = Object.entries(grouped)
        .filter(([key]) => key.startsWith("asset:"))
        .map(([key, value]) => ({ name: key.split(":")[1], value }));

      liabilityBreakdown = Object.entries(grouped)
        .filter(([key]) => key.startsWith("liability:"))
        .map(([key, value]) => ({ name: key.split(":")[1], value }));
    }
  }

  return {
    latestSnapshot,
    previousSnapshot,
    monthChange,
    trend: trendSnapshots.map((snapshot) => ({
      label: formatMonthLabel(snapshot.snapshotDate),
      date: snapshot.snapshotDate,
      totalAssets: snapshot.totalAssets,
      totalLiabilities: snapshot.totalLiabilities,
      netWorth: snapshot.netWorth,
    })),
    assetBreakdown,
    liabilityBreakdown,
  };
}

export async function getReportsSummary() {
  const snapshots = await getSnapshots();
  const latestSnapshot = snapshots[0] ?? null;
  const latestDetail = latestSnapshot ? await getSnapshotDetail(latestSnapshot.id) : null;

  const categoryBreakdown =
    latestDetail?.entries.reduce<Array<{ name: string; type: "asset" | "liability"; total: number }>>((accumulator, entry) => {
      const existing = accumulator.find((item) => item.name === entry.categoryName && item.type === entry.entryType);
      if (existing) {
        existing.total += entry.amountTwd;
        return accumulator;
      }

      accumulator.push({
        name: entry.categoryName,
        type: entry.entryType,
        total: entry.amountTwd,
      });
      return accumulator;
    }, []) ?? [];

  return {
    snapshots,
    latestSnapshotId: latestSnapshot?.id ?? null,
    categoryBreakdown,
  };
}

export async function createSnapshot(month: string, sourceSnapshotId?: string | null, note?: string, usdFxRate?: number) {
  const snapshotDate = monthInputToSnapshotDate(month);
  const snapshotRange = monthInputToSnapshotRange(month);

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.snapshot.findFirst({
      where: {
        snapshotDate: {
          gte: snapshotRange.start,
          lt: snapshotRange.end,
        },
      },
    });

    if (existing) {
      throw new Error("該月份已存在月結。");
    }

    const source = sourceSnapshotId
      ? await transaction.snapshot.findUnique({
          where: { id: sourceSnapshotId },
          include: {
            entries: true,
          },
        })
      : null;

    const latestSnapshot = !source
      ? await transaction.snapshot.findFirst({
          orderBy: { snapshotDate: "desc" },
          select: { usdFxRate: true },
        })
      : null;

    const resolvedUsdFxRate = usdFxRate ?? source?.usdFxRate ?? latestSnapshot?.usdFxRate ?? 31.5;

    const snapshot = await transaction.snapshot.create({
      data: {
        snapshotDate,
        usdFxRate: resolvedUsdFxRate,
        note: note || "",
      },
    });

    if (source) {
      await transaction.snapshotEntry.createMany({
        data: source.entries.map((entry) => {
          const fxRate = entry.currency === "USD" ? resolvedUsdFxRate : 1;
          return {
            snapshotId: snapshot.id,
            itemId: entry.itemId,
            categoryId: entry.categoryId,
            entryType: entry.entryType,
            categoryCode: entry.categoryCode,
            categoryName: entry.categoryName,
            itemName: entry.itemName,
            institution: entry.institution,
            currency: entry.currency,
            amountOriginal: entry.amountOriginal,
            fxRate,
            amountTwd: calculateAmountTwd(Number(entry.amountOriginal), fxRate),
            sortOrder: entry.sortOrder,
            note: entry.note,
          };
        }),
      });
    }

    return snapshot;
  });
}

export async function updateSnapshot(
  snapshotId: string,
      input: {
        status: SnapshotStatus;
        usdFxRate: number;
        note?: string;
        entries: Array<{
          id?: string;
          itemId: string;
          amountOriginal: number;
          note?: string;
        }>;
      },
) {
  return prisma.$transaction(async (transaction) => {
    const snapshot = await transaction.snapshot.findUnique({
      where: { id: snapshotId },
      include: { entries: true },
    });

    if (!snapshot) {
      throw new Error("找不到指定月結。");
    }

    if (snapshot.status === SnapshotStatus.final) {
      throw new Error("定稿月結不可再編輯。");
    }

    const itemIds = input.entries.filter((entry) => !entry.id).map((entry) => entry.itemId);
    const items = await transaction.item.findMany({
      where: { id: { in: itemIds } },
      include: categoryInclude,
    });

    const itemMap = new Map(items.map((item) => [item.id, item]));
    const existingEntryMap = new Map(snapshot.entries.map((entry) => [entry.id, entry]));

    const existingIds = new Set(snapshot.entries.map((entry) => entry.id));
    const incomingIds = new Set(input.entries.map((entry) => entry.id).filter(Boolean) as string[]);
    const deleteIds = [...existingIds].filter((entryId) => !incomingIds.has(entryId));

    if (deleteIds.length > 0) {
      await transaction.snapshotEntry.deleteMany({
        where: { id: { in: deleteIds } },
      });
    }

    for (const [index, entry] of input.entries.entries()) {
      if (entry.id) {
        const existingEntry = existingEntryMap.get(entry.id);
        if (!existingEntry) {
          throw new Error("月結資料包含不存在的快照項目。");
        }

        const fxRate = existingEntry.currency === "TWD" ? 1 : input.usdFxRate;
        await transaction.snapshotEntry.update({
          where: { id: entry.id },
          data: {
            snapshotId,
            itemId: existingEntry.itemId,
            categoryId: existingEntry.categoryId,
            entryType: existingEntry.entryType,
            categoryCode: existingEntry.categoryCode,
            categoryName: existingEntry.categoryName,
            itemName: existingEntry.itemName,
            institution: existingEntry.institution ?? "",
            currency: existingEntry.currency,
            amountOriginal: entry.amountOriginal,
            fxRate,
            amountTwd: calculateAmountTwd(entry.amountOriginal, fxRate),
            sortOrder: index,
            note: entry.note || "",
          },
        });
      } else {
        const item = itemMap.get(entry.itemId);
        if (!item) {
          throw new Error("月結資料包含不存在的項目。");
        }

        const fxRate = item.currency === "TWD" ? 1 : input.usdFxRate;
        await transaction.snapshotEntry.create({
          data: {
            snapshotId,
            itemId: item.id,
            categoryId: item.categoryId,
            entryType: item.category.type,
            categoryCode: item.category.code,
            categoryName: item.category.name,
            itemName: item.name,
            institution: item.institution ?? "",
            currency: item.currency,
            amountOriginal: entry.amountOriginal,
            fxRate,
            amountTwd: calculateAmountTwd(entry.amountOriginal, fxRate),
            sortOrder: index,
            note: entry.note || "",
          },
        });
      }
    }

    await transaction.snapshot.update({
      where: { id: snapshotId },
      data: {
        usdFxRate: input.usdFxRate,
        note: input.note || "",
        status: input.status,
      },
    });
  });
}

export async function deleteSnapshot(snapshotId: string) {
  await assertSnapshotEditable(snapshotId);

  await prisma.snapshot.delete({
    where: { id: snapshotId },
  });
}

export async function exportSnapshotCsv(snapshotId: string) {
  const snapshot = await getSnapshotDetail(snapshotId);
  if (!snapshot) {
    throw new Error("找不到指定月結。");
  }
  return buildSnapshotCsv(snapshot);
}

export async function getNetWorthTrend() {
  const snapshots = await getSnapshots();
  return snapshots
    .slice(0, 12)
    .reverse()
    .map((snapshot) => ({
      label: formatMonthLabel(snapshot.snapshotDate),
      totalAssets: snapshot.totalAssets,
      totalLiabilities: snapshot.totalLiabilities,
      netWorth: snapshot.netWorth,
    }));
}

export async function getCategoryBreakdown(snapshotId: string) {
  const snapshot = await getSnapshotDetail(snapshotId);
  if (!snapshot) {
    throw new Error("找不到指定月結。");
  }

  return snapshot.entries.reduce<Array<{ type: "asset" | "liability"; name: string; total: number }>>((accumulator, entry) => {
    const existing = accumulator.find((item) => item.type === entry.entryType && item.name === entry.categoryName);
    if (existing) {
      existing.total += entry.amountTwd;
      return accumulator;
    }

    accumulator.push({
      type: entry.entryType,
      name: entry.categoryName,
      total: entry.amountTwd,
    });
    return accumulator;
  }, []);
}

export async function getDashboardMonthOptions() {
  const latest = await prisma.snapshot.findFirst({
    orderBy: { snapshotDate: "desc" },
    select: { snapshotDate: true },
  });

  const anchorMonth = latest ? snapshotDateToMonthInput(latest.snapshotDate) : toMonthInput(new Date());
  return [0, 1, 2, 3, 4, 5].map((offset) => {
    const month = shiftMonthInput(anchorMonth, -offset);
    const date = monthInputToSnapshotDate(month);
    return {
      label: formatMonthLabel(month),
      value: date.toISOString(),
    };
  });
}
