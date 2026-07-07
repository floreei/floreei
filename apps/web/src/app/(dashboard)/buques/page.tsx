"use client";

import type { Arrangement } from "@sistema-flores/types";
import { Flower, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ArrangementDialog } from "@/components/arrangements/arrangement-dialog";
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
  useArrangements,
  useDeleteArrangement,
} from "@/lib/api/arrangements";
import { useAuth } from "@/lib/auth/auth-context";
import { cn, formatCurrency } from "@/lib/utils";

export default function ArrangementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { data, isLoading } = useArrangements();
  const remove = useDeleteArrangement();

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Arrangement | null>(null);
  const [deleting, setDeleting] = useState<Arrangement | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buquês"
        description="Composições feitas de insumos (ficha técnica) — o custo vem dos insumos e o lucro é calculado por buquê."
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

      <Card>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buquê</TableHead>
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
                      {a.items.length} insumo{a.items.length === 1 ? "" : "s"}
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
        ) : (
          <EmptyState
            className="border-0"
            icon={<Flower />}
            title="Nenhum buquê"
            description="Crie um buquê montando a ficha técnica com os seus insumos."
          />
        )}
      </Card>

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
