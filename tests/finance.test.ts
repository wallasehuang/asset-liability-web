import { buildSnapshotCsv } from "@/lib/csv";
import { calculateAmountTwd, getVariance, summarizeEntries } from "@/lib/finance";

describe("finance helpers", () => {
  it("calculates TWD amount with rounding", () => {
    expect(calculateAmountTwd(123.456, 31.245)).toBe(3857.38);
  });

  it("summarizes assets and liabilities", () => {
    expect(
      summarizeEntries([
        { entryType: "asset", amountTwd: 1000 },
        { entryType: "asset", amountTwd: 500 },
        { entryType: "liability", amountTwd: 200 },
      ]),
    ).toEqual({
      totalAssets: 1500,
      totalLiabilities: 200,
      netWorth: 1300,
    });
  });

  it("computes month-over-month variance", () => {
    expect(getVariance(120000, 100500)).toBe(19500);
  });

  it("exports snapshot csv with ordered columns", () => {
    const csv = buildSnapshotCsv({
      id: "snapshot-1",
      snapshotDate: "2026-05-31T00:00:00.000Z",
      status: "draft",
      note: "",
      entries: [
        {
          itemId: "item-1",
          categoryId: "category-1",
          entryType: "asset",
          categoryCode: "asset-cash",
          categoryName: "現金",
          itemName: "生活現金",
          institution: "台新",
          currency: "TWD",
          amountOriginal: 1000,
          fxRate: 1,
          amountTwd: 1000,
          sortOrder: 0,
          note: "月底現金",
        },
      ],
    });

    expect(csv).toContain("month_end,type,category_code");
    expect(csv).toContain("2026-05-31,asset,asset-cash,現金,生活現金,台新,TWD,1000,1,1000,月底現金");
  });
});
