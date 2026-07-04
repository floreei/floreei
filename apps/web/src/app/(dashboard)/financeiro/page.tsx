"use client";

import type { OpenAccount } from "@sistema-flores/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Scale,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { PaymentDialog } from "@/components/finance/payment-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDre, useFinanceSummary } from "@/lib/api/finance";
import { cn, formatCurrency, formatDate, formatPercent } from "@/lib/utils";

export default function FinancePage() {
  const { data, isLoading } = useFinanceSummary();
  const [baixa, setBaixa] = useState<{
    mode: "receive" | "pay";
    account: OpenAccount;
  } | null>(null);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Financeiro"
        description="Quem te deve, quem você precisa pagar e o caixa do mês."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi
          icon={ArrowDownLeft}
          label="A receber"
          value={isLoading ? null : formatCurrency(data?.totalReceivable ?? 0)}
          tone="receive"
        />
        <Kpi
          icon={ArrowUpRight}
          label="A pagar"
          value={isLoading ? null : formatCurrency(data?.totalPayable ?? 0)}
          tone="pay"
        />
        <Kpi
          icon={CheckCircle2}
          label="Recebido no mês"
          value={isLoading ? null : formatCurrency(data?.receivedThisMonth ?? 0)}
        />
        <Kpi
          icon={Wallet}
          label="Pago no mês"
          value={isLoading ? null : formatCurrency(data?.paidThisMonth ?? 0)}
        />
        <Kpi
          icon={Scale}
          label="Saldo do mês"
          value={isLoading ? null : formatCurrency(data?.netThisMonth ?? 0)}
          tone={data && data.netThisMonth < 0 ? "pay" : "receive"}
        />
      </div>

      <Tabs defaultValue="receivables">
        <TabsList>
          <TabsTrigger value="receivables">
            A receber{data ? ` (${data.receivables.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="payables">
            A pagar{data ? ` (${data.payables.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="dre">DRE do mês</TabsTrigger>
        </TabsList>

        <TabsContent value="receivables">
          <AccountsTable
            loading={isLoading}
            partyLabel="Cliente"
            accounts={data?.receivables ?? []}
            actionLabel="Receber"
            emptyTitle="Nada a receber"
            emptyDescription="Todos os eventos estão quitados."
            onAction={(account) => setBaixa({ mode: "receive", account })}
          />
        </TabsContent>
        <TabsContent value="payables">
          <AccountsTable
            loading={isLoading}
            partyLabel="Fornecedor"
            accounts={data?.payables ?? []}
            actionLabel="Pagar"
            emptyTitle="Nada a pagar"
            emptyDescription="Nenhuma compra com saldo em aberto."
            onAction={(account) => setBaixa({ mode: "pay", account })}
          />
        </TabsContent>
        <TabsContent value="dre">
          <DreStatement />
        </TabsContent>
      </Tabs>

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

function AccountsTable({
  loading,
  accounts,
  partyLabel,
  actionLabel,
  emptyTitle,
  emptyDescription,
  onAction,
}: {
  loading: boolean;
  accounts: OpenAccount[];
  partyLabel: string;
  actionLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  onAction: (account: OpenAccount) => void;
}) {
  if (loading) {
    return (
      <Card>
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <EmptyState
          className="border-0"
          icon={<CheckCircle2 />}
          title={emptyTitle}
          description={emptyDescription}
        />
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{partyLabel}</TableHead>
            <TableHead className="hidden lg:table-cell">Referência</TableHead>
            <TableHead className="hidden md:table-cell">Data</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Total</TableHead>
            <TableHead className="hidden text-right md:table-cell">Pago</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="sm:w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={`${account.kind}-${account.id}`}>
              <TableCell className="font-medium">{account.partyName}</TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {account.title}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatDate(account.date)}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                {formatCurrency(account.total)}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                {formatCurrency(account.paid)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold text-clay">
                {formatCurrency(account.balanceDue)}
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => onAction(account)}>
                  {actionLabel}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function DreStatement() {
  const { data, isLoading } = useDre();

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-1 p-6">
        <DreLine label="Receita bruta (eventos)" value={data.revenue} />
        <DreLine label="(−) Custo das mercadorias (compras)" value={-data.cmv} muted />
        <div className="my-1 border-t border-border" />
        <DreLine
          label="= Lucro bruto"
          value={data.grossProfit}
          strong
          hint={`margem ${formatPercent(data.grossMargin)}`}
        />
        <div className="pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Despesas operacionais
          </p>
        </div>
        {data.expenses.length === 0 ? (
          <p className="py-1 text-sm text-muted-foreground">Nenhuma despesa no período.</p>
        ) : (
          data.expenses.map((e) => (
            <DreLine key={e.costCenter} label={e.costCenter} value={-e.amount} muted indent />
          ))
        )}
        <DreLine label="(−) Total de despesas" value={-data.expensesTotal} muted />
        <div className="my-1 border-t border-border" />
        <DreLine
          label="= Resultado do período"
          value={data.netResult}
          strong
          accent={data.netResult >= 0}
          danger={data.netResult < 0}
          hint={`margem ${formatPercent(data.netMargin)}`}
        />
      </CardContent>
    </Card>
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
    <div
      className={cn(
        "flex items-center justify-between py-1.5",
        indent && "pl-4",
      )}
    >
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

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string | null;
  tone?: "receive" | "pay";
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
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
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {value === null ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
