"use client";

import type { Arrangement } from "@sistema-flores/types";
import { Flower, MoreHorizontal, Plus, Sprout } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ArrangementDialog } from "@/components/arrangements/arrangement-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SalesFilters } from "@/components/shared/sales-filters";
import { SortableHead, useTableSort } from "@/components/shared/sortable-head";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useArrangements,
  useDeleteArrangement,
} from "@/lib/api/arrangements";
import { useCategories, useProducts } from "@/lib/api/catalog";
import { useAuth } from "@/lib/auth/auth-context";
import { useDebounce } from "@/lib/use-debounce";
import { cn, formatCurrency } from "@/lib/utils";

export default function ArrangementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { data: categories } = useCategories();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const sortState = useTableSort(() => setPage(1));
  const { data, isLoading } = useArrangements({
    search: debounced || undefined,
    categoryId,
    sort: sortState.sort,
    order: sortState.order,
    page,
    pageSize: 20,
  });
  const { data: products } = useProducts({ pageSize: 1 });
  const hasProducts = (products?.total ?? 0) > 0;
  const remove = useDeleteArrangement();

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const changeCategory = (id: string | undefined) => {
    setCategoryId(id);
    setPage(1);
  };

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Arrangement | null>(null);
  const [deleting, setDeleting] = useState<Arrangement | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buquês"
        description="Composições feitas de produtos (ficha técnica) — o custo vem dos produtos e o lucro é calculado por buquê."
      >
        <Button
          onClick={() => {
            setEditing(null);
            setDialog(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo buquê
        </Button>
      </PageHeader>

      <SalesFilters
        search={search}
        onSearchChange={changeSearch}
        searchPlaceholder="Buscar buquê…"
      >
        {categories && categories.length > 0 ? (
          <div className="flex gap-1.5 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:pb-0">
            <button
              type="button"
              onClick={() => changeCategory(undefined)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                !categoryId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => changeCategory(c.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  categoryId === c.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : null}
      </SalesFilters>

      <Card>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            {/* Celular: cartões — toque edita o buquê */}
            <div className="space-y-2 p-3 sm:hidden">
              {data.data.map((a) => (
                <ListCard
                  key={a.id}
                  onClick={() => {
                    setEditing(a);
                    setDialog(true);
                  }}
                  title={a.name}
                  subtitle={`${a.items.length} produto${a.items.length === 1 ? "" : "s"} · custo ${formatCurrency(a.cost)}`}
                  meta={formatCurrency(a.salePrice)}
                  metaSub={
                    <Badge variant={a.margin < 0 ? "destructive" : "success"}>
                      {a.marginPercent.toFixed(1)}%
                    </Badge>
                  }
                />
              ))}
            </div>
            <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead column="name" state={sortState}>Buquê</SortableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {a.items.length} produto{a.items.length === 1 ? "" : "s"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatCurrency(a.cost)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(a.salePrice)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums font-medium",
                      a.margin < 0 ? "text-destructive" : "text-success",
                    )}
                  >
                    {formatCurrency(a.margin)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={a.margin < 0 ? "destructive" : "success"}>
                      {a.marginPercent.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(a);
                            setDialog(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        {isAdmin ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleting(a)}
                          >
                            Excluir
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </div>
          </>
        ) : debounced || categoryId ? (
          <EmptyState
            className="border-0"
            icon={<Flower />}
            title="Nada encontrado"
            description="Nenhum buquê bate com esses filtros."
          />
        ) : !hasProducts ? (
          <EmptyState
            className="border-0"
            icon={<Sprout />}
            title="Primeiro, cadastre produtos"
            description="Um buquê é feito de produtos (flores, folhagens, laços…). Cadastre seus produtos e volte aqui para montar o buquê."
            action={
              <Button asChild>
                <Link href="/produtos">
                  <Plus className="h-4 w-4" />
                  Cadastrar produtos
                </Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            className="border-0"
            icon={<Flower />}
            title="Nenhum buquê"
            description="Monte a ficha técnica com os seus produtos — o custo vem deles e o preço sai pela margem que você definir."
            action={
              isAdmin ? (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Novo buquê
                </Button>
              ) : undefined
            }
          />
        )}
      </Card>

      {data ? <Pagination data={data} onPageChange={setPage} /> : null}

      <ArrangementDialog
        open={dialog}
        onOpenChange={setDialog}
        arrangement={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Excluir buquê"
        description={`Excluir "${deleting?.name}"?`}
        onConfirm={async () => {
          await remove.mutateAsync(deleting!.id);
          toast.success("Buquê excluído.");
        }}
      />
    </div>
  );
}
