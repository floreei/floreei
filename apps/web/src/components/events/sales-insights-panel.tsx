"use client";

import type {
  AtRiskCustomer,
  IdleItem,
  PartyRanking,
  PendingDeliveries,
  PendingDeliveryItem,
  SoldItemRanking,
} from "@sistema-flores/types";
import {
  Flower,
  Package,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { RankingList, type RankRow } from "@/components/reports/ranking-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSalesInsights,
  type SalesInsightsFilters,
} from "@/lib/api/events";
import { unitLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/utils";

function itemRows(items: SoldItemRanking[]): RankRow[] {
  return items.map((i) => ({
    id: `${i.kind}:${i.id}`,
    name: i.name,
    value: i.quantity,
    valueLabel: `${i.quantity} vend.`,
    sub: formatCurrency(i.revenue),
  }));
}

function customerRows(rows: PartyRanking[]): RankRow[] {
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    value: c.total,
    valueLabel: formatCurrency(c.total),
    sub: `${c.count} venda${c.count === 1 ? "" : "s"}`,
  }));
}

/** Insights práticos da tela de Vendas, respeitando período e filtros da tela. */
export function SalesInsightsPanel({ filters }: { filters: SalesInsightsFilters }) {
  const { data, isLoading } = useSalesInsights(filters);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4 p-5 lg:col-span-2">
        <SectionTitle
          icon={<Truck className="h-4 w-4" />}
          title="Falta entregar"
          hint="Vendas confirmadas ainda não entregues no período — por cliente."
        />
        <PendingDeliveriesList data={data?.pendingDeliveries} loading={isLoading} />
      </Card>

      <Card className="space-y-5 p-5">
        <SectionTitle icon={<TrendingUp className="h-4 w-4" />} title="Mais vendidos" />
        <RankingList
          rows={itemRows(data?.topItems ?? [])}
          loading={isLoading}
          empty="Nenhuma venda no período."
        />
        <div className="border-t border-border pt-4">
          <SectionTitle
            icon={<TrendingDown className="h-4 w-4" />}
            title="Parados (0 vendas no período)"
            hint="Encalhados — vale um empurrão."
          />
          <IdleList items={data?.idleItems ?? []} loading={isLoading} />
        </div>
      </Card>

      <Card className="space-y-5 p-5">
        <SectionTitle icon={<Users className="h-4 w-4" />} title="Quem mais comprou" />
        <RankingList
          rows={customerRows(data?.topCustomers ?? [])}
          loading={isLoading}
          empty="Nenhuma venda com cliente no período."
          tone="clay"
        />
        <div className="border-t border-border pt-4">
          <SectionTitle
            icon={<TrendingDown className="h-4 w-4" />}
            title="Clientes em risco"
            hint="Compraram antes e sumiram no período."
          />
          <AtRiskList rows={data?.atRiskCustomers ?? []} loading={isLoading} />
        </div>
      </Card>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function IdleList({ items, loading }: { items: IdleItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="mt-3 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Tudo girou no período. 🎉
      </p>
    );
  }
  return (
    <ul className="mt-3 divide-y divide-border">
      {items.map((item) => (
        <li
          key={`${item.kind}:${item.id}`}
          className="flex items-center justify-between gap-3 py-2"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-muted-foreground">
              {item.kind === "arrangement" ? (
                <Flower className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </span>
            <span className="truncate text-sm">{item.name}</span>
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {item.lastSoldAt
              ? `última ${formatDate(item.lastSoldAt)}`
              : "nunca vendeu"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PendingDeliveriesList({
  data,
  loading,
}: {
  data: PendingDeliveries | undefined;
  loading: boolean;
}) {
  if (loading || !data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (data.salesCount === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nada pendente de entrega no período.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">
          {data.totalQuantity}
        </span>{" "}
        {data.totalQuantity === 1 ? "item" : "itens"} em{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {data.salesCount}
        </span>{" "}
        {data.salesCount === 1 ? "entrega" : "entregas"}
      </p>
      <ul className="divide-y divide-border">
        {data.customers.map((c) => (
          <li key={c.id ?? "sem-cliente"} className="py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium">
                {c.name ?? "Sem cliente"}
              </span>
              <span className="flex shrink-0 items-baseline gap-3">
                <span className="text-xs text-muted-foreground">
                  {c.salesCount} {c.salesCount === 1 ? "entrega" : "entregas"}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(c.totalValue)}
                </span>
              </span>
            </div>
            {c.items.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                {c.items.map((item) => (
                  <li
                    key={`${item.kind}:${item.id}:${item.unit}`}
                    className="text-xs text-muted-foreground"
                  >
                    <span className="font-medium text-foreground tabular-nums">
                      {item.quantity}
                    </span>{" "}
                    {(unitLabels[item.unit] ?? item.unit).toLowerCase()}
                    {item.quantity === 1 ? "" : "s"} — {item.name}{" "}
                    <span className="tabular-nums">
                      ({formatCurrency(item.value)})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Venda de valor livre (sem itens detalhados).
              </p>
            )}
          </li>
        ))}
      </ul>
      <PendingTotals data={data} />
    </div>
  );
}

/** Somatório por produto (todas as entregas pendentes juntas) + valor total. */
function PendingTotals({ data }: { data: PendingDeliveries }) {
  const totals = new Map<string, PendingDeliveryItem>();
  for (const c of data.customers) {
    for (const item of c.items) {
      const key = `${item.kind}:${item.id}:${item.unit}`;
      const prev = totals.get(key);
      if (prev) {
        prev.quantity += item.quantity;
        prev.value += item.value;
      } else {
        totals.set(key, { ...item });
      }
    }
  }
  const rows = [...totals.values()].sort((a, b) => b.quantity - a.quantity);
  if (rows.length === 0 && data.totalValue === 0) return null;

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {rows.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total por produto
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {rows.map((item) => (
              <li
                key={`${item.kind}:${item.id}:${item.unit}`}
                className="text-sm text-muted-foreground"
              >
                <span className="font-semibold text-foreground tabular-nums">
                  {item.quantity}
                </span>{" "}
                {(unitLabels[item.unit] ?? item.unit).toLowerCase()}
                {item.quantity === 1 ? "" : "s"} — {item.name}{" "}
                <span className="tabular-nums">
                  ({formatCurrency(item.value)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">Valor total a entregar</span>
        <span className="font-semibold tabular-nums">
          {formatCurrency(data.totalValue)}
        </span>
      </p>
    </div>
  );
}

function AtRiskList({
  rows,
  loading,
}: {
  rows: AtRiskCustomer[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="mt-3 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Ninguém sumiu no período.
      </p>
    );
  }
  return (
    <ul className="mt-3 divide-y divide-border">
      {rows.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 py-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{c.name}</span>
            <span className="block text-xs text-muted-foreground">
              {c.lastPurchaseAt
                ? `última compra ${formatDate(c.lastPurchaseAt)}`
                : "sem compras"}
            </span>
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatCurrency(c.total)}
          </span>
        </li>
      ))}
    </ul>
  );
}
