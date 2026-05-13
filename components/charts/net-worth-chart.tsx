"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrency } from "@/lib/finance";

type NetWorthChartProps = {
  data: Array<{
    label: string;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  }>;
};

export function NetWorthChart({ data }: NetWorthChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            tickFormatter={(value) => `${Math.round(Number(value) / 10000)}萬`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-bone)",
              border: "1px solid var(--color-line)",
              borderRadius: 0,
            }}
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
          />
          <Legend
            verticalAlign="top"
            align="left"
            wrapperStyle={{ paddingBottom: "12px", fontSize: "12px", color: "var(--color-muted)" }}
          />
          <Line
            type="monotone"
            dataKey="totalAssets"
            name="總資產"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="totalLiabilities"
            name="總負債"
            stroke="var(--chart-3)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            name="淨資產"
            stroke="var(--chart-1)"
            strokeWidth={2.75}
            dot={false}
            activeDot={{ r: 4.5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
