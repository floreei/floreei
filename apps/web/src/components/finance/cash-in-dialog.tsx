"use client";

import { cashInSchema } from "@sistema-flores/types";
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
import { ApiError } from "@/lib/api/client";
import { useCashIn } from "@/lib/api/finance";

export function CashInDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cashIn = useCashIn();
  const form = useForm({
    resolver: zodResolver(cashInSchema),
    defaultValues: { amount: 0, description: "", method: "CASH" as const },
  });

  useEffect(() => {
    if (open) form.reset({ amount: 0, description: "", method: "CASH" });
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Entrada de caixa</DialogTitle>
          <DialogDescription>
            Uma entrada avulsa (não ligada a uma venda).
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await cashIn.mutateAsync(values);
              toast.success("Entrada registrada.");
              onOpenChange(false);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao lançar.",
              );
            }
          })}
        >
          <Field label="Descrição" htmlFor="ci-desc" required error={form.formState.errors.description?.message}>
            <Input id="ci-desc" autoFocus placeholder="Ex.: venda avulsa" {...form.register("description")} />
          </Field>
          <Field label="Valor" htmlFor="ci-amount" required error={form.formState.errors.amount?.message}>
            <Controller
              control={form.control}
              name="amount"
              render={({ field }) => (
                <CurrencyInput
                  id="ci-amount"
                  className="h-12 lg:h-12 text-lg"
                  value={field.value ?? 0}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Registrar entrada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
