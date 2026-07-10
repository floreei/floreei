"use client";

import type { StoreOrder, StoreOrderStatus } from "@sistema-flores/types";
import { ExternalLink, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SalesFilters } from "@/components/shared/sales-filters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStoreOrders } from "@/lib/api/store";
import { useDebounce } from "@/lib/use-debounce";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const statusFilters: Array<{ label: string; value?: StoreOrderStatus }> = [
  { label: "Todos" },
  { label: "Pagos", value: "PAID" },
  { label: "Aguardando", value: "PENDING" },
  { label: "Cancelados", value: "CANCELED" },
];

const statusInfo: Record<
  StoreOrderStatus,
  { label: string; variant: "success" | "warning" | "secondary" | "destructive" }
> = {
  PAID: { label: "Pago", variant: "success" },
  PENDING: { label: "Aguardando pagamento", variant: "warning" },
  CANCELED: { label: "Cancelado", variant: "secondary" },
  FAILED: { label: "Falhou", variant: "destructive" },
};

function itemsSummary(order: StoreOrder): string {
  const count = order.items.reduce((s, i) => s + i.quantity, 0);
  const first = order.items[0]?.name ?? "";
  if (order.items.length <= 1) return `${count}× ${first}`;
  return `${count} itens · ${first}…`;
}

export default function StoreOrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StoreOrderStatus | undefined>();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const { data, isLoading } = useStoreOrders({
    search: debounced || undefined,
    status,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize: 20,
  });

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const changeStatus = (value: StoreOrderStatus | undefined) => {
    setStatus(value);
    setPage(1);
  };
  const changeDate = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom);
    setTo(nextTo);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos da loja"
        description="Compras feitas na sua loja online. As pagas viram venda automaticamente."
      />

      <SalesFilters
        search={search}
        onSearchChange={changeSearch}
        from={from}
        to={to}
        onDateChange={changeDate}
        searchPlaceholder="Buscar por cliente ou telefone…"
      />

      <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0">
        {statusFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => changeStatus(f.value)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors sm:px-3 sm:py-1.5",
              status === f.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            {/* Celular: cartões — toque abre a venda vinculada (quando há) */}
            <div className="space-y-2 p-3 sm:hidden">
              {data.data.map((order) => {
                const info = statusInfo[order.status];
                return (
                  <ListCard
                    key={`m-${order.id}`}
                    href={order.eventId ? `/vendas/${order.eventId}` : undefined}
                    title={order.customerName}
                    subtitle={`${formatDate(order.createdAt)} · ${itemsSummary(order)}`}
                    meta={formatCurrency(order.total)}
                    metaSub={<Badge variant={info.variant}>{info.label}</Badge>}
                  />
                );
              })}
            </div>
            <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Venda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((order) => {
                const info = statusInfo[order.status];
                return (
                  <TableRow key={order.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{order.customerName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {order.customerPhone}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {itemsSummary(order)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={info.variant}>{info.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.eventId ? (
                        <Link
                          href={`/vendas/${order.eventId}`}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Abrir <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
            </div>
          </>
        ) : debounced || status || from || to ? (
          <EmptyState
            className="border-0"
            icon={<ShoppingBag />}
            title="Nada encontrado"
            description="Nenhum pedido bate com esses filtros."
          />
        ) : (
          <EmptyState
            className="border-0"
            icon={<ShoppingBag />}
            title="Nenhum pedido ainda"
            description="Quando alguém comprar na sua loja online, o pedido aparece aqui."
          />
        )}
      </Card>

      {data ? <Pagination data={data} onPageChange={setPage} /> : null}
    </div>
  );
}
