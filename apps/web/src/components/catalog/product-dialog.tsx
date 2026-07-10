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
import { NcmCombobox } from "@/components/catalog/ncm-combobox";
import { FileUpload } from "@/components/shared/file-upload";
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
import { unitLabels, unitOptions } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";

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
      purchaseUnit: "UNIDADE" as ProductUnit,
      packSize: 1,
      defaultPurchasePrice: 0,
      defaultSalePrice: 0,
      currentUnitCost: 0,
      minStock: 0,
      active: true,
      imageUrl: null as string | null,
      ncm: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        categoryId: product?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
        name: product?.name ?? "",
        unit: product?.unit ?? "UNIDADE",
        purchaseUnit: product?.purchaseUnit ?? product?.unit ?? "UNIDADE",
        packSize: product?.packSize ?? 1,
        defaultPurchasePrice: product?.defaultPurchasePrice ?? 0,
        defaultSalePrice: product?.defaultSalePrice ?? 0,
        currentUnitCost: product?.currentUnitCost ?? 0,
        minStock: product?.minStock ?? 0,
        active: product?.active ?? true,
        imageUrl: product?.imageUrl ?? null,
        ncm: product?.ncm ?? "",
      });
    }
  }, [open, product, defaultCategoryId, categories, form]);

  const unitLabel = unitLabels[form.watch("unit")];
  const purchaseUnitLabel = unitLabels[form.watch("purchaseUnit")];
  const packSize = form.watch("packSize") || 1;
  const purchasePrice = form.watch("defaultPurchasePrice") || 0;
  const derivedCost = packSize > 0 ? purchasePrice / packSize : 0;
  const salePrice = form.watch("defaultSalePrice") || 0;
  const salePerUnit = packSize > 1 ? salePrice / packSize : 0;
  const isPack = packSize > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Editar insumo" : "Novo insumo"}</DialogTitle>
          <DialogDescription>
            Flores, folhagens, materiais (laços, papel, cola), doces ou itens
            decorativos — tudo que você compra para compor buquês e/ou vender.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await save.mutateAsync(values);
              toast.success("Insumo salvo.");
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

          <Field
            label="Imagem do item"
            optional
            hint="Aparece no catálogo e no seletor de insumo do buquê."
          >
            <Controller
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  {field.value ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={field.value}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md border border-border object-cover"
                    />
                  ) : null}
                  <FileUpload
                    scope="products"
                    accept="image/*"
                    label="Enviar imagem"
                    value={field.value ? { url: field.value, label: "Imagem" } : null}
                    onChange={(f) => field.onChange(f?.url ?? null)}
                  />
                </div>
              )}
            />
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
            <Field label="Unidade de consumo" hint="Como você usa/estoca (ex.: haste).">
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
            <Field label="Unidade de compra" hint="Embalagem do fornecedor (ex.: maço).">
              <Controller
                control={form.control}
                name="purchaseUnit"
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
            <Field
              label="Conteúdo do pacote"
              htmlFor="p-packsize"
              hint={`Quantas ${unitLabel} vêm em 1 ${purchaseUnitLabel}.`}
            >
              <Input
                id="p-packsize"
                type="number"
                step="any"
                min="0.001"
                {...form.register("packSize", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preço de compra (do pacote)" htmlFor="p-purchase">
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
            <Field
              label={
                isPack
                  ? `Preço de venda avulsa (do ${purchaseUnitLabel})`
                  : "Preço de venda avulsa"
              }
              htmlFor="p-sale"
              optional
              hint={
                salePrice > 0 && isPack
                  ? `= ${formatCurrency(salePerUnit)}/${unitLabel} ao vender por ${unitLabel}.`
                  : "Só se você revende este insumo. Se ele só entra em buquês (ex.: um urso), deixe zerado — o custo já vai no preço do buquê."
              }
            >
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
            label={`Custo por ${unitLabel}`}
            htmlFor="p-cost"
            hint={`Atualizado pela última compra (${formatCurrency(derivedCost)}/${unitLabel} pelo pacote atual). Pode ajustar.`}
          >
            <Controller
              control={form.control}
              name="currentUnitCost"
              render={({ field }) => (
                <CurrencyInput
                  id="p-cost"
                  className="max-w-[200px]"
                  value={field.value ?? 0}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>

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

          <Field
            label="NCM"
            optional
            error={form.formState.errors.ncm?.message}
            hint="Código fiscal — só necessário pra emitir nota fiscal."
          >
            <Controller
              control={form.control}
              name="ncm"
              render={({ field }) => (
                <NcmCombobox
                  data-testid="product-ncm-combobox"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  className="max-w-[320px]"
                />
              )}
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
