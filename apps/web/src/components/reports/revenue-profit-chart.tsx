"use client";

import type { MonthlyReportPoint } from "@sistema-flores/types";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

const compact = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Enumera os meses "AAAA-MM" entre from e to (inclusive). */
function monthsBetween(from: string, to: string): string[] {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  const out: string[] = [];
  let y = fy;
  let m = fm;
  // Trava de segurança para não estourar em intervalos inválidos.
  for (let i = 0; i < 120 && (y < ty || (y === ty && m <= tm)); i += 1) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function RevenueProfitChart({
  monthly,
  from,
  to,
  loading,
}: {
  monthly: MonthlyReportPoint[];
  from: string;
  to: string;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-[260px] w-full" />;
  }

  const byYm = new Map(monthly.map((m) => [m.ym, m]));
  const months = monthsBetween(from, to);
  const spansYears = months.length > 0 && months[0].slice(0, 4) !== to.slice(0, 4);

  const points = months.map((ym) => {
    const [y, m] = ym.split("-").map(Number);
    const short = new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(new Date(y, m - 1, 1))
      .replace(".", "");
    const d = byYm.get(ym);
    return {
      label: spansYears ? `${cap(short)}/${String(y).slice(2)}` : cap(short),
      receita: d?.revenue ?? 0,
      lucro: d?.grossProfit ?? 0,
    };
  });

  const hasData = points.some((p) => p.receita !== 0 || p.lucro !== 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success" />
          Receita
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
          Lucro bruto
        </span>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
              width={58}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => compact(Number(v))}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              content={<ChartTooltip />}
            />
            <Bar
              dataKey="receita"
              name="Receita"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              fill="hsl(var(--success))"
            />
            <Line
              dataKey="lucro"
              name="Lucro bruto"
              type="monotone"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "hsl(var(--primary))" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {!hasData ? (
        <p className="text-center text-sm text-muted-foreground">
          Sem vendas no período.
        </p>
      ) : null}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-[var(--shadow-lg)]">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          {p.name}:{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatCurrency(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}
