export type CategoryRecord = {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability";
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ItemRecord = {
  id: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  entryType: "asset" | "liability";
  name: string;
  institution: string;
  currency: "TWD" | "USD";
  sortOrder: number;
  isActive: boolean;
  note: string;
};

export type MasterDataCategoryRecord = CategoryRecord & {
  itemCount: number;
};

export type MasterDataRecord = {
  categories: MasterDataCategoryRecord[];
  items: ItemRecord[];
};

export type SnapshotEntryRecord = {
  id?: string;
  itemId: string;
  categoryId?: string | null;
  entryType: "asset" | "liability";
  categoryCode: string;
  categoryName: string;
  itemName: string;
  institution: string;
  currency: "TWD" | "USD";
  amountOriginal: number;
  fxRate: number;
  amountTwd: number;
  sortOrder: number;
  note: string;
};

export type SnapshotRecord = {
  id: string;
  snapshotDate: string;
  status: "draft" | "final";
  usdFxRate: number;
  note: string;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
};

export type SnapshotDetailRecord = {
  id: string;
  snapshotDate: string;
  status: "draft" | "final";
  usdFxRate: number;
  note: string;
  entries: SnapshotEntryRecord[];
};

export type DashboardSummary = {
  latestSnapshot: SnapshotRecord | null;
  previousSnapshot: SnapshotRecord | null;
  monthChange: number;
  trend: Array<{
    label: string;
    date: string;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  }>;
  assetBreakdown: Array<{ name: string; value: number }>;
  liabilityBreakdown: Array<{ name: string; value: number }>;
};
