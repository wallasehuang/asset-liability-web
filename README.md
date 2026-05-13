# Asset Liability Web

Next.js + Prisma 的資產負債管理專案，使用 SQLite 作為本機開發資料庫，提供資產、負債、快照與報表管理。

## 開發環境

- Node.js: 20
- 套件管理: npm
- App framework: Next.js 15
- ORM: Prisma
- Database: SQLite
- Test: Vitest

## 專案結構

- `app/`: Next.js App Router 頁面與 API routes
- `components/`: UI 元件與功能元件
- `lib/`: 資料處理、驗證、共用工具與 Prisma client
- `prisma/`: schema、migrations、seed
- `scripts/`: 初始化、備份與輔助腳本
- `tests/`: 單元測試
- `docs/`: 規劃與交接文件

## 本機啟動

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
npm run db:seed
npm run dev
```

預設資料庫位置來自 `.env`:

```env
DATABASE_URL="file:./dev.db"
```

在目前設定下，Prisma 會把資料庫建立在 `prisma/dev.db`。

## 常用指令

```bash
npm run dev
npm run build
npm start
npm test
npm run prisma:generate
npm run prisma:deploy
npm run db:seed
```

## 清空並重新初始化資料庫

```bash
rm -f prisma/dev.db prisma/dev.db-wal prisma/dev.db-shm
sqlite3 prisma/dev.db ".databases"
npm run prisma:deploy
npm run db:seed
```

說明:

- 第一步清除舊資料庫
- 第二步先建立空的 SQLite 檔案
- 第三步套用 Prisma migration
- 第四步匯入初始化資料

## Docker

專案已包含:

- `Dockerfile`
- `docker-compose.yml`

目前容器啟動時會自動執行 migration 與 seed。
