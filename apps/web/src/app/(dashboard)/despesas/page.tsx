"use client";

import type { Expense, ExpenseQuery } from "@sistema-flores/types";
import {
  FileText,
  MoreHorizontal,
  Plus,
  Receipt,
  Repeat,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { MarkPaidDialog } from "@/components/expenses/mark-paid-dialog";
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
  useDeleteExpense,
  useExpenses,
  useUnpayExpense,
} from "@/lib/api/expenses";
import { useAuth } from "@/lib/auth/auth-context";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type StatusFilter = NonNullable<ExpenseQuery["status"]>;

const filters: Array<[StatusFilter, string]> = [
  ["all", "Todas"],
  ["unpaid", "A pagar"],
  ["overdue", "Vencidas"],
  ["paid", "Pagas"],
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function StatusBadge({ expense }: { expense: Expense }) {
  if (expense.paid) return <Badge variant="success">Paga</Badge>;
  if (expense.dueDate < todayStr())
    return <Badge variant="destructive">Vencida</Badge>;
  return <Badge variant="warning">A pagar</Badge>;
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFilter>("all");
  const { data, isLoading } = useExpenses({ status });
  const remove = useDeleteExpense();
  const unpay = useUnpayExpense();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [paying, setPaying] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despesas"
        description="Gastos que não são insumos nem para revenda — ferramentas, móveis, contas (luz, aluguel). Com vencimento, comprovantes e resultado (DRE)."
      >
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nova despesa
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {filters.map(([value, labelText]) => (
          <button
            key={value}
            onClick={() => setStatus(value)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              status === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {labelText}
          </button>
        ))}
      </div>

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
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="hidden md:table-cell">Vencimento</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="hidden lg:table-cell">Anexos</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-1.5">
                      {expense.description}
                      {expense.recurring ? (
                        <Repeat
                          className="h-3.5 w-3.5 text-muted-foreground"
                          aria-label="Recorrente"
                        />
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{expense.costCenter}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatDate(expense.dueDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge expense={expense} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex gap-1.5">
                      {expense.attachments.map((a) => (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={a.kind === "BILL" ? "Conta" : "Comprovante"}
                          className="text-muted-foreground transition-colors hover:text-primary"
                        >
                          {a.kind === "BILL" ? (
                            <FileText className="h-4 w-4" />
                          ) : (
                            <Receipt className="h-4 w-4" />
                          )}
                        </a>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {expense.paid ? (
                          <DropdownMenuItem
                            onClick={async () => {
                              await unpay.mutateAsync(expense.id);
                              toast.success("Pagamento desfeito (voltou para 'a pagar').");
                            }}
                          >
                            Desfazer pagamento
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setPaying(expense)}>
                            Marcar como pago
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(expense);
                            setDialogOpen(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        {user?.role === "ADMIN" ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleting(expense)}
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
            icon={<Receipt />}
            title="Nenhuma despesa"
            description="Registre contas a pagar (aluguel, energia, fornecedores…) com vencimento e comprovante."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Nova despesa
              </Button>
            }
          />
        )}
      </Card>

      <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} expense={editing} />
      <MarkPaidDialog
        open={Boolean(paying)}
        onOpenChange={(o) => !o && setPaying(null)}
        expense={paying}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Excluir despesa"
        description={`Excluir "${deleting?.description}"?`}
        onConfirm={async () => {
          await remove.mutateAsync(deleting!.id);
          toast.success("Despesa excluída.");
        }}
      />
    </div>
  );
}
