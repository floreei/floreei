"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
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
import { cn, formatCurrency } from "@/lib/utils";

export interface CashflowPoint {
  /** Rótulo curto do eixo X (ex.: "Jun" ou "05/03"). */
  label: string;
  /** Rótulo completo para os destaques (ex.: "Junho 2026" ou "05/03/2026"). */
  fullLabel: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

const compact = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

export function CashflowChart({
  points,
  unit,
}: {
  points: CashflowPoint[];
  /** Palavra usada nos destaques: "dia" ou "mês". */
  unit: "dia" | "mês";
}) {
  const active = points.filter((p) => p.entradas > 0 || p.saidas > 0);
  const best = active.reduce<CashflowPoint | null>(
    (acc, p) => (acc === null || p.saldo > acc.saldo ? p : acc),
    null,
  );
  const worst = active.reduce<CashflowPoint | null>(
    (acc, p) => (acc === null || p.saldo < acc.saldo ? p : acc),
    null,
  );
  const hasData = active.length > 0;

  // Evita rótulos amontoados quando há muitos pontos (ex.: dias do mês).
  const skip = points.length > 16 ? Math.ceil(points.length / 12) - 1 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success" />
          Entradas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-clay" />
          Saídas
        </span>
      </div>

      <div className="h-[240px] w-full">
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
              interval={skip}
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
            <Bar dataKey="entradas" name="Entradas" radius={[4, 4, 0, 0]} maxBarSize={26}>
              {points.map((p) => (
                <Cell key={`in-${p.label}`} fill="hsl(var(--success))" />
              ))}
            </Bar>
            <Bar dataKey="saidas" name="Saídas" radius={[4, 4, 0, 0]} maxBarSize={26}>
              {points.map((p) => (
                <Cell key={`out-${p.label}`} fill="hsl(var(--clay))" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {hasData ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <HighlightCard
            tone="best"
            icon={TrendingUp}
            label={`Melhor ${unit}`}
            title={best ? best.fullLabel : "—"}
            value={best ? formatCurrency(best.saldo) : "—"}
          />
          <HighlightCard
            tone="worst"
            icon={TrendingDown}
            label={`Pior ${unit}`}
            title={worst ? worst.fullLabel : "—"}
            value={worst ? formatCurrency(worst.saldo) : "—"}
          />
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Sem movimentações no período.
        </p>
      )}
    </div>
  );
}

function HighlightCard({
  tone,
  icon: Icon,
  label,
  title,
  value,
}: {
  tone: "best" | "worst";
  icon: typeof TrendingUp;
  label: string;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          tone === "best" ? "bg-success/12 text-success" : "bg-clay/12 text-clay",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">
          {title} · <span className="tabular-nums">{value}</span>
        </p>
      </div>
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
