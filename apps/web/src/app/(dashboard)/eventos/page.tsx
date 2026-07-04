"use client";

import type { EventType } from "@sistema-flores/types";
import { CalendarHeart, Plus } from "lucide-react";
import { useState } from "react";
import { QuickSaleDialog } from "@/components/events/quick-sale-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  EventStatusBadge,
  EventTypeBadge,
} from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
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
import { useEvents } from "@/lib/api/events";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const filters: Array<{ label: string; value?: EventType }> = [
  { label: "Todas" },
  { label: "Pedidos", value: "ORDER" },
  { label: "Eventos", value: "EVENT" },
];

export default function EventsPage() {
  const [type, setType] = useState<EventType | undefined>();
  const { data, isLoading } = useEvents({ type });
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Pedidos de balcão/entrega e eventos de decoração — valores e entregas."
      >
        <Button onClick={() => setQuickOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova venda
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setType(f.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              type === f.value
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venda</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Vendido</TableHead>
                <TableHead className="hidden text-right md:table-cell">Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((event) => (
                <TableRow
                  key={event.id}
                  className="cursor-pointer"
                  onClick={() => {
                    window.location.href = `/eventos/${event.id}`;
                  }}
                >
                  <TableCell>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.customer?.name ?? "Consumidor"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <EventTypeBadge type={event.type} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatDate(event.date)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <EventStatusBadge status={event.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(event.soldValue)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                    {formatCurrency(event.receivedValue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            className="border-0"
            icon={<CalendarHeart />}
            title="Nenhuma venda"
            description="Registre um pedido de balcão/entrega ou converta um orçamento em evento."
            action={
              <Button onClick={() => setQuickOpen(true)}>
                <Plus className="h-4 w-4" />
                Nova venda
              </Button>
            }
          />
        )}
      </Card>

      <QuickSaleDialog open={quickOpen} onOpenChange={setQuickOpen} />
    </div>
  );
}
