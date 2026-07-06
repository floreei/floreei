"use client";

import type { Cashflow, DreReport, FinanceSummary } from "@sistema-flores/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isOverdue } from "@/lib/finance-period";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

interface Trend {
  pct: number;
  up: boolean;
}

/** Variação relativa vs. período anterior; null quando não há base de comparação. */
function delta(curr: number, prev: number | undefined): Trend | null {
  if (prev === undefined || prev === 0) return null;
  return { pct: ((curr - prev) / Math.abs(prev)) * 100, up: curr >= prev };
}

function overdueOf(accounts: FinanceSummary["receivables"] | undefined) {
  const list = (accounts ?? []).filter((a) => isOverdue(a.date));
  return {
    total: list.reduce((s, a) => s + a.balanceDue, 0),
    count: list.length,
  };
}

export function FinanceKpis({
  dre,
  prevDre,
  cashflow,
  summary,
  loading,
}: {
  dre?: DreReport;
  prevDre?: DreReport;
  cashflow?: Cashflow;
  summary?: FinanceSummary;
  loading: boolean;
}) {
  const overdueRecv = overdueOf(summary?.receivables);
  const overduePay = overdueOf(summary?.payables);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <ResultCard
          loading={loading}
          value={dre?.netResult ?? 0}
          margin={dre?.netMargin ?? 0}
          trend={delta(dre?.netResult ?? 0, prevDre?.netResult)}
        />
        <Kpi
          loading={loading}
          label="Receita"
          value={dre?.revenue ?? 0}
          tone="primary"
          trend={delta(dre?.revenue ?? 0, prevDre?.revenue)}
        />
        <Kpi
          loading={loading}
          label="Saldo do período"
          value={cashflow?.saldo ?? 0}
          tone={(cashflow?.saldo ?? 0) < 0 ? "pay" : "receive"}
          icon={Scale}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          loading={loading}
          label="Entradas"
          value={cashflow?.entradas ?? 0}
          tone="receive"
          icon={ArrowDownLeft}
        />
        <Kpi
          loading={loading}
          label="Saídas"
          value={cashflow?.saidas ?? 0}
          tone="pay"
          icon={ArrowUpRight}
        />
        <Kpi
          loading={loading}
          label="A receber"
          value={summary?.totalReceivable ?? 0}
          tone="receive"
          icon={Wallet}
          hint={
            overdueRecv.count > 0
              ? `${formatCurrency(overdueRecv.total)} vencido${overdueRecv.count > 1 ? "s" : ""}`
              : undefined
          }
        />
        <Kpi
          loading={loading}
          label="A pagar"
          value={summary?.totalPayable ?? 0}
          tone="pay"
          icon={Wallet}
          hint={
            overduePay.count > 0
              ? `${formatCurrency(overduePay.total)} vencido${overduePay.count > 1 ? "s" : ""}`
              : undefined
          }
        />
      </div>
    </div>
  );
}

function ResultCard({
  loading,
  value,
  margin,
  trend,
}: {
  loading: boolean;
  value: number;
  margin: number;
  trend: Trend | null;
}) {
  const positive = value >= 0;
  return (
    <Card className="lg:col-span-2">
      <CardContent className="flex h-full flex-col justify-between gap-2 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resultado do período
          </p>
          <TrendBadge trend={trend} />
        </div>
        {loading ? (
          <Skeleton className="h-10 w-48" />
        ) : (
          <p
            className={cn(
              "font-serif text-4xl font-semibold tracking-tight tabular-nums",
              positive ? "text-success" : "text-destructive",
            )}
          >
            {formatCurrency(value)}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Margem líquida{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatPercent(margin)}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

function Kpi({
  loading,
  label,
  value,
  tone,
  icon: Icon,
  hint,
  trend,
}: {
  loading: boolean;
  label: string;
  value: number;
  tone: "primary" | "receive" | "pay";
  icon?: typeof Wallet;
  hint?: string;
  trend?: Trend | null;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          {Icon ? (
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                tone === "pay"
                  ? "bg-clay/12 text-clay"
                  : tone === "receive"
                    ? "bg-success/12 text-success"
                    : "bg-primary/10 text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          ) : (
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
          )}
          {trend !== undefined ? <TrendBadge trend={trend ?? null} /> : null}
        </div>
        <div className="space-y-0.5">
          {Icon ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
          ) : null}
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(value)}
            </p>
          )}
          {hint ? (
            <p className="text-xs font-medium text-destructive tabular-nums">
              {hint}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendBadge({ trend }: { trend: Trend | null }) {
  if (!trend) return null;
  const Icon = trend.up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        trend.up ? "text-success" : "text-destructive",
      )}
      title="vs. período anterior"
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(trend.pct).toFixed(0)}%
    </span>
  );
}
