"use client";

import { AlertTriangle, CalendarClock, Package, Plus } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { MovementDialog } from "@/components/stock/movement-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStockOverview } from "@/lib/api/stock";
import { unitLabels } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export default function StockPage() {
  const { data, isLoading } = useStockOverview();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Saldo das flores, alertas de estoque baixo e lotes a vencer."
      >
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Ajustar estoque
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Produtos em estoque baixo
              </p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <p className="text-xl font-semibold">{data?.lowCount ?? 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-clay/12 text-clay">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Lotes a vencer (14 dias)
              </p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <p className="text-xl font-semibold">
                  {data?.expiringSoon.length ?? 0}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.levels.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="hidden text-right md:table-cell">Mínimo</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.levels.map((level) => (
                <TableRow key={level.productId}>
                  <TableCell className="font-medium">{level.productName}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {level.categoryName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {level.onHand} {unitLabels[level.unit].toLowerCase()}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                    {level.minStock || "—"}
                  </TableCell>
                  <TableCell>
                    {level.low ? (
                      <Badge variant="warning">Estoque baixo</Badge>
                    ) : (
                      <Badge variant="success">Ok</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            className="border-0"
            icon={<Package />}
            title="Estoque vazio"
            description="Registre compras (recebidas) para alimentar o estoque automaticamente."
          />
        )}
      </Card>

      {data && data.expiringSoon.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="border-b px-4 py-3 text-sm font-medium">
              Lotes a vencer
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="hidden md:table-cell">Lote</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expiringSoon.map((lot, i) => (
                  <TableRow key={`${lot.productId}-${i}`}>
                    <TableCell className="font-medium">{lot.productName}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {lot.lot ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(lot.expiresAt)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {lot.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <MovementDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
