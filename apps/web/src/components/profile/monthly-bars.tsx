"use client";

import type { ProfileMonthlyPoint } from "@sistema-flores/types";
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const parseMonth = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1);
};
const shortMonth = (key: string) =>
  cap(
    new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(parseMonth(key))
      .replace(".", ""),
  );
const longMonth = (key: string) =>
  cap(
    new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
      parseMonth(key),
    ),
  );
const compact = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

interface Point extends ProfileMonthlyPoint {
  label: string;
  full: string;
}

/** Gráfico de colunas do faturamento/gasto mensal, com destaque do melhor mês. */
export function MonthlyBars({
  data,
  valueName,
  best,
}: {
  data: ProfileMonthlyPoint[];
  /** Nome da métrica no tooltip: "Faturamento" ou "Gasto". */
  valueName: string;
  best: ProfileMonthlyPoint | null;
}) {
  const points: Point[] = data.map((p) => ({
    ...p,
    label: shortMonth(p.month),
    full: longMonth(p.month),
  }));
  const hasData = data.some((p) => p.total > 0);

  return (
    <div className="space-y-4">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => compact(Number(v))}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              content={<ChartTooltip valueName={valueName} />}
            />
            <Bar dataKey="total" name={valueName} radius={[4, 4, 0, 0]} maxBarSize={30}>
              {points.map((p) => (
                <Cell
                  key={p.month}
                  fill={
                    best && p.month === best.month
                      ? "hsl(var(--clay))"
                      : "hsl(var(--primary))"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {hasData && best ? (
        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-clay/12 text-clay">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Melhor período</p>
            <p className="truncate text-sm font-semibold">
              {longMonth(best.month)} ·{" "}
              <span className="tabular-nums">{formatCurrency(best.total)}</span>
            </p>
          </div>
        </div>
      ) : (
        <p className="py-2 text-center text-sm text-muted-foreground">
          Sem movimento nos últimos 12 meses.
        </p>
      )}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  valueName,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: Point }>;
  valueName: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-[var(--shadow-lg)]">
      <p className="mb-1 font-medium text-foreground">{payload[0].payload.full}</p>
      <p className="text-muted-foreground">
        {valueName}:{" "}
        <span className="font-medium text-foreground tabular-nums">
          {formatCurrency(payload[0].value)}
        </span>
      </p>
    </div>
  );
}
