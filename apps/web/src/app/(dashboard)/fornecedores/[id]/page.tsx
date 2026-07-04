"use client";

import { ArrowLeft, MapPin, Pencil, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
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
import { useSupplierProfile } from "@/lib/api/suppliers";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useSupplierProfile(params.id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { supplier, stats, purchases } = data;

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
