"use client";

import type {
  CustomerEventSummary,
  EventStatus,
  QuoteStatus,
} from "@sistema-flores/types";
import {
  ArrowLeft,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { MonthlyBars } from "@/components/profile/monthly-bars";
import { TopItems } from "@/components/profile/top-items";
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
import { useCompany } from "@/lib/api/company";
import { useCustomerProfile } from "@/lib/api/customers";
import { useAuth } from "@/lib/auth/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  buildOrderMessage,
  buildStatementMessage,
  whatsappHref,
} from "@/lib/whatsapp";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useCustomerProfile(params.id);
  const { data: settings } = useCompany();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { customer, stats, events, quotes, topItems, monthly, bestMonth } = data;
  const company = settings?.name ?? user?.companyName ?? "Floreei";
  const phone = customer.whatsapp ?? customer.phone;

  const openWhatsapp = (text: string) => {
    const href = whatsappHref(phone, text);
    if (!href) {
      toast.error("Cliente sem WhatsApp cadastrado.");
      return;
    }
    window.open(href, "_blank", "noopener");
  };

  const sendEventWhatsapp = (event: CustomerEventSummary) =>
    openWhatsapp(
      buildOrderMessage({
        company,
        heading: `Pedido ${event.id.slice(0, 8).toUpperCase()}`,
        dateLabel: formatDate(event.date),
        items: event.items,
        total: event.soldValue,
        paid: event.receivedValue,
        balance: event.soldValue - event.receivedValue,
        closing: "Obrigado pela preferência!",
      }),
    );

  const sendStatementWhatsapp = () =>
    openWhatsapp(
      buildStatementMessage({
        company,
        name: customer.name,
        countLabel: `${stats.eventsCount} ${stats.eventsCount === 1 ? "pedido" : "pedidos"}`,
        totalLabel: "Total comprado",
        total: stats.totalSold,
        balanceLabel: "Saldo a receber",
        balance: stats.balanceDue,
        closing: "Qualquer dúvida, estou à disposição.",
      }),
    );

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
        <Button asChild variant="outline">
          <Link href={`/clientes/${customer.id}/extrato`}>
            <Printer className="h-4 w-4" />
            Imprimir extrato
          </Link>
        </Button>
        <Button variant="outline" onClick={sendStatementWhatsapp}>
          <MessageCircle className="h-4 w-4" />
          Enviar resumo
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Itens mais vendidos</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-3">
            <TopItems items={topItems} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Faturamento por mês</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <MonthlyBars data={monthly} valueName="Faturamento" best={bestMonth} />
          </CardContent>
        </Card>
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
                  <TableHead className="w-24 text-right">Pedido</TableHead>
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
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label="Imprimir nota"
                          title="Imprimir nota do pedido"
                        >
                          <Link href={`/eventos/${event.id}/imprimir`}>
                            <Printer className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Enviar no WhatsApp"
                          title="Enviar pedido no WhatsApp"
                          onClick={() => sendEventWhatsapp(event)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
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
