"use client";

import type { Purchase } from "@sistema-flores/types";
import { PackageCheck, Plus, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PaymentDialog } from "@/components/finance/payment-dialog";
import { PurchaseDialog } from "@/components/purchases/purchase-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SalesFilters } from "@/components/shared/sales-filters";
import { Badge } from "@/components/ui/badge";
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
import { usePurchases, useReceivePurchase } from "@/lib/api/purchases";
import { useDebounce } from "@/lib/use-debounce";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PurchasesPage() {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const { data, isLoading } = usePurchases({
    search: debounced || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize: 20,
  });
  const receive = useReceivePurchase();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [paying, setPaying] = useState<Purchase | null>(null);

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
        title="Compras"
        description="Comprar produtos dos fornecedores — dá entrada no estoque, atualiza o custo e controla o que ainda deve."
      >
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nova compra
        </Button>
      </PageHeader>

      <SalesFilters
        search={search}
        onSearchChange={changeSearch}
        from={from}
        to={to}
        onDateChange={changeDate}
        searchPlaceholder="Buscar por fornecedor…"
      />

      <Card>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            {/* Celular: cartões — toque abre o detalhe (receber/pagar ficam lá) */}
            <div className="space-y-2 p-3 sm:hidden">
              {data.data.map((purchase) => (
                <ListCard
                  key={purchase.id}
                  href={`/compras/${purchase.id}`}
                  title={purchase.supplier?.name ?? "—"}
                  subtitle={`${formatDate(purchase.date)} · total ${formatCurrency(purchase.total)}`}
                  meta={
                    purchase.balanceDue > 0 ? (
                      <span className="text-clay">{formatCurrency(purchase.balanceDue)}</span>
                    ) : (
                      <Badge variant="success">Pago</Badge>
                    )
                  }
                  metaSub={
                    purchase.status === "ORDERED" ? (
                      <Badge variant="warning">Pedido</Badge>
                    ) : (
                      <Badge variant="success">Recebida</Badge>
                    )
                  }
                />
              ))}
            </div>
            <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Total</TableHead>
                <TableHead className="hidden text-right md:table-cell">Pago</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right sm:w-40">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <Link
                        href={`/compras/${purchase.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {purchase.supplier?.name ?? "—"}
                      </Link>
                      {purchase.status === "ORDERED" ? (
                        <Badge variant="warning">Pedido</Badge>
                      ) : (
                        <Badge variant="success">Recebida</Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatDate(purchase.date)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatCurrency(purchase.total)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
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
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/compras/${purchase.id}`}>Detalhes</Link>
                      </Button>
                      {purchase.status === "ORDERED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={receive.isPending && receive.variables === purchase.id}
                          onClick={async () => {
                            try {
                              await receive.mutateAsync(purchase.id);
                              toast.success("Compra recebida. Entrou no estoque.");
                            } catch {
                              toast.error("Não foi possível receber.");
                            }
                          }}
                        >
                          <PackageCheck className="h-4 w-4" />
                          Receber
                        </Button>
                      ) : null}
                      {purchase.balanceDue > 0 ? (
                        <Button size="sm" variant="outline" onClick={() => setPaying(purchase)}>
                          Pagar
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </div>
          </>
        ) : debounced || from || to ? (
          <EmptyState
            className="border-0"
            icon={<ShoppingBasket />}
            title="Nada encontrado"
            description="Nenhuma compra bate com esses filtros."
          />
        ) : (
          <EmptyState
            className="border-0"
            icon={<ShoppingBasket />}
            title="Nenhuma compra"
            description="Registre a compra do fornecedor: o estoque dos produtos sobe, o custo se atualiza e entra nas contas a pagar."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Nova compra
              </Button>
            }
          />
        )}
      </Card>

      {data ? <Pagination data={data} onPageChange={setPage} /> : null}

      <PurchaseDialog open={dialogOpen} onOpenChange={setDialogOpen} purchase={editing} />
      {paying ? (
        <PaymentDialog
          open
          onOpenChange={(o) => !o && setPaying(null)}
          mode="pay"
          targetId={paying.id}
          balanceDue={paying.balanceDue}
        />
      ) : null}
    </div>
  );
}
