"use client";

import type {
  AtRiskCustomer,
  IdleItem,
  PartyRanking,
  SalesChannel,
  SoldItemRanking,
} from "@sistema-flores/types";
import { Flower, Package, TrendingDown, TrendingUp, Users } from "lucide-react";
import { RankingList, type RankRow } from "@/components/reports/ranking-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSalesInsights } from "@/lib/api/events";
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

/** Insights práticos da tela de Vendas, respeitando o período e o canal. */
export function SalesInsightsPanel({
  from,
  to,
  channel,
}: {
  from: string;
  to: string;
  channel?: SalesChannel;
}) {
  const { data, isLoading } = useSalesInsights(from, to, channel);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
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
