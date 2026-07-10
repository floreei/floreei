"use client";

import type { Category, Product } from "@sistema-flores/types";
import { MoreHorizontal, Plus, Sprout, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryDialog } from "@/components/catalog/category-dialog";
import { ProductDialog } from "@/components/catalog/product-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list-card";
import { PageHeader } from "@/components/shared/page-header";
import { SalesFilters } from "@/components/shared/sales-filters";
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
import { useDebounce } from "@/lib/use-debounce";
import { cn, formatCurrency } from "@/lib/utils";

/** Margem sobre o preço de venda (null quando não é revendido — só buquê). */
function marginPct(purchase: number, sale: number): number | null {
  if (sale <= 0) return null;
  return Math.round(((sale - purchase) / sale) * 100);
}

function MarginBadge({ purchase, sale }: { purchase: number; sale: number }) {
  const m = marginPct(purchase, sale);
  if (m === null) {
    return (
      <Badge variant="secondary" title="Não revendido avulso — entra só em buquês">
        Só buquê
      </Badge>
    );
  }
  const variant = m <= 0 ? "destructive" : m < 25 ? "warning" : "success";
  return <Badge variant={variant}>{m}% margem</Badge>;
}

/** Miniatura do insumo: foto ou um marcador com a inicial/ícone. */
function Thumb({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-sm font-semibold uppercase text-primary/70"
    >
      {name.trim().charAt(0) || <Sprout className="h-5 w-5" />}
    </div>
  );
}

export default function CatalogPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { data: categories, isLoading: loadingCats } = useCategories();
  const [selected, setSelected] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const { data: products, isLoading: loadingProducts } = useProducts({
    categoryId: selected,
    search: debounced || undefined,
    pageSize: 200,
  });

  const deleteCategory = useDeleteCategory();
  const deleteProduct = useDeleteProduct();

  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  const [prodDialog, setProdDialog] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [deletingProd, setDeletingProd] = useState<Product | null>(null);

  const activeCategory = categories?.find((c) => c.id === selected) ?? null;
  const editProduct = (product: Product) => {
    setEditingProd(product);
    setProdDialog(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insumos"
        description="Tudo que você compra — flores, folhagens, papel, cola, decorativos. O custo vem da compra; a margem sai da diferença pro preço de venda."
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
          onClick={() => {
            setEditingProd(null);
            setProdDialog(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo insumo
        </Button>
      </PageHeader>

      <SalesFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar insumo…"
      />

      {/* Filtro por categoria — chips com contagem; a categoria ativa mostra
          um menu pra renomear/excluir (some a barra lateral antiga). */}
      {loadingCats ? (
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:pb-0">
          <CategoryChip
            label="Todos"
            active={!selected}
            onClick={() => setSelected(undefined)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              count={cat.productCount ?? 0}
              active={selected === cat.id}
              onClick={() => setSelected(cat.id)}
              menu={
                selected === cat.id ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Ações da categoria ${cat.name}`}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-primary/15"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
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
                ) : undefined
              }
            />
          ))}
        </div>
      ) : null}

      {loadingProducts ? (
        <Card>
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </Card>
      ) : products && products.data.length > 0 ? (
        <Card className="overflow-hidden">
          {/* Celular: cartões — toque edita o insumo */}
          <div className="divide-y divide-border sm:hidden">
            {products.data.map((product) => (
              <ListCard
                key={product.id}
                className="rounded-none border-0 shadow-none"
                onClick={() => editProduct(product)}
                leading={<Thumb url={product.imageUrl} name={product.name} />}
                title={product.name}
                subtitle={[product.category?.name, unitLabels[product.unit]]
                  .filter(Boolean)
                  .join(" · ")}
                meta={
                  product.defaultSalePrice > 0
                    ? formatCurrency(product.defaultSalePrice)
                    : "—"
                }
                metaSub={
                  <MarginBadge
                    purchase={product.defaultPurchasePrice}
                    sale={product.defaultSalePrice}
                  />
                }
              />
            ))}
          </div>

          {/* Desktop: tabela densa com miniatura e margem */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="hidden lg:table-cell">Unidade</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    Margem
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.data.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => editProduct(product)}
                  >
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <Thumb url={product.imageUrl} name={product.name} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {product.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {product.category?.name ?? "Sem categoria"}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {unitLabels[product.unit]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(product.defaultPurchasePrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {product.defaultSalePrice > 0
                        ? formatCurrency(product.defaultSalePrice)
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      <MarginBadge
                        purchase={product.defaultPurchasePrice}
                        sale={product.defaultSalePrice}
                      />
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => editProduct(product)}>
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
          </div>
        </Card>
      ) : (
        <Card>
          {debounced || activeCategory ? (
            <EmptyState
              className="border-0"
              icon={<Sprout />}
              title="Nada encontrado"
              description={
                activeCategory
                  ? `Nenhum insumo em "${activeCategory.name}" com esse filtro.`
                  : "Nenhum insumo bate com essa busca."
              }
            />
          ) : (
            <EmptyState
              className="border-0"
              icon={<Sprout />}
              title="Comece pela base"
              description={
                categories?.length
                  ? "Cadastre seu primeiro insumo — a flor ou material que você compra e vende. É a base dos buquês e das vendas."
                  : "Tudo começa aqui. Crie uma categoria (ex.: Flores, Laços) e depois cadastre os insumos dentro dela."
              }
              action={
                categories?.length ? (
                  <Button
                    onClick={() => {
                      setEditingProd(null);
                      setProdDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Novo insumo
                  </Button>
                ) : (
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
                )
              }
            />
          )}
        </Card>
      )}

      <CategoryDialog
        open={catDialog}
        onOpenChange={setCatDialog}
        category={editingCat}
      />
      <ProductDialog
        open={prodDialog}
        onOpenChange={setProdDialog}
        product={editingProd}
        defaultCategoryId={selected}
      />

      <ConfirmDialog
        open={Boolean(deletingCat)}
        onOpenChange={(o) => !o && setDeletingCat(null)}
        title="Excluir categoria"
        description={`Excluir "${deletingCat?.name}"? Só é possível se não houver insumos nela.`}
        onConfirm={async () => {
          await deleteCategory.mutateAsync(deletingCat!.id);
          setSelected(undefined);
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

function CategoryChip({
  label,
  count,
  active,
  onClick,
  menu,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  menu?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5">
        {label}
        {count !== undefined ? (
          <span
            className={cn(
              "rounded-full px-1.5 text-xs tabular-nums",
              active ? "bg-primary/15" : "bg-muted-foreground/10",
            )}
          >
            {count}
          </span>
        ) : null}
      </button>
      {menu}
    </span>
  );
}
