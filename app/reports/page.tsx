import { BreakdownChart } from "@/components/charts/breakdown-chart";
import { PageIntro } from "@/components/page-intro";
import { ReportsSnapshotList } from "@/components/reports/reports-snapshot-list";
import { getReportsSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { snapshots, latestSnapshotId, categoryBreakdown } = await getReportsSummary();

  return (
    <div className="grid gap-8">
      <PageIntro
        eyebrow="Reports"
        title="報表與匯出"
        description="第一版先提供月度列表、最新月份分類彙總，以及單月 CSV 匯出。這些報表都直接讀取月結快照，不需要額外維護公式。"
      />

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <article className="design-panel section-box grid content-start gap-3 self-start border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <div className="design-divider grid gap-2 border-b border-[var(--color-line)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-muted)]">Latest breakdown</div>
            <h2 className="font-display text-[26px] uppercase tracking-[0.08em]">最新分類分布</h2>
          </div>
          <BreakdownChart
            data={categoryBreakdown.map((item) => ({
              name: `${item.type === "asset" ? "資產" : "負債"} / ${item.name}`,
              value: item.total,
            }))}
          />
        </article>

        <article className="design-panel section-box grid gap-3 border border-[var(--color-line)] bg-[var(--color-bone)] p-5">
          <div className="design-divider grid gap-2 border-b border-[var(--color-line)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-muted)]">Monthly report</div>
            <h2 className="font-display text-[26px] uppercase tracking-[0.08em]">月份清單</h2>
          </div>
          <ReportsSnapshotList snapshots={snapshots} latestSnapshotId={latestSnapshotId} />
        </article>
      </section>
    </div>
  );
}
