"use client";

import type { RevenuePoint } from "@sistema-flores/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatMonthShort } from "@/lib/utils";

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const chartData = data.map((point) => ({
    name: formatMonthShort(point.month),
    receita: point.revenue,
    lucro: point.profit,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.25} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={70}
          fontSize={11}
          stroke="hsl(var(--muted-foreground))"
          tickFormatter={(value: number) =>
            value >= 1000 ? `R$${(value / 1000).toFixed(0)}k` : `R$${value}`
          }
        />
        <Tooltip
          formatter={(value: number, name) => [formatCurrency(value), name]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="receita"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          fill="url(#fillRevenue)"
        />
        <Area
          type="monotone"
          dataKey="lucro"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          fill="url(#fillProfit)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
