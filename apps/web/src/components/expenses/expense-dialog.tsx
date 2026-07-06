"use client";

import {
  COST_CENTERS,
  expenseInputSchema,
  type Expense,
} from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
import { FileUpload, type UploadedFile } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { useAddExpenseAttachment, useSaveExpense } from "@/lib/api/expenses";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}) {
  const save = useSaveExpense(expense?.id);
  const addAttachment = useAddExpenseAttachment();
  const [bill, setBill] = useState<UploadedFile | null>(null);
  const form = useForm({
    resolver: zodResolver(expenseInputSchema),
    defaultValues: {
      description: "",
      costCenter: "Outros",
      amount: 0,
      dueDate: todayStr(),
      recurring: false,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        description: expense?.description ?? "",
        costCenter: expense?.costCenter ?? "Outros",
        amount: expense?.amount ?? 0,
        dueDate: expense?.dueDate ?? todayStr(),
        recurring: expense?.recurring ?? false,
        notes: expense?.notes ?? "",
      });
      setBill(null);
    }
  }, [open, expense, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? "Editar despesa" : "Nova despesa"}</DialogTitle>
          <DialogDescription>
            Conta a pagar — informe o vencimento e anexe o boleto/fatura.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              const saved = await save.mutateAsync(values);
              if (bill) {
                await addAttachment.mutateAsync({
                  expenseId: saved.id,
                  input: { ...bill, kind: "BILL" },
                });
              }
              toast.success("Despesa salva.");
              onOpenChange(false);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao salvar.",
              );
            }
          })}
        >
          <Field label="Descrição" htmlFor="ex-desc" required error={form.formState.errors.description?.message}>
            <Input id="ex-desc" autoFocus {...form.register("description")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Categoria">
              <Controller
                control={form.control}
                name="costCenter"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COST_CENTERS.map((cc) => (
                        <SelectItem key={cc} value={cc}>
                          {cc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Valor" htmlFor="ex-amount" required error={form.formState.errors.amount?.message}>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <CurrencyInput id="ex-amount" value={field.value ?? 0} onChange={field.onChange} />
                )}
              />
            </Field>
            <Field label="Vencimento" htmlFor="ex-due" required error={form.formState.errors.dueDate?.message}>
              <Input id="ex-due" type="date" {...form.register("dueDate")} />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              {...form.register("recurring")}
            />
            Despesa recorrente (aluguel, energia…)
          </label>

          <Field label="Conta (boleto/fatura)" optional hint="Imagem ou PDF — fica guardada com a despesa.">
            <FileUpload scope="expenses" value={bill} onChange={setBill} />
          </Field>

          <Field label="Observação" htmlFor="ex-notes" optional>
            <Input id="ex-notes" {...form.register("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
