"use client";

import type { SupplierPurchaseSummary } from "@sistema-flores/types";
import {
  ArrowLeft,
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
import { MonthlyBars } from "@/components/profile/monthly-bars";
import { TopItems } from "@/components/profile/top-items";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SupplierDialog } from "@/components/suppliers/supplier-dialog";
import { Badge } from "@/components/ui/badge";
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
import { useSupplierProfile } from "@/lib/api/suppliers";
import { useAuth } from "@/lib/auth/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  buildOrderMessage,
  buildStatementMessage,
  whatsappHref,
} from "@/lib/whatsapp";

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useSupplierProfile(params.id);
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

  const { supplier, stats, purchases, topItems, monthly, bestMonth } = data;
  const company = settings?.name ?? user?.companyName ?? "Floreei";
  const phone = supplier.whatsapp ?? supplier.contact;

  const openWhatsapp = (text: string) => {
    const href = whatsappHref(phone, text);
    if (!href) {
      toast.error("Fornecedor sem WhatsApp cadastrado.");
      return;
    }
    window.open(href, "_blank", "noopener");
  };

  const sendPurchaseWhatsapp = (purchase: SupplierPurchaseSummary) =>
    openWhatsapp(
      buildOrderMessage({
        company,
        heading: `Pedido de compra ${purchase.id.slice(0, 8).toUpperCase()}`,
        dateLabel: formatDate(purchase.date),
        items: purchase.items,
        total: purchase.total,
        paid: purchase.paidAmount,
        balance: purchase.balanceDue,
        closing: "Obrigado!",
      }),
    );

  const sendStatementWhatsapp = () =>
    openWhatsapp(
      buildStatementMessage({
        company,
        name: supplier.name,
        countLabel: `${stats.purchasesCount} ${stats.purchasesCount === 1 ? "compra" : "compras"}`,
        totalLabel: "Total comprado",
        total: stats.totalPurchased,
        balanceLabel: "Saldo a pagar",
        balance: stats.balanceDue,
        closing: "Obrigado!",
      }),
    );

  return (
    <div className="space-y-6">
      <Link
        href="/fornecedores"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Fornecedores
      </Link>

      <PageHeader title={supplier.name} description={supplier.paymentTerms ?? undefined}>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button asChild variant="outline">
          <Link href={`/fornecedores/${supplier.id}/extrato`}>
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
        <Stat label="Compras" value={String(stats.purchasesCount)} />
        <Stat label="Total comprado" value={formatCurrency(stats.totalPurchased)} />
        <Stat label="Total pago" value={formatCurrency(stats.totalPaid)} />
        <Stat
          label="Saldo a pagar"
          value={formatCurrency(stats.balanceDue)}
          accent={stats.balanceDue > 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Itens mais comprados</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-3">
            <TopItems items={topItems} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gasto por mês</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <MonthlyBars data={monthly} valueName="Gasto" best={bestMonth} />
          </CardContent>
        </Card>
      </div>

      {(supplier.whatsapp || supplier.contact || supplier.city) && (
        <Card>
          <CardContent className="flex flex-wrap gap-x-8 gap-y-2 p-5 text-sm">
            {supplier.whatsapp || supplier.contact ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {supplier.whatsapp ?? supplier.contact}
              </span>
            ) : null}
            {supplier.city ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {supplier.city}
              </span>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Compras</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {purchases.length === 0 ? (
            <EmptyState className="border-0" title="Nenhuma compra ainda" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="w-24 text-right">Pedido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(purchase.date)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(purchase.total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(purchase.paidAmount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {purchase.balanceDue > 0 ? (
                        <span className="font-semibold text-clay">
                          {formatCurrency(purchase.balanceDue)}
                        </span>
                      ) : (
                        <Badge variant="success">Pago</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label="Imprimir pedido"
                          title="Imprimir pedido de compra"
                        >
                          <Link href={`/compras/${purchase.id}/imprimir`}>
                            <Printer className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Enviar no WhatsApp"
                          title="Enviar pedido no WhatsApp"
                          onClick={() => sendPurchaseWhatsapp(purchase)}
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

      <SupplierDialog open={editOpen} onOpenChange={setEditOpen} supplier={supplier} />
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
