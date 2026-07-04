"use client";

import {
  COST_CENTERS,
  expenseInputSchema,
  type Expense,
} from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
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
import { useSaveExpense } from "@/lib/api/expenses";

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
  const form = useForm({
    resolver: zodResolver(expenseInputSchema),
    defaultValues: {
      description: "",
      costCenter: "Outros",
      amount: 0,
      date: todayStr(),
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        description: expense?.description ?? "",
        costCenter: expense?.costCenter ?? "Outros",
        amount: expense?.amount ?? 0,
        date: expense?.date ?? todayStr(),
        notes: expense?.notes ?? "",
      });
    }
  }, [open, expense, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? "Editar despesa" : "Nova despesa"}</DialogTitle>
          <DialogDescription>
            Custos operacionais que entram no resultado (DRE).
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await save.mutateAsync(values);
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
            <Field label="Categoria" className="sm:col-span-1">
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
                  <CurrencyInput
                    id="ex-amount"
                    value={field.value ?? 0}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field label="Data" htmlFor="ex-date" required>
              <Input id="ex-date" type="date" {...form.register("date")} />
            </Field>
          </div>
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
