"use client";

import type { StockLevel } from "@sistema-flores/types";
import {
  AlertTriangle,
  CalendarClock,
  Package,
  Pencil,
  Plus,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list-card";
import { PageHeader } from "@/components/shared/page-header";
import { SalesFilters } from "@/components/shared/sales-filters";
import { AdjustBalanceDialog } from "@/components/stock/adjust-balance-dialog";
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
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type StockFilter = "all" | "low" | "ok";

export default function StockPage() {
  const { data, isLoading } = useStockOverview();
  const [open, setOpen] = useState(false);
  const [adjustLevel, setAdjustLevel] = useState<StockLevel | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");

  const levels = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.levels ?? []).filter((l) => {
      if (filter === "low" && !l.low) return false;
      if (filter === "ok" && l.low) return false;
      if (q) {
        return (
          l.productName.toLowerCase().includes(q) ||
          (l.categoryName ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, search, filter]);
  const hasFilter = search.trim() !== "" || filter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Quanto você tem de cada insumo. Baixa sozinho ao vender no atacado ou ao montar um buquê; avisa quando está acabando."
      >
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Movimentar estoque
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Estoque valorizado
              </p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-24" />
              ) : (
                <p className="text-xl font-semibold tabular-nums">
                  {formatCurrency(data?.totalValue ?? 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
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

      {data && data.levels.length > 0 ? (
        <SalesFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar insumo…"
        >
          <div className="flex gap-1.5">
            {(
              [
                { label: "Todos", value: "all" },
                { label: "Estoque baixo", value: "low" },
                { label: "Ok", value: "ok" },
              ] as const
            ).map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  filter === f.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </SalesFilters>
      ) : null}

      <Card>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : levels.length > 0 ? (
          <>
            {/* Celular: cartões — toque ajusta o saldo */}
            <div className="space-y-2 p-3 sm:hidden">
              {levels.map((level) => (
                <ListCard
                  key={level.productId}
                  onClick={() => setAdjustLevel(level)}
                  title={level.productName}
                  subtitle={level.categoryName ?? "Sem categoria"}
                  meta={`${level.onHand} ${unitLabels[level.unit].toLowerCase()}`}
                  metaSub={
                    level.low ? (
                      <Badge variant="warning">Estoque baixo</Badge>
                    ) : (
                      <Badge variant="success">Ok</Badge>
                    )
                  }
                />
              ))}
            </div>
            <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Valor</TableHead>
                <TableHead className="hidden text-right md:table-cell">Mínimo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-0 text-right">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((level) => (
                <TableRow key={level.productId}>
                  <TableCell className="font-medium">{level.productName}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {level.categoryName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {level.onHand} {unitLabels[level.unit].toLowerCase()}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                    {formatCurrency(level.value)}
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAdjustLevel(level)}
                    >
                      <Pencil className="h-4 w-4" />
                      Ajustar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </div>
          </>
        ) : hasFilter ? (
          <EmptyState
            className="border-0"
            icon={<Package />}
            title="Nada encontrado"
            description="Nenhum insumo bate com esses filtros."
          />
        ) : (
          <EmptyState
            className="border-0"
            icon={<Package />}
            title="Estoque vazio"
            description="Registre compras de insumos (recebidas) para alimentar o estoque automaticamente."
          />
        )}
      </Card>

      {data && data.expiringSoon.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="border-b px-4 py-3 text-sm font-medium">
              Lotes a vencer
            </div>
            <div className="space-y-2 p-3 sm:hidden">
              {data.expiringSoon.map((lot, i) => (
                <ListCard
                  key={`m-${lot.productId}-${i}`}
                  title={lot.productName}
                  subtitle={`vence ${formatDate(lot.expiresAt)}${lot.lot ? ` · lote ${lot.lot}` : ""}`}
                  meta={lot.quantity}
                />
              ))}
            </div>
            <div className="hidden sm:block">
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
            </div>
          </CardContent>
        </Card>
      ) : null}

      <MovementDialog open={open} onOpenChange={setOpen} />
      <AdjustBalanceDialog
        open={Boolean(adjustLevel)}
        onOpenChange={(o) => {
          if (!o) setAdjustLevel(null);
        }}
        level={adjustLevel}
      />
    </div>
  );
}
