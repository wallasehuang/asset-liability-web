import { Currency, PrismaClient, SnapshotStatus } from "@prisma/client";
import { addMonths, endOfMonth, format } from "date-fns";

import { calculateAmountTwd, roundCurrency } from "../lib/finance";

const prisma = new PrismaClient();
const MONTH_TOTAL = 24;
const START_MONTH = new Date("2024-06-01T00:00:00+08:00");

type ItemWithCategory = Awaited<ReturnType<typeof loadItems>>[number];

function formatKey(date: Date) {
  return format(date, "yyyy-MM");
}

function usdRateForMonth(offset: number) {
  return roundCurrency(31.05 + offset * 0.03 + Math.sin(offset / 3) * 0.28);
}

function seasonal(offset: number, scale: number) {
  return Math.round(Math.sin(offset / 2.4) * scale);
}

function amountForItem(name: string, offset: number) {
  switch (name) {
    case "生活現金":
      return 18000 + offset * 300 + seasonal(offset, 1800);
    case "緊急預備金":
      return 30000 + offset * 500 + seasonal(offset + 1, 1200);
    case "數位存款":
      return 6000 + offset * 200 + seasonal(offset + 2, 900);
    case "美元現金":
      return 300 + offset * 10 + seasonal(offset + 1, 35);
    case "台股 ETF":
      return 30000 + offset * 1500 + seasonal(offset + 3, 6000);
    case "美股 ETF":
      return 700 + offset * 45 + seasonal(offset + 2, 110);
    case "全球基金":
      return 10000 + offset * 350 + seasonal(offset + 4, 1600);
    case "儲蓄險":
      return 12000 + offset * 400 + seasonal(offset + 1, 700);
    case "玉山信用卡":
      return 2200 + (offset % 5) * 900 + Math.max(seasonal(offset + 3, 500), 0);
    case "富邦信用卡":
      return offset % 2 === 0 ? 900 + (offset % 4) * 650 : 0;
    case "學貸":
      return Math.max(11000, 30000 - offset * 900);
    case "機車分期":
      return offset < 13 ? Math.max(2500, 12000 - offset * 900) : 0;
    case "保單借款":
      return offset >= 14 && offset % 3 !== 0 ? 5000 + (offset % 4) * 1200 : 0;
    default:
      return 0;
  }
}

function noteForSnapshot(offset: number) {
  if (offset % 6 === 0) {
    return "季度盤點後，微調持股與備用金比例。";
  }

  if (offset % 6 === 3) {
    return "保留較高現金水位，預備保費與旅遊支出。";
  }

  return "";
}

function noteForEntry(name: string, offset: number) {
  if (name === "生活現金" && offset % 5 === 0) {
    return "保留一筆下月固定支出，先停在活存。";
  }

  if (name === "美股 ETF" && offset % 4 === 2) {
    return "定期定額後尚未再平衡，先維持原配置。";
  }

  if (name === "富邦信用卡" && offset % 6 === 1) {
    return "當月集中刷旅宿與交通費。";
  }

  return "";
}

async function loadItems() {
  return prisma.item.findMany({
    where: {
      isActive: true,
      category: {
        isActive: true,
      },
    },
    include: {
      category: true,
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

async function main() {
  const items = await loadItems();

  const existing = await prisma.snapshot.findMany({
    select: {
      id: true,
      snapshotDate: true,
      status: true,
      entries: {
        select: {
          id: true,
        },
      },
    },
  });
  const existingMap = new Map(existing.map((snapshot) => [formatKey(snapshot.snapshotDate), snapshot]));

  const createdMonths: string[] = [];
  const hydratedMonths: string[] = [];

  for (let offset = 0; offset < MONTH_TOTAL; offset += 1) {
    const snapshotDate = endOfMonth(addMonths(START_MONTH, offset));
    const monthKey = formatKey(snapshotDate);
    const usdFxRate = usdRateForMonth(offset);
    const entries = items
      .map((item) => buildEntry(item, offset, usdFxRate))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    if (entries.length === 0) {
      continue;
    }

    const existingSnapshot = existingMap.get(monthKey);
    if (existingSnapshot) {
      if (existingSnapshot.entries.length > 0) {
        continue;
      }

      await prisma.snapshot.update({
        where: { id: existingSnapshot.id },
        data: {
          usdFxRate,
          note: noteForSnapshot(offset),
        },
      });

      await prisma.snapshotEntry.createMany({
        data: entries.map((entry) => ({
          ...entry,
          snapshotId: existingSnapshot.id,
        })),
      });

      hydratedMonths.push(monthKey);
      continue;
    }

    const snapshot = await prisma.snapshot.create({
      data: {
        snapshotDate,
        status: SnapshotStatus.final,
        usdFxRate,
        note: noteForSnapshot(offset),
      },
    });

    await prisma.snapshotEntry.createMany({
      data: entries.map((entry) => ({
        ...entry,
        snapshotId: snapshot.id,
      })),
    });

    createdMonths.push(monthKey);
  }

  console.log(`Created ${createdMonths.length} demo snapshots.`);
  console.log(createdMonths.join(", "));
  console.log(`Hydrated ${hydratedMonths.length} existing empty snapshots.`);
  console.log(hydratedMonths.join(", "));
}

function buildEntry(item: ItemWithCategory, offset: number, usdFxRate: number) {
  const amountOriginal = roundCurrency(amountForItem(item.name, offset));
  if (amountOriginal <= 0) {
    return null;
  }

  const fxRate = item.currency === Currency.USD ? usdFxRate : 1;

  return {
    itemId: item.id,
    categoryId: item.categoryId,
    entryType: item.category.type,
    categoryCode: item.category.code,
    categoryName: item.category.name,
    itemName: item.name,
    institution: item.institution ?? "",
    currency: item.currency,
    amountOriginal,
    fxRate,
    amountTwd: calculateAmountTwd(amountOriginal, fxRate),
    sortOrder: item.sortOrder,
    note: noteForEntry(item.name, offset),
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
