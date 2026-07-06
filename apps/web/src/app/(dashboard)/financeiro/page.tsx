"use client";

import type { OpenAccount } from "@sistema-flores/types";
import { useMemo, useState } from "react";
import { AccountsPanel } from "@/components/finance/accounts-panel";
import { DreCard } from "@/components/finance/dre-card";
import { ExpensesBars } from "@/components/finance/expenses-bars";
import { FinanceKpis } from "@/components/finance/finance-kpis";
import { MonthlyCashflowCard } from "@/components/finance/monthly-cashflow";
import { PaymentDialog } from "@/components/finance/payment-dialog";
import { PeriodFilter } from "@/components/finance/period-filter";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useCashflow, useDre, useFinanceSummary } from "@/lib/api/finance";
import { resolvePeriod, type PeriodPreset } from "@/lib/finance-period";

export default function FinancePage() {
  const [preset, setPreset] = useState<PeriodPreset>("thisMonth");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const range = useMemo(() => resolvePeriod(preset, custom), [preset, custom]);

  const { data: dre, isLoading: dreLoading } = useDre(range.from, range.to);
  const { data: prevDre } = useDre(range.prevFrom, range.prevTo);
  const { data: cashflow, isLoading: cashLoading } = useCashflow(
    range.from,
    range.to,
  );
  const { data: summary, isLoading: sumLoading } = useFinanceSummary();

  const [baixa, setBaixa] = useState<{
    mode: "receive" | "pay";
    account: OpenAccount;
  } | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Resultado, caixa e contas do período — de bater o olho."
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

      <FinanceKpis
        dre={dre}
        prevDre={prevDre}
        cashflow={cashflow}
        summary={summary}
        loading={dreLoading || cashLoading || sumLoading}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyCashflowCard />
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="text-sm font-semibold">Para onde vai o dinheiro</h3>
              <p className="text-xs text-muted-foreground">
                Despesas por centro de custo no período.
              </p>
            </div>
            <ExpensesBars
              expenses={dre?.expenses ?? []}
              total={dre?.expensesTotal ?? 0}
              loading={dreLoading}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DreCard dre={dre} loading={dreLoading} />
        </div>
        <div className="space-y-3 lg:col-span-2">
          <h3 className="text-sm font-semibold">Contas em aberto</h3>
          <AccountsPanel
            loading={sumLoading}
            receivables={summary?.receivables ?? []}
            payables={summary?.payables ?? []}
            onAction={(mode, account) => setBaixa({ mode, account })}
          />
        </div>
      </div>

      {baixa ? (
        <PaymentDialog
          open
          onOpenChange={(o) => !o && setBaixa(null)}
          mode={baixa.mode}
          targetId={baixa.account.id}
          balanceDue={baixa.account.balanceDue}
        />
      ) : null}
    </div>
  );
}
