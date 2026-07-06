"use client";

import type { DreReport } from "@sistema-flores/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

export function DreCard({
  dre,
  loading,
}: {
  dre?: DreReport;
  loading: boolean;
}) {
  if (loading || !dre) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const despesas = dre.expensesTotal + dre.losses;

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-sm font-semibold">Resultado do período (DRE)</h3>
          <p className="text-xs text-muted-foreground">
            Por competência: o custo é o do que foi vendido, não das compras.
          </p>
        </div>

        <CompositionBar
          revenue={dre.revenue}
          cmv={dre.cmv}
          despesas={despesas}
          result={dre.netResult}
        />

        <div className="space-y-1">
          <DreLine label="Receita bruta (vendas)" value={dre.revenue} />
          <DreLine
            label="(−) Custo do que foi vendido (COGS)"
            value={-dre.cmv}
            muted
          />
          <div className="my-1 border-t border-border" />
          <DreLine
            label="= Lucro bruto"
            value={dre.grossProfit}
            strong
            hint={`margem ${formatPercent(dre.grossMargin)}`}
          />
          <p className="pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Despesas operacionais
          </p>
          {dre.expenses.length === 0 ? (
            <p className="py-1 text-sm text-muted-foreground">
              Nenhuma despesa no período.
            </p>
          ) : (
            dre.expenses.map((e) => (
              <DreLine
                key={e.costCenter}
                label={e.costCenter}
                value={-e.amount}
                muted
                indent
              />
            ))
          )}
          <DreLine
            label="(−) Total de despesas"
            value={-dre.expensesTotal}
            muted
          />
          {dre.losses > 0 ? (
            <DreLine label="(−) Perdas de estoque" value={-dre.losses} muted />
          ) : null}
          <div className="my-1 border-t border-border" />
          <DreLine
            label="= Resultado do período"
            value={dre.netResult}
            strong
            accent={dre.netResult >= 0}
            danger={dre.netResult < 0}
            hint={`margem ${formatPercent(dre.netMargin)}`}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Compras no período (saída de caixa, não entra no resultado):{" "}
          {formatCurrency(dre.purchasesTotal)}.
        </p>
      </CardContent>
    </Card>
  );
}

function CompositionBar({
  revenue,
  cmv,
  despesas,
  result,
}: {
  revenue: number;
  cmv: number;
  despesas: number;
  result: number;
}) {
  const den = Math.max(revenue, cmv + despesas, 1);
  const w = (v: number) => `${Math.max(0, (v / den) * 100)}%`;
  const segments = [
    { key: "cmv", label: "Custo", value: cmv, className: "bg-muted-foreground/50" },
    { key: "desp", label: "Despesas", value: despesas, className: "bg-clay" },
    {
      key: "res",
      label: "Resultado",
      value: Math.max(0, result),
      className: "bg-success",
    },
  ].filter((s) => s.value > 0);

  if (revenue <= 0) {
    return (
      <p className="text-xs text-muted-foreground">Sem receita no período.</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
        {segments.map((s) => (
          <div key={s.key} className={s.className} style={{ width: w(s.value) }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Legend className="bg-muted-foreground/50" label="Custo (CMV)" />
        <Legend className="bg-clay" label="Despesas" />
        <Legend className="bg-success" label="Resultado" />
        {result < 0 ? (
          <span className="text-destructive">Resultado negativo no período</span>
        ) : null}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block h-2.5 w-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}

function DreLine({
  label,
  value,
  strong,
  muted,
  accent,
  danger,
  indent,
  hint,
}: {
  label: string;
  value: number;
  strong?: boolean;
  muted?: boolean;
  accent?: boolean;
  danger?: boolean;
  indent?: boolean;
  hint?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between py-1.5", indent && "pl-4")}>
      <span
        className={cn(
          "text-sm",
          strong ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {hint ? (
          <span className="ml-2 text-xs text-muted-foreground">· {hint}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "tabular-nums",
          strong ? "text-base font-semibold" : "text-sm",
          accent && "text-success",
          danger && "text-destructive",
          muted && !accent && !danger && "text-muted-foreground",
        )}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}
