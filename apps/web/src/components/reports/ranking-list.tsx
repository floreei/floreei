"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface RankRow {
  id: string;
  name: string;
  /** Valor que dimensiona a barra e a participação (%). */
  value: number;
  /** Valor principal já formatado (ex.: "R$ 1.200,00"). */
  valueLabel: string;
  /** Linha secundária (ex.: "30 un · lucro R$ 180 · margem 60%"). */
  sub?: string;
}

/** Lista ranqueada com barra de participação e % — clara de bater o olho. */
export function RankingList({
  rows,
  loading,
  empty,
  tone = "primary",
}: {
  rows: RankRow[];
  loading: boolean;
  empty: string;
  tone?: "primary" | "clay" | "chart-3";
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>
    );
  }

  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  const barColor = {
    primary: "bg-primary",
    clay: "bg-clay",
    "chart-3": "bg-chart-3",
  }[tone];

  return (
    <ul className="divide-y divide-border">
      {rows.map((r, i) => {
        const share = Math.round((r.value / total) * 100);
        return (
          <li key={r.id} className="space-y-1.5 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <span className="truncate font-medium">{r.name}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {r.valueLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-7">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full", barColor)}
                  style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {share}%
              </span>
            </div>
            {r.sub ? (
              <p className="pl-7 text-xs text-muted-foreground">{r.sub}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
