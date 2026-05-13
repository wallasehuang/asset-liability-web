import { formatCompactCurrency, formatCurrency } from "@/lib/finance";

type KpiCardProps = {
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
};

export function KpiCard({ label, value, hint, accent = false }: KpiCardProps) {
  return (
    <article
      className={[
        "design-list-card kpi-card grid content-start self-start gap-1.5 border p-4 md:p-5",
        accent
          ? "border-[var(--color-ink)] bg-[var(--color-surface)] text-[var(--color-ink)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)]",
      ].join(" ")}
    >
      <div className="text-[12px] text-[var(--color-muted)]">{label}</div>
      <div className="font-display text-[28px] tracking-[0.03em] md:text-[34px]">{formatCompactCurrency(value)}</div>
      <div className="text-[11px] tracking-[0.03em] text-[var(--color-muted)]">
        {hint ?? formatCurrency(value)}
      </div>
    </article>
  );
}
