"use client";

import type { ReportSummary } from "@sistema-flores/types";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

interface Trend {
  pct: number;
  up: boolean;
}

function delta(curr: number, prev: number | undefined): Trend | null {
  if (prev === undefined || prev === 0) return null;
  return { pct: ((curr - prev) / Math.abs(prev)) * 100, up: curr >= prev };
}

export function ReportKpis({
  summary,
  prevSummary,
  loading,
}: {
  summary?: ReportSummary;
  prevSummary?: ReportSummary;
  loading: boolean;
}) {
  const revenue = summary?.revenue ?? 0;
  const grossProfit = summary?.grossProfit ?? 0;
  const events = summary?.eventsCount ?? 0;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const ticket = events > 0 ? revenue / events : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric
        loading={loading}
        label="Receita"
        value={formatCurrency(revenue)}
        trend={delta(revenue, prevSummary?.revenue)}
      />
      <Metric
        loading={loading}
        label="Lucro bruto"
        value={formatCurrency(grossProfit)}
        hint={`margem ${formatPercent(margin)}`}
        accent
        trend={delta(grossProfit, prevSummary?.grossProfit)}
      />
      <Metric
        loading={loading}
        label="Ticket médio"
        value={formatCurrency(ticket)}
        hint="por venda"
      />
      <Metric
        loading={loading}
        label="Vendas"
        value={String(events)}
      />
      <Metric
        loading={loading}
        label="Custo do vendido"
        value={formatCurrency(summary?.cogs ?? 0)}
      />
      <Metric
        loading={loading}
        label="Compras"
        value={formatCurrency(summary?.purchasesCost ?? 0)}
      />
      <Metric
        loading={loading}
        label="Recebido"
        value={formatCurrency(summary?.received ?? 0)}
      />
      <Metric
        loading={loading}
        label="Pago"
        value={formatCurrency(summary?.paid ?? 0)}
      />
    </div>
  );
}

function Metric({
  loading,
  label,
  value,
  hint,
  accent,
  trend,
}: {
  loading: boolean;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  trend?: Trend | null;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
                trend.up ? "text-success" : "text-destructive",
              )}
              title="vs. período anterior"
            >
              {trend.up ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(trend.pct).toFixed(0)}%
            </span>
          ) : null}
        </div>
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <p
            className={cn(
              "text-2xl font-semibold tracking-tight tabular-nums",
              accent && "text-success",
            )}
          >
            {value}
          </p>
        )}
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
