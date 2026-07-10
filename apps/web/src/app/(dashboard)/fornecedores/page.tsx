"use client";

import type { Supplier } from "@sistema-flores/types";
import { Eye, MoreHorizontal, Plus, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SalesFilters } from "@/components/shared/sales-filters";
import { SupplierDialog } from "@/components/suppliers/supplier-dialog";
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
import { useDeleteSupplier, useSuppliers } from "@/lib/api/suppliers";
import { useAuth } from "@/lib/auth/auth-context";
import { useDebounce } from "@/lib/use-debounce";

export default function SuppliersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const { data, isLoading } = useSuppliers({ search: debounced, page, pageSize: 20 });
  const remove = useDeleteSupplier();

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader title="Fornecedores" description="De quem você compra flores e insumos.">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo fornecedor
        </Button>
      </PageHeader>

      <SalesFilters
        search={search}
        onSearchChange={changeSearch}
        searchPlaceholder="Buscar por nome, cidade ou contato…"
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
            {/* Celular: cartões — toque abre o detalhe */}
            <div className="space-y-2 p-3 sm:hidden">
              {data.data.map((supplier) => (
                <ListCard
                  key={supplier.id}
                  href={`/fornecedores/${supplier.id}`}
                  title={supplier.name}
                  subtitle={[supplier.city, supplier.whatsapp || supplier.contact]
                    .filter(Boolean)
                    .join(" · ") || "Sem contato"}
                />
              ))}
            </div>
            <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead />
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/fornecedores/${supplier.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {supplier.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.city || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.whatsapp || supplier.contact || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.paymentTerms || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/fornecedores/${supplier.id}`}>
                        <Eye className="h-4 w-4" />
                        Ver detalhes
                      </Link>
                    </Button>
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
                            setEditing(supplier);
                            setDialogOpen(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        {user?.role === "ADMIN" ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleting(supplier)}
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
        ) : debounced ? (
          <EmptyState
            className="border-0"
            icon={<Truck />}
            title="Nada encontrado"
            description="Nenhum fornecedor bate com essa busca."
          />
        ) : (
          <EmptyState
            className="border-0"
            icon={<Truck />}
            title="Nenhum fornecedor"
            description="Cadastre seus fornecedores para registrar compras."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Novo fornecedor
              </Button>
            }
          />
        )}
      </Card>

      {data ? <Pagination data={data} onPageChange={setPage} /> : null}

      <SupplierDialog open={dialogOpen} onOpenChange={setDialogOpen} supplier={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Excluir fornecedor"
        description={`Excluir "${deleting?.name}"?`}
        onConfirm={async () => {
          await remove.mutateAsync(deleting!.id);
          toast.success("Fornecedor excluído.");
        }}
      />
    </div>
  );
}
