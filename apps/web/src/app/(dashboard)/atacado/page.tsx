"use client";

import type { PaymentStatusFilter } from "@sistema-flores/types";
import { BarChart3, Boxes, ChevronDown, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { CobrancaButton } from "@/components/events/cobranca-button";
import { DeliveryToggle } from "@/components/events/delivery-toggle";
import { ReceberButton } from "@/components/events/receber-button";
import { SaleItemsInline } from "@/components/events/sale-items-inline";
import { SalesInsightsPanel } from "@/components/events/sales-insights-panel";
import { useQuickSale } from "@/components/events/quick-sale-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SalesFilters } from "@/components/shared/sales-filters";
import { SortableHead, useTableSort } from "@/components/shared/sortable-head";
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
import { useFilterParams } from "@/lib/use-filter-params";
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
  const router = useRouter();
  const defaults = useMemo(() => {
    const range = currentMonthRange();
    return { de: range.from, ate: range.to };
  }, []);
  const { get, set } = useFilterParams(defaults);

  const paymentParam = get("pagamento");
  const payment: PaymentStatusFilter | undefined =
    paymentParam === "paid" || paymentParam === "pending"
      ? paymentParam
      : undefined;
  const deliveredParam = get("entrega");
  const delivered =
    deliveredParam === "sim" ? true : deliveredParam === "nao" ? false : undefined;
  const from = get("de");
  const to = get("ate");
  const page = Math.max(1, Number.parseInt(get("pagina"), 10) || 1);
  const showInsights = get("insights") === "1";

  // Busca digitada fica local (input fluido); a URL recebe o valor debounced.
  const [search, setSearch] = useState(() => get("busca"));
  const debouncedSearch = useDebounce(search);
  useEffect(() => {
    if (debouncedSearch === get("busca")) return;
    set({ busca: debouncedSearch || undefined, pagina: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só quando o debounce muda
  }, [debouncedSearch]);

  const sortState = useTableSort(() => set({ pagina: undefined }));

  const { data, isLoading } = useEvents({
    channel: "WHOLESALE",
    paymentStatus: payment,
    delivered,
    search: debouncedSearch || undefined,
    from: from || undefined,
    to: to || undefined,
    sort: sortState.sort,
    order: sortState.order,
    page,
    pageSize: 20,
  });
  const { openWholesaleSale } = useQuickSale();

  const changePayment = (value: PaymentStatusFilter | undefined) =>
    set({ pagamento: value, pagina: undefined });
  const changeDelivered = (value: boolean | undefined) =>
    set({
      entrega: value === undefined ? undefined : value ? "sim" : "nao",
      pagina: undefined,
    });
  const changeDate = (nextFrom: string, nextTo: string) =>
    set({ de: nextFrom, ate: nextTo, pagina: undefined });
  const setPage = (p: number) => set({ pagina: p === 1 ? undefined : String(p) });
  const toggleInsights = () => set({ insights: showInsights ? undefined : "1" });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

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
        onSearchChange={setSearch}
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
          onClick={toggleInsights}
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
            <SalesInsightsPanel
              filters={{
                from,
                to,
                channel: "WHOLESALE",
                paymentStatus: payment,
                delivered,
                search: debouncedSearch || undefined,
              }}
            />
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
              <div key={event.id} className="space-y-1">
                <ListCard
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
                {event.items.length > 0 ||
                (event.status !== "CANCELED" &&
                  event.soldValue - event.receivedValue > 0.005) ? (
                <div className="flex gap-2">
                  {event.items.length > 0 ? (
                    <button
                      type="button"
                      aria-expanded={Boolean(expanded[event.id])}
                      onClick={() => toggleExpanded(event.id)}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors active:bg-muted/60"
                    >
                      {expanded[event.id]
                        ? "Ocultar itens"
                        : `Ver itens (${event.items.length})`}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expanded[event.id] && "rotate-180",
                        )}
                      />
                    </button>
                  ) : null}
                  {event.status !== "CANCELED" &&
                  event.soldValue - event.receivedValue > 0.005 ? (
                    <ReceberButton
                      eventId={event.id}
                      balanceDue={event.soldValue - event.receivedValue}
                      className="min-h-[44px] flex-1 rounded-xl"
                    />
                  ) : null}
                </div>
                ) : null}
                {expanded[event.id] && event.items.length > 0 ? (
                  <div className="rounded-xl border border-border bg-card px-4 py-1.5">
                    <SaleItemsInline items={event.items} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Desktop: tabela completa */}
          <Card className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <SortableHead column="title" state={sortState}>Venda</SortableHead>
                  <SortableHead column="date" state={sortState} className="hidden md:table-cell">Data</SortableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="hidden md:table-cell">Entrega</TableHead>
                  <SortableHead column="sold" state={sortState} align="right" className="text-right">Vendido</SortableHead>
                  <TableHead className="hidden text-right lg:table-cell">Saldo</TableHead>
                  <TableHead className="w-32 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((event) => (
                  <Fragment key={event.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => router.push(`/atacado/${event.id}`)}
                  >
                    <TableCell
                      className="w-10 pr-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.items.length > 0 ? (
                        <button
                          type="button"
                          aria-label="Ver itens"
                          aria-expanded={Boolean(expanded[event.id])}
                          onClick={() => toggleExpanded(event.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform",
                              expanded[event.id] && "rotate-90",
                            )}
                          />
                        </button>
                      ) : null}
                    </TableCell>
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
                      <div className="flex flex-wrap justify-end gap-2">
                        {event.status !== "CANCELED" &&
                        event.soldValue - event.receivedValue > 0.005 ? (
                          <>
                            <ReceberButton
                              eventId={event.id}
                              balanceDue={event.soldValue - event.receivedValue}
                            />
                            <CobrancaButton eventId={event.id} />
                          </>
                        ) : null}
                        <Button asChild variant="outline" size="sm" className="h-8">
                          <Link href={`/atacado/${event.id}`}>Ver detalhes</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expanded[event.id] ? (
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={8} className="py-2 pl-12 pr-4">
                        <SaleItemsInline items={event.items} />
                      </TableCell>
                    </TableRow>
                  ) : null}
                  </Fragment>
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
