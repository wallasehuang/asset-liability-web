"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/finance";

const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

type BreakdownChartProps = {
  data: Array<{ name: string; value: number }>;
};

export function BreakdownChart({ data }: BreakdownChartProps) {
  if (data.length === 0) {
    return <div className="flex h-72 items-center justify-center text-sm text-[var(--color-muted)]">目前沒有資料</div>;
  }

  return (
    <div className="grid gap-3">
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={92} innerRadius={54}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: "var(--color-bone)",
                border: "1px solid var(--color-line)",
                borderRadius: 0,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="design-breakdown-legend grid gap-1 sm:grid-cols-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-start gap-1.5 text-[12px] leading-5 text-[var(--color-muted)]">
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="truncate text-[var(--color-ink)]">{entry.name}</div>
              <div>{formatCurrency(entry.value)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
