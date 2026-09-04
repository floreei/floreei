"use client";

import type {
  PeriodResult,
  PeriodResultExpenseGroup,
  PeriodResultOrder,
} from "@sistema-flores/types";
import { ChevronDown, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriodResult, type SalesInsightsFilters } from "@/lib/api/events";
import { unitLabels } from "@/lib/labels";
import { cn, formatCurrency, formatDate, formatPercent } from "@/lib/utils";

const money = (v: number | null) => (v === null ? "—" : formatCurrency(v));

/**
 * Resultado do período da tela Atacado: vendas (receita, custo, lucro), lucro
 * por pedido e por item, despesas lançadas no período e o líquido.
 */
export function PeriodResultDialog({
  open,
  onOpenChange,
  filters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SalesInsightsFilters;
}) {
  const { data, isLoading } = usePeriodResult(filters, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Resultado do período</DialogTitle>
          <DialogDescription>
            {data
              ? `${formatDate(data.from)} até ${formatDate(data.to)}`
              : "Lucro das vendas, despesas lançadas e o que sobra."}
            {data?.defaultedPeriod
              ? " · Sem período escolhido: mostrando o mês atual."
              : null}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <SalesTiles sales={data.sales} />
            <OrdersSection orders={data.orders} />
            <ExpensesSection expenses={data.expenses} />
            <NetBlock data={data} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="space-y-0.5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </h3>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-semibold tabular-nums",
          tone === "good" && "text-emerald-700 dark:text-emerald-400",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </p>
      {sub ? <p className="text-xs tabular-nums text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function SalesTiles({ sales }: { sales: PeriodResult["sales"] }) {
  const hasPartners = sales.partnersShare > 0;
  return (
    <section className="space-y-3">
      <SectionTitle icon={<ShoppingBag className="h-4 w-4" />} title="Vendas" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="Pedidos" value={String(sales.count)} />
        <Tile label="Receita" value={formatCurrency(sales.revenue)} />
        <Tile label="Custo das flores" value={formatCurrency(sales.cost)} />
        <Tile
          label="Lucro bruto"
          value={formatCurrency(sales.grossProfit)}
          sub={
            hasPartners
              ? `sua parte ${formatCurrency(sales.myProfit)}`
              : sales.grossMargin === null
                ? undefined
                : `margem ${formatPercent(sales.grossMargin)}`
          }
          tone={sales.grossProfit < 0 ? "bad" : "good"}
        />
      </div>
    </section>
  );
}

function OrdersSection({ orders }: { orders: PeriodResultOrder[] }) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpenIds((s) => ({ ...s, [id]: !s[id] }));

  return (
    <section className="space-y-3">
      <SectionTitle
        icon={<Receipt className="h-4 w-4" />}
        title="Por pedido"
        hint="Toque num pedido para ver o lucro de cada item."
      />
      {orders.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma venda no período.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {orders.map((o) => {
            const isOpen = Boolean(openIds[o.id]);
            const myProfit = o.partnersShare === 0 ? o.profit : o.myProfit;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => toggle(o.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-[44px] w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50"
                >
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.customerName ?? o.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.date)}</p>
                  </div>
                  <div className="grid shrink-0 grid-cols-4 gap-3 text-right text-xs tabular-nums">
                    <span>
                      <span className="block text-muted-foreground">Venda</span>
                      {formatCurrency(o.soldValue)}
                    </span>
                    <span>
                      <span className="block text-muted-foreground">Custo</span>
                      {formatCurrency(o.cost)}
                    </span>
                    <span className={cn("font-semibold", o.profit < 0 && "text-destructive")}>
                      <span className="block font-normal text-muted-foreground">Lucro</span>
                      {formatCurrency(o.profit)}
                    </span>
                    <span className={cn("font-semibold", myProfit < 0 && "text-destructive")}>
                      <span className="block font-normal text-muted-foreground">Sua parte</span>
                      {formatCurrency(myProfit)}
                    </span>
                  </div>
                </button>
                {isOpen ? (
                  <div className="overflow-x-auto border-t border-border bg-muted/20 px-3 py-2">
                    {o.items.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Venda sem itens detalhados.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="text-muted-foreground">
                          <tr>
                            <th className="py-1 text-left font-normal">Item</th>
                            <th className="py-1 text-right font-normal">Qtd</th>
                            <th className="py-1 text-right font-normal">Custo un.</th>
                            <th className="py-1 text-right font-normal">Preço un.</th>
                            <th className="py-1 text-right font-normal">Lucro</th>
                            <th className="py-1 text-right font-normal">Sua parte</th>
                          </tr>
                        </thead>
                        <tbody className="tabular-nums">
                          {o.items.map((it, idx) => (
                            <tr key={idx}>
                              <td className="py-1 pr-2">{it.description}</td>
                              <td className="py-1 text-right">
                                {it.quantity} {unitLabels[it.unit]}
                              </td>
                              <td className="py-1 text-right">{money(it.unitCost)}</td>
                              <td className="py-1 text-right">{formatCurrency(it.unitSalePrice)}</td>
                              <td className={cn("py-1 text-right font-medium", (it.lineProfit ?? 0) < 0 && "text-destructive")}>
                                {money(it.lineProfit)}
                                {it.profitShares > 1 ? (
                                  <span className="ml-1 font-normal text-muted-foreground">
                                    ÷{it.profitShares}
                                  </span>
                                ) : null}
                              </td>
                              <td className={cn("py-1 text-right font-medium", (it.myLineProfit ?? 0) < 0 && "text-destructive")}>
                                {money(it.myLineProfit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ExpensesSection({ expenses }: { expenses: PeriodResult["expenses"] }) {
  return (
    <section className="space-y-3">
      <SectionTitle
        icon={<Wallet className="h-4 w-4" />}
        title="Despesas do período"
        hint="Lançadas em Despesas, com vencimento no período. São de toda a empresa, não só do atacado."
      />
      {expenses.groups.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma despesa lançada no período.</p>
      ) : (
        <div className="space-y-3">
          {expenses.groups.map((g) => (
            <ExpenseGroup key={g.costCenter} group={g} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
        <span className="font-medium">Total de despesas</span>
        <span className="text-right tabular-nums">
          <span className="font-semibold">{formatCurrency(expenses.total)}</span>
          {expenses.unpaidTotal > 0 ? (
            <span className="block text-xs text-muted-foreground">
              sendo {formatCurrency(expenses.unpaidTotal)} ainda em aberto
            </span>
          ) : null}
        </span>
      </div>
    </section>
  );
}

function ExpenseGroup({ group }: { group: PeriodResultExpenseGroup }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between bg-muted/30 px-3 py-2 text-sm">
        <span className="font-medium">{group.costCenter}</span>
        <span className="tabular-nums">{formatCurrency(group.total)}</span>
      </div>
      <ul className="divide-y divide-border">
        {group.entries.map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate">{e.description}</p>
              <p className="text-xs text-muted-foreground">vence {formatDate(e.dueDate)}</p>
            </div>
            <Badge variant={e.paid ? "success" : e.overdue ? "destructive" : "outline"}>
              {e.paid ? "Paga" : e.overdue ? "Vencida" : "Em aberto"}
            </Badge>
            <span className="w-24 text-right tabular-nums">{formatCurrency(e.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NetBlock({ data }: { data: PeriodResult }) {
  const negative = data.net.value < 0;
  const hasPartners = data.sales.partnersShare > 0;
  return (
    <section
      className={cn(
        "rounded-lg border p-4",
        negative ? "border-destructive/40 bg-destructive/5" : "border-primary/40 bg-primary/5",
      )}
      data-testid="period-net"
    >
      <dl className="space-y-1 text-sm tabular-nums">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Lucro bruto das vendas</dt>
          <dd>{formatCurrency(data.sales.grossProfit)}</dd>
        </div>
        {hasPartners ? (
          <>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Parte dos sócios</dt>
              <dd>− {formatCurrency(data.sales.partnersShare)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Lucro seu</dt>
              <dd>{formatCurrency(data.sales.myProfit)}</dd>
            </div>
          </>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Despesas do período</dt>
          <dd>− {formatCurrency(data.expenses.total)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-2">
          <dt className="text-base font-semibold">Resultado líquido</dt>
          <dd className={cn("text-xl font-semibold", negative && "text-destructive")}>
            {formatCurrency(data.net.value)}
          </dd>
        </div>
        {data.net.margin !== null ? (
          <p className="text-right text-xs text-muted-foreground">
            margem líquida {formatPercent(data.net.margin)}
          </p>
        ) : null}
      </dl>
    </section>
  );
}
