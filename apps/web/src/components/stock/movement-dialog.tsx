"use client";

import {
  isFractionalUnit,
  stockMovementInputSchema,
  type StockMovementType,
} from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
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
import { useProducts } from "@/lib/api/catalog";
import { useRegisterMovement } from "@/lib/api/stock";

const types: Array<[StockMovementType, string]> = [
  ["ENTRADA", "Entrada"],
  ["SAIDA", "Saída"],
  ["PERDA", "Perda / quebra"],
  ["AJUSTE", "Ajuste de inventário"],
];

export function MovementDialog({
  open,
  onOpenChange,
  productId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
}) {
  const { data: products } = useProducts({ pageSize: 200 });
  const register = useRegisterMovement();
  const form = useForm({
    resolver: zodResolver(stockMovementInputSchema),
    defaultValues: {
      productId: productId ?? "",
      type: "PERDA" as StockMovementType,
      quantity: 1,
      lot: "",
      expiresAt: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        productId: productId ?? "",
        type: "PERDA",
        quantity: 1,
        lot: "",
        expiresAt: "",
        notes: "",
      });
    }
  }, [open, productId, form]);

  const selectedUnit =
    products?.data.find((p) => p.id === form.watch("productId"))?.unit ??
    "UNIDADE";
  const fractionalQty = isFractionalUnit(selectedUnit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimentar estoque</DialogTitle>
          <DialogDescription>
            Registre perdas, ajustes ou entradas/saídas avulsas.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await register.mutateAsync(values);
              toast.success("Movimentação registrada.");
              onOpenChange(false);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao registrar.",
              );
            }
          })}
        >
          <Field label="Produto" required error={form.formState.errors.productId?.message}>
            <Controller
              control={form.control}
              name="productId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.data.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Quantidade" htmlFor="m-qty" required error={form.formState.errors.quantity?.message}>
              <Input
                id="m-qty"
                type="number"
                step={fractionalQty ? "any" : "1"}
                min={fractionalQty ? "0" : "1"}
                {...form.register("quantity", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lote" htmlFor="m-lot" optional>
              <Input id="m-lot" {...form.register("lot")} />
            </Field>
            <Field label="Validade" htmlFor="m-exp" optional>
              <Input id="m-exp" type="date" {...form.register("expiresAt")} />
            </Field>
          </div>

          <Field label="Observação" htmlFor="m-notes" optional>
            <Input id="m-notes" {...form.register("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
