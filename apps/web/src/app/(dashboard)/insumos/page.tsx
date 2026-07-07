"use client";

import type { Category, Product } from "@sistema-flores/types";
import { MoreHorizontal, Plus, Sprout, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryDialog } from "@/components/catalog/category-dialog";
import { ProductDialog } from "@/components/catalog/product-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
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
  useCategories,
  useDeleteCategory,
  useDeleteProduct,
  useProducts,
} from "@/lib/api/catalog";
import { useAuth } from "@/lib/auth/auth-context";
import { unitLabels } from "@/lib/labels";
import { cn, formatCurrency } from "@/lib/utils";

export default function CatalogPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { data: categories, isLoading: loadingCats } = useCategories();
  const [selected, setSelected] = useState<string | undefined>();
  const { data: products, isLoading: loadingProducts } = useProducts({
    categoryId: selected,
  });

  const deleteCategory = useDeleteCategory();
  const deleteProduct = useDeleteProduct();

  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  const [prodDialog, setProdDialog] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [deletingProd, setDeletingProd] = useState<Product | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insumos"
        description="Tudo que você compra — flores, folhagens, papel, cola, decorativos. Cada insumo tem custo e preço de venda: vende no atacado e compõe buquês."
      >
        <Button
          variant="outline"
          onClick={() => {
            setEditingCat(null);
            setCatDialog(true);
          }}
        >
          <Tag className="h-4 w-4" />
          Nova categoria
        </Button>
        <Button
          disabled={!categories?.length}
          onClick={() => {
            setEditingProd(null);
            setProdDialog(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo insumo
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit p-2">
          {loadingCats ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              <button
                onClick={() => setSelected(undefined)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  !selected ? "bg-primary/10 text-primary" : "hover:bg-muted",
                )}
              >
                <span className="font-medium">Todos os insumos</span>
              </button>
              {categories?.map((cat) => (
                <div
                  key={cat.id}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    selected === cat.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted",
                  )}
                >
                  <button
                    className="flex flex-1 items-center justify-between"
                    onClick={() => setSelected(cat.id)}
                  >
                    <span>{cat.name}</span>
                    <Badge variant="secondary">{cat.productCount ?? 0}</Badge>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="ml-1 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Ações da categoria"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingCat(cat);
                          setCatDialog(true);
                        }}
                      >
                        Renomear
                      </DropdownMenuItem>
                      {isAdmin ? (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingCat(cat)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          {loadingProducts ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : products && products.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Compra</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.data.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-md border border-border object-cover"
                          />
                        ) : null}
                        <span>
                          {product.name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {product.category?.name}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {unitLabels[product.unit]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(product.defaultPurchasePrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(product.defaultSalePrice)}
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
                              setEditingProd(product);
                              setProdDialog(true);
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                          {isAdmin ? (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingProd(product)}
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
          ) : (
            <EmptyState
              className="border-0"
              icon={<Sprout />}
              title="Nenhum insumo"
              description={
                categories?.length
                  ? "Cadastre insumos para vender e compor buquês."
                  : "Crie uma categoria antes de adicionar insumos."
              }
            />
          )}
        </Card>
      </div>

      <CategoryDialog
        open={catDialog}
        onOpenChange={setCatDialog}
        category={editingCat}
      />
      <ProductDialog
        open={prodDialog}
        onOpenChange={setProdDialog}
        product={editingProd}
        categories={categories ?? []}
        defaultCategoryId={selected}
      />

      <ConfirmDialog
        open={Boolean(deletingCat)}
        onOpenChange={(o) => !o && setDeletingCat(null)}
        title="Excluir categoria"
        description={`Excluir "${deletingCat?.name}"? Só é possível se não houver insumos nela.`}
        onConfirm={async () => {
          await deleteCategory.mutateAsync(deletingCat!.id);
          toast.success("Categoria excluída.");
        }}
      />
      <ConfirmDialog
        open={Boolean(deletingProd)}
        onOpenChange={(o) => !o && setDeletingProd(null)}
        title="Excluir insumo"
        description={`Excluir "${deletingProd?.name}"?`}
        onConfirm={async () => {
          await deleteProduct.mutateAsync(deletingProd!.id);
          toast.success("Insumo excluído.");
        }}
      />
    </div>
  );
}
