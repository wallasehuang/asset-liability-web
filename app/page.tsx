import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BreakdownChart } from "@/components/charts/breakdown-chart";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { KpiCard } from "@/components/kpi-card";
import { PageIntro } from "@/components/page-intro";
import { formatCurrency, formatMonthLong } from "@/lib/finance";
import { getDashboardSummary } from "@/lib/data";

export default async function DashboardPage() {
  const dashboard = await getDashboardSummary();
  const latestMonthLabel = dashboard.latestSnapshot ? formatMonthLong(new Date(dashboard.latestSnapshot.snapshotDate)) : null;

  return (
    <div className="grid gap-10">
      <PageIntro
        eyebrow="Overview"
        title="資產負債月結儀表板"
        description="首頁聚焦在最新月份的淨資產狀態與趨勢，用清楚但帶有編輯感的版面，讓你能快速看懂當月位置，再決定是否繼續補資料。"
      />

      <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="總資產" value={dashboard.latestSnapshot?.totalAssets ?? 0} />
        <KpiCard label="總負債" value={dashboard.latestSnapshot?.totalLiabilities ?? 0} />
        <KpiCard
          label="淨資產"
          value={dashboard.latestSnapshot?.netWorth ?? 0}
          hint={
            dashboard.latestSnapshot
              ? `最新月結 ${formatMonthLong(new Date(dashboard.latestSnapshot.snapshotDate))}`
              : "尚未建立任何月結"
          }
          accent
        />
        <KpiCard label="月增減" value={dashboard.monthChange} hint={formatCurrency(dashboard.monthChange)} />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr] xl:items-start">
        <article className="design-panel section-box grid content-start gap-3 self-start border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <div className="design-divider grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-[var(--color-line)] pb-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-muted)]">Trend / 12 months</div>
              <h2 className="mt-1.5 font-display text-[26px] uppercase tracking-[0.08em]">資產、負債與淨資產趨勢</h2>
            </div>
            <Link href="/reports" className="pt-[17px] text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)] transition hover:text-[var(--color-ink)]">
              查看報表
            </Link>
          </div>
          <NetWorthChart data={dashboard.trend} />
        </article>

        <article className="design-panel section-box grid content-start self-start gap-2.5 border border-[var(--color-line)] bg-[var(--color-bone)] p-5">
          <div className="design-divider grid gap-2 border-b border-[var(--color-line)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Action / latest month</div>
            <h2 className="font-display text-[24px] tracking-[0.05em]">繼續月結</h2>
            <p className="text-[12px] leading-6 text-[var(--color-muted)]">
              {latestMonthLabel
                ? `目前最新資料是 ${latestMonthLabel}。`
                : "目前還沒有任何月結資料，先建立第一個月份即可開始使用。"}
            </p>
          </div>
          <div className="design-action-stack grid gap-1.5">
            <Link
              href={dashboard.latestSnapshot ? `/snapshots/${dashboard.latestSnapshot.id}` : "/snapshots"}
              className="design-action-row group flex items-center justify-between gap-4 py-2"
            >
              <div className="grid gap-0.5">
                <div className="text-[14px] font-semibold text-[var(--color-ink)]">
                  {dashboard.latestSnapshot ? "打開最新月結" : "建立第一個月結"}
                </div>
                <div className="text-[11px] leading-5 text-[var(--color-muted)]">
                  {latestMonthLabel ? `直接延續 ${latestMonthLabel} 的資料內容` : "先建立第一筆月結資料後再開始編輯"}
                </div>
              </div>
              <ArrowRight size={18} className="shrink-0 text-[var(--color-muted)] transition group-hover:text-[var(--color-ink)]" />
            </Link>
            <Link href="/master-data" className="design-action-row group flex items-center justify-between gap-4 py-2">
              <div className="grid gap-0.5">
                <div className="text-[13px] font-medium text-[var(--color-ink)]">管理主檔</div>
                <div className="text-[11px] leading-5 text-[var(--color-muted)]">在同一頁整理分類、機構與項目來源</div>
              </div>
              <ArrowRight size={16} className="shrink-0 text-[var(--color-muted)] transition group-hover:text-[var(--color-ink)]" />
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <article className="design-panel section-box grid content-start self-start gap-3 border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <div className="design-divider border-b border-[var(--color-line)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-muted)]">Breakdown / assets</div>
            <h2 className="mt-1.5 font-display text-[26px] uppercase tracking-[0.08em]">資產配置</h2>
          </div>
          <BreakdownChart data={dashboard.assetBreakdown} />
        </article>
        <article className="design-panel section-box grid content-start self-start gap-3 border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <div className="design-divider border-b border-[var(--color-line)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-muted)]">Breakdown / liabilities</div>
            <h2 className="mt-1.5 font-display text-[26px] uppercase tracking-[0.08em]">負債結構</h2>
          </div>
          <BreakdownChart data={dashboard.liabilityBreakdown} />
        </article>
      </section>
    </div>
  );
}
