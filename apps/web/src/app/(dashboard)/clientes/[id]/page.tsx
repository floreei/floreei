"use client";

import type { EventStatus, QuoteStatus } from "@sistema-flores/types";
import { ArrowLeft, Mail, MapPin, Pencil, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  EventStatusBadge,
  QuoteStatusBadge,
} from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomerProfile } from "@/lib/api/customers";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useCustomerProfile(params.id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { customer, stats, events, quotes } = data;

  return (
    <div className="space-y-6">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Clientes
      </Link>

      <PageHeader title={customer.name} description={customer.document ?? undefined}>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Eventos" value={String(stats.eventsCount)} />
        <Stat label="Total vendido" value={formatCurrency(stats.totalSold)} />
        <Stat label="Recebido" value={formatCurrency(stats.totalReceived)} />
        <Stat
          label="Saldo a receber"
          value={formatCurrency(stats.balanceDue)}
          accent={stats.balanceDue > 0}
        />
      </div>

      {(customer.whatsapp || customer.phone || customer.email || customer.address) && (
        <Card>
          <CardContent className="flex flex-wrap gap-x-8 gap-y-2 p-5 text-sm">
            {customer.whatsapp || customer.phone ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {customer.whatsapp ?? customer.phone}
              </span>
            ) : null}
            {customer.email ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {customer.email}
              </span>
            ) : null}
            {customer.address ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {customer.address}
              </span>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Eventos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <EmptyState className="border-0" title="Nenhum evento ainda" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Vendido</TableHead>
                  <TableHead className="text-right">Recebido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer"
                    onClick={() => {
                      window.location.href = `/eventos/${event.id}`;
                    }}
                  >
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(event.date)}
                    </TableCell>
                    <TableCell>
                      <EventStatusBadge status={event.status as EventStatus} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(event.soldValue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(event.receivedValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orçamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {quotes.length === 0 ? (
            <EmptyState className="border-0" title="Nenhum orçamento ainda" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    className="cursor-pointer"
                    onClick={() => {
                      window.location.href = `/orcamentos/${quote.id}`;
                    }}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{quote.number}
                    </TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={quote.status as QuoteStatus} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(quote.totalSale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CustomerDialog open={editOpen} onOpenChange={setEditOpen} customer={customer} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={`text-2xl font-semibold tracking-tight ${accent ? "text-clay" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
