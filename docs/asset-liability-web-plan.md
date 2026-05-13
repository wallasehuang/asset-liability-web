# 資產負債管理工具實作規劃

## 1. 專案目標

建立一套供個人使用的 `資產負債月結管理工具`，取代目前試算表需要手動維護主檔、欄位與彙總公式的方式。

核心需求：

- 每月一次進行資產與負債月結
- 可管理分類與項目主檔
- 新增或停用項目後，畫面與報表可自動連動
- 自動計算總資產、總負債、淨資產與月變化
- 支援多幣別的月結換算，第一版先支援 `TWD` 與 `USD`
- 未來可逐步增加報表、匯出與部署能力

此專案 `不是日常記帳系統`，第一版不處理每筆交易流水，只處理 `月結快照`。

---

## 2. 技術決策

### 2.1 技術棧

- `Framework`: `Next.js`
- `Language`: `TypeScript`
- `Runtime`: `Node.js 20 LTS`
- `UI`: `Tailwind CSS` + 基本元件系統
- `Database`: `SQLite`
- `ORM`: `Prisma`
- `Chart`: `Recharts`
- `Validation`: `Zod`
- `Deploy`: `Docker` / `Docker Compose`

### 2.2 為什麼選 Next.js

這次不採 Nuxt，直接定案 `Next.js`，原因如下：

- 前後端可在同一個 repo 完成，適合單人內部工具
- 用 `Route Handlers` 或 `Server Actions` 做 CRUD 很直接
- 跟 `Prisma + SQLite` 搭配成熟
- 後續要補登入、API、匯出、報表都容易延伸
- Docker 化與家中 server 部署路徑清楚

如果未來你非常偏好 Vue 生態，再評估 Nuxt；但這份規劃與後續實作先以 `Next.js` 為唯一目標，避免雙規格。

---

## 3. 產品範圍

### 3.1 MVP 範圍

第一版只做以下功能：

- 分類管理
- 項目管理
- 月結建立與編輯
- 月結項目填寫
- 匯率填寫
- 月度檢視
- Dashboard
- CSV 匯出

### 3.2 不在第一版

- 每筆交易流水
- 預算與收支管理
- 自動同步銀行或券商資料
- 多使用者協作
- 權限系統
- 行動裝置原生 app

---

## 4. 核心概念

### 4.1 月結快照

系統的最小記錄單位是 `某個月的月結`，例如 `2025-10-31`。

每次月結包含：

- 該月的 `USD/TWD` 標準匯率
- 該月所有已納入管理的資產項目
- 該月所有已納入管理的負債項目
- 每個項目的原幣金額
- 匯率快照
- 換算後台幣金額
- 備註

### 4.2 主檔與歷史分離

主檔變更不應破壞歷史資料，因此：

- `分類` 是可維護主檔
- `項目` 是可維護主檔
- `月結紀錄` 在建立後保留當時數值

如果未來停用項目，只影響新月份選單，不影響歷史月結與報表。

### 4.3 分類層級策略

第一版不強迫把資產拆太細，先採 `兩層`：

- `類型`：資產 / 負債
- `分類`：如 現金、外幣現金、台股/ETF、信用卡應付、分期/借款

`項目名稱` 留給細節，例如：

- 現金 > 生活現金
- 現金 > 緊急預備金
- 台股/ETF > 台股ETF

這樣可兼顧簡潔與未來擴充。

---

## 5. 資料庫設計

### 5.1 category

用途：資產/負債的分類主檔

- `id`
- `type`：`asset` | `liability`
- `code`：唯一代碼，例如 `asset-cash`
- `name`：例如 `現金`
- `sortOrder`
- `isActive`
- `createdAt`
- `updatedAt`

### 5.2 item

用途：實際被記錄的項目主檔

- `id`
- `categoryId`
- `name`：例如 `生活現金`
- `institution`：例如 `台新`
- `currency`：例如 `TWD`、`USD`
- `sortOrder`
- `isActive`
- `note`
- `createdAt`
- `updatedAt`

### 5.3 snapshot

用途：某月的月結主表

- `id`
- `snapshotDate`
- `status`：`draft` | `final`
- `usdFxRate`
- `note`
- `createdAt`
- `updatedAt`

### 5.4 snapshotEntry

用途：某月結下各項目的紀錄

- `id`
- `snapshotId`
- `itemId`
- `categoryId`
- `entryType`
- `categoryCode`
- `categoryName`
- `itemName`
- `institution`
- `amountOriginal`
- `currency`
- `fxRate`
- `amountTwd`
- `sortOrder`
- `note`
- `createdAt`
- `updatedAt`

### 5.5 設計說明

- `snapshotEntry` 冗餘保存 `entryType`、`categoryCode`、`categoryName`、`itemName`、`institution`、`categoryId` 與 `currency`，避免日後主檔改名、改分類或停用後影響歷史報表
- `amountTwd` 寫入時直接存值，不依賴即時計算，方便查詢與匯出
- `snapshotDate` 必須唯一，避免同月份重複建立月結
- 考量 `Prisma + SQLite` 的實務穩定性，第一版金額欄位採 `Float` 儲存，並由應用層統一四捨五入到小數點後 2 位
- 所有報表都以 `snapshotEntry` 為主來源

---

## 6. 頁面規劃

### 6.1 `/`

Dashboard 首頁

顯示：

- 最新月份
- 總資產
- 總負債
- 淨資產
- 月增減
- 近 12 個月淨資產趨勢
- 最新月份資產配置
- 最新月份負債結構

### 6.2 `/snapshots`

月結列表頁

功能：

- 查看所有月份
- 建立新月份月結
- 點進單月編輯
- 刪除草稿月結

### 6.3 `/snapshots/[id]`

單月月結編輯頁

功能：

- 查看該月所有項目
- 新增一筆月結項目
- 編輯金額、匯率、備註
- 根據幣別自動算台幣金額
- 顯示當月總資產、總負債、淨資產
- 可從上月複製項目清單與數值作為初始值

### 6.4 `/categories`

分類管理頁

功能：

- 新增分類
- 編輯分類名稱與排序
- 啟用/停用分類

### 6.5 `/items`

項目管理頁

功能：

- 新增項目
- 編輯項目名稱、機構、幣別、分類
- 啟用/停用項目

### 6.6 `/reports`

報表頁

第一版可先提供：

- 月度列表報表
- 分類彙總報表
- CSV 匯出按鈕

---

## 7. 互動流程

### 7.1 建立新月份月結

1. 使用者在月結列表頁點 `新增月結`
2. 輸入月份
3. 系統預設帶入本月 `USD/TWD` 標準匯率，可沿用最新月結或複製來源月結
4. 系統建立 snapshot
5. 可選擇：
   - 建立空白月結
   - 複製上月項目清單
6. 進入單月編輯頁填值

### 7.2 月結填寫

1. 使用者選擇項目
2. 輸入原幣金額
3. 若幣別為 `TWD`，系統固定使用匯率 `1`
4. 若幣別為 `USD`，系統自動套用該月建立時的 `USD/TWD` 標準匯率
5. 系統即時計算 `amountTwd`
6. 頁面即時更新總資產 / 總負債 / 淨資產
7. 使用者按一次 `儲存本月月結`，整頁集中送出變更

### 7.3 主檔變更

1. 在分類或項目管理頁新增主檔
2. 單月月結頁的新增項目選單自動反映
3. Dashboard / 報表自動依當月實際資料彙總
4. 不需要手動修改欄位或公式

---

## 8. API / Server 能力

第一版可採 `Next.js Route Handlers`。

### 8.1 Categories

- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:id`

### 8.2 Items

- `GET /api/items`
- `POST /api/items`
- `PATCH /api/items/:id`

### 8.3 Snapshots

- `GET /api/snapshots`
- `POST /api/snapshots`
- `GET /api/snapshots/:id`
- `PATCH /api/snapshots/:id`
- `DELETE /api/snapshots/:id`

### 8.4 Snapshot Entries

- `POST /api/snapshots/:id/entries`
- `PATCH /api/snapshot-entries/:id`
- `DELETE /api/snapshot-entries/:id`

### 8.5 Reports

- `GET /api/reports/net-worth-trend`
- `GET /api/reports/category-breakdown?snapshotId=...`
- `GET /api/reports/export/snapshot/:id`

---

## 9. 報表邏輯

### 9.1 Dashboard 指標

- `總資產`：某月 `type = asset` 的 `amountTwd` 加總
- `總負債`：某月 `type = liability` 的 `amountTwd` 加總
- `淨資產`：總資產 - 總負債
- `月增減`：本月淨資產 - 上月淨資產

### 9.2 分類配置

按 `category` 對 `amountTwd` 分組加總。

### 9.3 趨勢圖

按 `snapshotDate` 聚合：

- 總資產
- 總負債
- 淨資產

---

## 10. UI 原則

### 10.1 第一版畫面風格

方向：

- 簡潔
- 清楚
- 可快速完成月結
- 避免過多財務術語

### 10.2 GNUHR-inspired design system

本專案的視覺風格參考 `https://www.gnuhr.com/`，但只轉譯其設計語言，不複製其電商資訊架構、內容編排或互動行為。

核心設計語言：

- `編輯感 + 簡化資訊版面 + 低噪音表單`
- 強字體節奏、大面積留白、細邊框、模組化分區
- 以財務工具為前提保留高可讀性，不讓風格犧牲輸入效率

配色策略：

- 主色基底採 `off-black / bone / stone / olive`
- 強調色採少量 `signal orange` 或 `acid green`
- 資訊輸入區維持高對比、低裝飾

字體策略：

- `condensed display` 用於頁首、KPI 數字、區塊標記
- `grotesk sans` 用於表單、表格與正文

強風格應用位置：

- app shell
- Dashboard 首頁 hero
- KPI 卡片
- 區塊標題
- 空狀態
- 圖表容器

保守處理位置：

- 表單欄位
- 資料表
- 輸入元件
- 驗證訊息
- 手機底部操作列

### 10.3 Responsive 規則

- `mobile`：單欄排版、卡片式月結輸入、底部主要操作列、避免橫向捲動輸入
- `tablet`：雙欄摘要搭配可折疊或分段的資料區
- `desktop`：多欄資訊面板、密集表格、sticky summary

### 10.4 表單重點

- 月結頁是主工作頁
- 一頁內完成主要輸入
- 減少頁面跳轉
- 下拉選單優先
- 自動帶入優先
- 桌機版以分區卡片列表輸入為主，避免欄寬過窄導致文字擠壓
- 手機版改以逐筆卡片編輯為主
- 資產與負債各自提供獨立新增入口

### 10.5 表格欄位

單月月結表格至少包含：

- 分類
- 項目
- 機構
- 幣別
- 原幣金額
- 匯率
- 台幣金額
- 備註

---

## 11. Docker 部署規劃

### 11.1 容器內容

- Next.js app
- SQLite 檔案放在掛載 volume
- 啟動時執行 `Prisma migrate deploy`
- 啟動時執行 idempotent seed

### 11.2 建議 volume

- `/app/data`

資料庫檔案：

- `/app/data/app.db`

### 11.3 建議 compose

包含：

- app service
- volume for sqlite
- 環境變數設定
- `PORT=3000`
- `DATABASE_URL=file:/app/data/app.db`

### 11.4 備份

至少保留：

- 每日或每週複製 `app.db`
- 備份到另一個目錄或 NAS
- 可附簡單 shell script 產生時間戳記備份檔

---

## 12. 開發階段

### Phase 1

基礎專案初始化

- Next.js scaffold
- Tailwind
- Prisma
- SQLite
- 基本 layout
- 全域設計 token 與 app shell

### Phase 2

主檔功能

- categories CRUD
- items CRUD

### Phase 3

月結功能

- snapshots CRUD
- snapshot entries CRUD
- 複製上月資料
- 自動計算台幣金額
- 整頁集中儲存
- 手機卡片式輸入

### Phase 4

Dashboard / 報表

- KPI 卡片
- 淨資產趨勢圖
- 資產配置
- 負債結構
- CSV 匯出

### Phase 5

部署與備份

- Dockerfile
- docker-compose
- volume / backup script

---

## 13. 驗收標準

### 功能驗收

- 可新增分類與項目
- 可建立指定月份月結
- 可新增與修改月結項目
- 可輸入 USD 與 TWD 金額
- 可自動產生台幣金額
- 可正確顯示 Dashboard
- 主檔新增後不需手動改報表設定

### 使用體驗驗收

- 建立一次月結可在 10 分鐘內完成
- 新增項目不需改 schema 或前端欄位
- 報表頁能清楚看出淨資產變化

---

## 14. 實作假設

- 第一版為單人使用
- 第一版不做登入
- 第一版不做流水帳
- 第一版只支援 `TWD` 與 `USD`
- 第一版部署於家中 server，透過 Docker 執行
- 首次啟動預設帶入常用分類與項目 seed
- 不預設建立示範 snapshot

---

## 16. 目前實作決議

- 專案以 `Next.js App Router` 實作，頁面採 server-first，互動表單以 client component 承接
- `Dashboard`、`分類管理`、`項目管理`、`月結列表`、`單月月結編輯`、`報表頁` 為第一版已定案頁面
- `月結編輯頁` 採 `桌機表格 + 手機卡片` 雙模式
- `Recharts` 作為趨勢圖與配置圖的唯一圖表方案
- `CSV 匯出` 以單月快照資料為主，不依賴外部報表工具

---

## 15. 下一步開發原則

後續實作必須依照這份文件進行，除非出現以下情況才可調整：

- 實作時發現資料模型不足以支撐核心需求
- UI 或流程造成月結輸入明顯不順
- Docker / SQLite 部署上有實際限制

若調整，必須先更新此文件，再進入後續開發。
