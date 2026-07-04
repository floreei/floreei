"use client";

import {
  productInputSchema,
  type Category,
  type Product,
  type ProductUnit,
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
import { useSaveProduct } from "@/lib/api/catalog";
import { unitOptions } from "@/lib/labels";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  categories: Category[];
  defaultCategoryId?: string;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  defaultCategoryId,
}: ProductDialogProps) {
  const save = useSaveProduct(product?.id);
  const form = useForm({
    resolver: zodResolver(productInputSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      unit: "UNIDADE" as ProductUnit,
      defaultPurchasePrice: 0,
      defaultSalePrice: 0,
      minStock: 0,
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        categoryId: product?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
        name: product?.name ?? "",
        unit: product?.unit ?? "UNIDADE",
        defaultPurchasePrice: product?.defaultPurchasePrice ?? 0,
        defaultSalePrice: product?.defaultSalePrice ?? 0,
        minStock: product?.minStock ?? 0,
        active: product?.active ?? true,
      });
    }
  }, [open, product, defaultCategoryId, categories, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            Flor, folhagem ou insumo reutilizável nos orçamentos.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await save.mutateAsync(values);
              toast.success("Produto salvo.");
              onOpenChange(false);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao salvar.",
              );
            }
          })}
        >
          <Field label="Nome" htmlFor="p-name" required error={form.formState.errors.name?.message}>
            <Input id="p-name" autoFocus {...form.register("name")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoria" required error={form.formState.errors.categoryId?.message}>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="product-category-select">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Unidade">
              <Controller
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preço de compra" htmlFor="p-purchase">
              <Controller
                control={form.control}
                name="defaultPurchasePrice"
                render={({ field }) => (
                  <CurrencyInput
                    id="p-purchase"
                    value={field.value ?? 0}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field label="Preço de venda" htmlFor="p-sale">
              <Controller
                control={form.control}
                name="defaultSalePrice"
                render={({ field }) => (
                  <CurrencyInput
                    id="p-sale"
                    value={field.value ?? 0}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
          </div>

          <Field
            label="Estoque mínimo"
            htmlFor="p-minstock"
            optional
            hint="Avisa quando o saldo ficar neste nível ou abaixo. 0 desativa o alerta."
          >
            <Input
              id="p-minstock"
              type="number"
              step="1"
              min="0"
              className="max-w-[160px]"
              {...form.register("minStock", { valueAsNumber: true })}
            />
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
