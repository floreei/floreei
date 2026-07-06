"use client";

import type { DreExpenseLine } from "@sistema-flores/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--clay))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-5))",
  "hsl(var(--warning))",
  "hsl(var(--chart-4))",
];

/** Despesas por centro de custo em barras horizontais ranqueadas. */
export function ExpensesBars({
  expenses,
  total,
  loading,
}: {
  expenses: DreExpenseLine[];
  total: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma despesa no período.
      </p>
    );
  }

  const sorted = [...expenses].sort((a, b) => b.amount - a.amount);
  const max = sorted[0]?.amount || 1;

  return (
    <div className="space-y-3.5">
      {sorted.map((e, i) => {
        const pct = total > 0 ? Math.round((e.amount / total) * 100) : 0;
        return (
          <div key={e.costCenter}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{e.costCenter}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatCurrency(e.amount)}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {pct}%
                </span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.max(2, (e.amount / max) * 100)}%`,
                  background: PALETTE[i % PALETTE.length],
                }}
              />
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">Total de despesas</span>
        <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
