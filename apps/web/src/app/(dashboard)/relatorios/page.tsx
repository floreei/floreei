"use client";

import { useMemo, useState } from "react";
import { PeriodFilter } from "@/components/finance/period-filter";
import { RankingList, type RankRow } from "@/components/reports/ranking-list";
import { ReportKpis } from "@/components/reports/report-kpis";
import { RevenueProfitChart } from "@/components/reports/revenue-profit-chart";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReport } from "@/lib/api/reports";
import { resolvePeriod, type PeriodPreset } from "@/lib/finance-period";
import { formatCurrency } from "@/lib/utils";

const num = (n: number) => n.toLocaleString("pt-BR");
const plural = (n: number, one: string, many: string) =>
  `${num(n)} ${n === 1 ? one : many}`;

export default function ReportsPage() {
  const [preset, setPreset] = useState<PeriodPreset>("thisMonth");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const range = useMemo(() => resolvePeriod(preset, custom), [preset, custom]);

  const { data, isLoading } = useReport(range.from, range.to);
  const { data: prev } = useReport(range.prevFrom, range.prevTo);

  const productRows: RankRow[] = (data?.topProducts ?? []).map((p) => {
    const margin = p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0;
    return {
      id: p.productId,
      name: p.name,
      value: p.revenue,
      valueLabel: formatCurrency(p.revenue),
      sub: `${plural(p.quantity, "un", "un")} · lucro ${formatCurrency(p.profit)} · margem ${margin}%`,
    };
  });

  const customerRows: RankRow[] = (data?.customers ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    value: c.total,
    valueLabel: formatCurrency(c.total),
    sub: plural(c.count, "venda", "vendas"),
  }));

  const supplierRows: RankRow[] = (data?.suppliers ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    value: s.total,
    valueLabel: formatCurrency(s.total),
    sub: plural(s.count, "compra", "compras"),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="O desempenho do seu negócio no período — receita, lucro e rankings."
      />

      <PeriodFilter
        preset={preset}
        from={range.from}
        to={range.to}
        onPreset={setPreset}
        onCustom={(from, to) => {
          setPreset("custom");
          setCustom({ from, to });
        }}
      />

      <ReportKpis
        summary={data?.summary}
        prevSummary={prev?.summary}
        loading={isLoading}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receita e lucro por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueProfitChart
            monthly={data?.monthly ?? []}
            from={range.from}
            to={range.to}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Produtos mais vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <RankingList
            rows={productRows}
            loading={isLoading}
            empty="Sem vendas no período."
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes que mais compraram</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingList
              rows={customerRows}
              loading={isLoading}
              empty="Sem clientes no período."
              tone="clay"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compras por fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingList
              rows={supplierRows}
              loading={isLoading}
              empty="Sem compras no período."
              tone="chart-3"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
