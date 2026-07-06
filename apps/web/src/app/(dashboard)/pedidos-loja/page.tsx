"use client";

import type { StoreOrder, StoreOrderStatus } from "@sistema-flores/types";
import { ExternalLink, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
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
import { formatCurrency, formatDate } from "@/lib/utils";

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
  const { data, isLoading } = useStoreOrders();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos da loja"
        description="Compras feitas na sua loja online. As pagas viram venda automaticamente."
      />

      <Card>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
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
              {data.map((order) => {
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
                          href={`/eventos/${order.eventId}`}
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
        ) : (
          <EmptyState
            className="border-0"
            icon={<ShoppingBag />}
            title="Nenhum pedido ainda"
            description="Quando alguém comprar na sua loja online, o pedido aparece aqui."
          />
        )}
      </Card>
    </div>
  );
}
