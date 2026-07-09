"use client";

import { Boxes, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuickSale } from "@/components/events/quick-sale-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SalesFilters } from "@/components/shared/sales-filters";
import { EventStatusBadge } from "@/components/shared/status-badge";
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
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AtacadoPage() {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useEvents({
    channel: "WHOLESALE",
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
  const changeDate = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom);
    setTo(nextTo);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atacado"
        description="Revenda de insumo em pacote fechado (maço) para outros lojistas."
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
                href={`/vendas/${event.id}`}
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
                metaSub={<EventStatusBadge status={event.status} />}
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Vendido</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Recebido</TableHead>
                  <TableHead className="w-32 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer"
                    onClick={() => {
                      window.location.href = `/vendas/${event.id}`;
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
                      <EventStatusBadge status={event.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(event.soldValue)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                      {formatCurrency(event.receivedValue)}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button asChild variant="outline" size="sm" className="h-8">
                        <Link href={`/vendas/${event.id}`}>Ver detalhes</Link>
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
          {debouncedSearch || from || to ? (
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
              description="Revenda insumos em pacote fechado (maço) para outros lojistas."
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
