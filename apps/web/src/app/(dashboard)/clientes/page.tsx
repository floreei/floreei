"use client";

import type { Customer, SalesChannel } from "@sistema-flores/types";
import { Eye, MoreHorizontal, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list-card";
import { PageHeader } from "@/components/shared/page-header";
import { SortableHead, useTableSort } from "@/components/shared/sortable-head";
import { SalesChannelBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers, useDeleteCustomer } from "@/lib/api/customers";
import { useAuth } from "@/lib/auth/auth-context";
import { useDebounce } from "@/lib/use-debounce";
import { cn } from "@/lib/utils";

const channelFilters: Array<{ label: string; value?: SalesChannel }> = [
  { label: "Todos" },
  { label: "Venda direta", value: "RETAIL" },
  { label: "Atacado", value: "WHOLESALE" },
];

export default function CustomersPage() {
  const params = useSearchParams();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<SalesChannel | undefined>();
  const debounced = useDebounce(search);
  const sortState = useTableSort();
  const { data, isLoading } = useCustomers({
    search: debounced,
    channel,
    sort: sortState.sort,
    order: sortState.order,
  });
  const remove = useDeleteCustomer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  useEffect(() => {
    if (params.get("novo")) {
      setEditing(null);
      setDialogOpen(true);
    }
  }, [params]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Quem compra flores e contrata eventos.">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail, telefone…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:pb-0">
          {channelFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => setChannel(f.value)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                channel === f.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Card>
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : data && data.data.length > 0 ? (
        <>
          {/* Celular: cartões tocáveis — ações ficam no detalhe */}
          <div className="space-y-2 sm:hidden">
            {data.data.map((customer) => (
              <ListCard
                key={customer.id}
                href={`/clientes/${customer.id}`}
                title={customer.name}
                subtitle={
                  customer.whatsapp || customer.phone || customer.email || "Sem contato"
                }
                metaSub={<SalesChannelBadge channel={customer.channel} />}
              />
            ))}
          </div>

          <Card className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead column="name" state={sortState}>Nome</SortableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="hidden sm:table-cell">Documento</TableHead>
                <TableHead className="hidden sm:table-cell" />
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/clientes/${customer.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <SalesChannelBadge channel={customer.channel} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.whatsapp || customer.phone || customer.email || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {customer.document || "—"}
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/clientes/${customer.id}`}>
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
                            setEditing(customer);
                            setDialogOpen(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        {user?.role === "ADMIN" ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleting(customer)}
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
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState
            className="border-0"
            icon={<Users />}
            title="Nenhum cliente encontrado"
            description="Cadastre seu primeiro cliente para começar a criar orçamentos."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Novo cliente
              </Button>
            }
          />
        </Card>
      )}

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${deleting?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={async () => {
          await remove.mutateAsync(deleting!.id);
          toast.success("Cliente excluído.");
        }}
      />
    </div>
  );
}
