"use client";

import type { PaymentStatusFilter } from "@sistema-flores/types";
import { BarChart3, Boxes, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DeliveryToggle } from "@/components/events/delivery-toggle";
import { SalesInsightsPanel } from "@/components/events/sales-insights-panel";
import { useQuickSale } from "@/components/events/quick-sale-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SalesFilters } from "@/components/shared/sales-filters";
import {
  EventStatusBadge,
  PaymentStatusBadge,
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
import { useDebounce } from "@/lib/use-debounce";
import { cn, currentMonthRange, formatCurrency, formatDate } from "@/lib/utils";

const paymentFilters: Array<{ label: string; value?: PaymentStatusFilter }> = [
  { label: "Todos pagamentos" },
  { label: "Pagas", value: "paid" },
  { label: "Pendentes", value: "pending" },
];

const deliveryFilters: Array<{ label: string; value?: boolean }> = [
  { label: "Entrega: todas" },
  { label: "Entregues", value: true },
  { label: "A entregar", value: false },
];

export default function AtacadoPage() {
  const [payment, setPayment] = useState<PaymentStatusFilter | undefined>();
  const [delivered, setDelivered] = useState<boolean | undefined>();
  const [search, setSearch] = useState("");
  const initialRange = currentMonthRange();
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [page, setPage] = useState(1);
  const [showInsights, setShowInsights] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useEvents({
    channel: "WHOLESALE",
    paymentStatus: payment,
    delivered,
    search: debouncedSearch || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize: 20,
  });
  const { openWholesaleSale } = useQuickSale();

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const changePayment = (value: PaymentStatusFilter | undefined) => {
    setPayment(value);
    setPage(1);
  };
  const changeDelivered = (value: boolean | undefined) => {
    setDelivered(value);
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
        title="Atacado"
        description="Revenda de produto em pacote fechado (maço) para outros lojistas."
      >
        <Button onClick={openWholesaleSale}>
          <Plus className="h-4 w-4" />
          Nova venda no atacado
        </Button>
      </PageHeader>

      <SalesFilters
        search={search}
        onSearchChange={changeSearch}
        from={from}
        to={to}
        onDateChange={changeDate}
        searchPlaceholder="Buscar por lojista ou título…"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0">
          {paymentFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => changePayment(f.value)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors sm:px-3 sm:py-1.5",
                payment === f.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0">
          {deliveryFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => changeDelivered(f.value)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors sm:px-3 sm:py-1.5",
                delivered === f.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowInsights((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Insights do período
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              showInsights && "rotate-180",
            )}
          />
        </button>
        {showInsights ? (
          <div className="mt-4">
            <SalesInsightsPanel from={from} to={to} channel="WHOLESALE" />
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <Card>
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : data && data.data.length > 0 ? (
        <>
          {/* Celular: cartões tocáveis (linha inteira leva ao detalhe) */}
          <div className="space-y-2 sm:hidden">
            {data.data.map((event) => (
              <ListCard
                key={event.id}
                href={`/atacado/${event.id}`}
                title={event.title}
                subtitle={
                  <span className="flex items-center gap-1.5">
                    <span className="truncate">
                      {event.customer?.name ?? "Sem cliente"}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="shrink-0">{formatDate(event.date)}</span>
                  </span>
                }
                meta={formatCurrency(event.soldValue)}
                metaSub={
                  event.status === "CANCELED" ? (
                    <EventStatusBadge status={event.status} />
                  ) : (
                    <PaymentStatusBadge
                      sold={event.soldValue}
                      received={event.receivedValue}
                      date={event.date}
                    />
                  )
                }
              />
            ))}
          </div>

          {/* Desktop: tabela completa */}
          <Card className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venda</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="hidden md:table-cell">Entrega</TableHead>
                  <TableHead className="text-right">Vendido</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Saldo</TableHead>
                  <TableHead className="w-32 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer"
                    onClick={() => {
                      window.location.href = `/atacado/${event.id}`;
                    }}
                  >
                    <TableCell>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.customer?.name ?? "Sem cliente"}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDate(event.date)}
                    </TableCell>
                    <TableCell>
                      {event.status === "CANCELED" ? (
                        <EventStatusBadge status={event.status} />
                      ) : (
                        <PaymentStatusBadge
                          sold={event.soldValue}
                          received={event.receivedValue}
                          date={event.date}
                        />
                      )}
                    </TableCell>
                    <TableCell
                      className="hidden md:table-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeliveryToggle id={event.id} status={event.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(event.soldValue)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">
                      {event.soldValue - event.receivedValue > 0.005 ? (
                        <span className="font-medium text-clay">
                          {formatCurrency(event.soldValue - event.receivedValue)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button asChild variant="outline" size="sm" className="h-8">
                        <Link href={`/atacado/${event.id}`}>Ver detalhes</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Pagination data={data} onPageChange={setPage} />
        </>
      ) : (
        <Card>
          {debouncedSearch || payment || delivered !== undefined ? (
            <EmptyState
              className="border-0"
              icon={<Boxes />}
              title="Nada encontrado"
              description="Nenhuma venda bate com esses filtros. Tente outro período ou termo de busca."
            />
          ) : (
            <EmptyState
              className="border-0"
              icon={<Boxes />}
              title="Nenhuma venda no atacado"
              description="Para revender no atacado: cadastre o produto marcando “Atacado”, registre a compra do fornecedor (pra ter estoque) e lance a venda em pacote fechado (maço) para outro lojista."
              action={
                <Button onClick={openWholesaleSale}>
                  <Plus className="h-4 w-4" />
                  Nova venda no atacado
                </Button>
              }
            />
          )}
        </Card>
      )}
    </div>
  );
}
