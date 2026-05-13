import { Currency, EntryType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoryDefinitions = [
  { code: 'asset-cash', type: EntryType.asset, name: '現金', sortOrder: 10 },
  {
    code: 'asset-foreign-cash',
    type: EntryType.asset,
    name: '外幣現金',
    sortOrder: 20,
  },
  {
    code: 'asset-tw-stock',
    type: EntryType.asset,
    name: '台股 / ETF',
    sortOrder: 30,
  },
  {
    code: 'asset-us-stock',
    type: EntryType.asset,
    name: '美股 / ETF',
    sortOrder: 40,
  },
  {
    code: 'asset-crypto',
    type: EntryType.asset,
    name: '加密貨幣',
    sortOrder: 50,
  },
  {
    code: 'asset-receivable',
    type: EntryType.asset,
    name: '借款 / 應收帳款',
    sortOrder: 60,
  },
  {
    code: 'asset-other',
    type: EntryType.asset,
    name: '其他資產',
    sortOrder: 70,
  },
  {
    code: 'liability-card',
    type: EntryType.liability,
    name: '信用卡應付',
    sortOrder: 80,
  },
  {
    code: 'liability-loan',
    type: EntryType.liability,
    name: '貸款',
    sortOrder: 90,
  },
  {
    code: 'liability-other',
    type: EntryType.liability,
    name: '其他負債',
    sortOrder: 100,
  },
] as const;

const rawItems = [
  {
    categoryName: '借款 / 應收帳款',
    institution: '誰？是誰！',
    name: '我又借了誰錢？',
  },
  { categoryName: '加密貨幣', institution: '幣安', name: '幣安加密貨幣' },
  { categoryName: '台股 / ETF', institution: '元大證券', name: '元大台股 ETF' },
  { categoryName: '外幣現金', institution: '國泰外幣', name: '國泰美元現金' },
  { categoryName: '台股 / ETF', institution: '國泰證券', name: '國泰台股 ETF' },
  { categoryName: '美股 / ETF', institution: '國泰證券', name: '國泰美股 ETF' },
  { categoryName: '加密貨幣', institution: 'OKX', name: 'OKX 加密貨幣' },
  { categoryName: '其他資產', institution: '記得寫備註', name: '其他資產' },
  {
    categoryName: '信用卡應付',
    institution: '玉山',
    name: '玉山信用卡 / 保險',
  },
  {
    categoryName: '信用卡應付',
    institution: '富邦',
    name: '富邦信用卡 / COSTCO',
  },
  {
    categoryName: '信用卡應付',
    institution: '台新',
    name: '台新信用卡 / 日常消費',
  },
  {
    categoryName: '信用卡應付',
    institution: '永豐',
    name: '大戶信用卡 / 日常消費',
  },
  { categoryName: '貸款', institution: '和潤借貸', name: '車貸 / IGNIS 72 期' },
  { categoryName: '現金', institution: '錢包', name: '台幣現金' },
  { categoryName: '現金', institution: '台新 Richart', name: '台新銀行現金' },
  { categoryName: '現金', institution: '元大', name: '元大銀行現金' },
  { categoryName: '現金', institution: '永豐大戶', name: '永豐銀行現金' },
  { categoryName: '現金', institution: '玉山', name: '玉山銀行現金' },
  { categoryName: '現金', institution: '國泰', name: '國泰銀行現金' },
  {
    categoryName: '外幣現金',
    institution: '台新 Richart 外幣',
    name: '台新美元現金',
  },
  { categoryName: '貸款', institution: '媽媽', name: '媽媽貸 / 100w N 期' },
  { categoryName: '其他負債', institution: '記得寫備註', name: '其他' },
] as const;

const categoryCodeMap = new Map(
  categoryDefinitions.map((category) => [category.name, category.code]),
);

const currencyByCategory = new Map<string, Currency>([
  ['現金', Currency.TWD],
  ['外幣現金', Currency.USD],
  ['台股 / ETF', Currency.TWD],
  ['美股 / ETF', Currency.USD],
  ['加密貨幣', Currency.USD],
  ['借款 / 應收帳款', Currency.TWD],
  ['其他資產', Currency.TWD],
  ['信用卡應付', Currency.TWD],
  ['貸款', Currency.TWD],
  ['其他負債', Currency.TWD],
]);

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll('/', '-')
    .replace(/\s+/g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const items = rawItems.map((item, index) => {
  const categoryCode = categoryCodeMap.get(item.categoryName);
  const currency = currencyByCategory.get(item.categoryName);

  if (!categoryCode || !currency) {
    throw new Error(`Seed 設定缺少分類或幣別對應：${item.categoryName}`);
  }

  return {
    id: `${categoryCode}-${slugify(item.institution)}-${slugify(item.name)}`,
    name: item.name,
    institution: item.institution,
    categoryCode,
    currency,
    sortOrder: (index + 1) * 10,
  };
});

async function main() {
  for (const category of categoryDefinitions) {
    await prisma.category.upsert({
      where: { code: category.code },
      update: {
        name: category.name,
        type: category.type,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: category,
    });
  }

  const categoryMap = new Map(
    (await prisma.category.findMany()).map((category) => [
      category.code,
      category.id,
    ]),
  );

  for (const item of items) {
    const categoryId = categoryMap.get(item.categoryCode);
    if (!categoryId) {
      throw new Error(`找不到分類：${item.categoryCode}`);
    }

    await prisma.item.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        categoryId,
        currency: item.currency,
        institution: item.institution,
        sortOrder: item.sortOrder,
        isActive: true,
        note: '',
      },
      create: {
        id: item.id,
        name: item.name,
        categoryId,
        currency: item.currency,
        institution: item.institution,
        sortOrder: item.sortOrder,
        isActive: true,
        note: '',
      },
    });
  }

  console.log(
    `Seeded ${categoryDefinitions.length} categories and ${items.length} items.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
