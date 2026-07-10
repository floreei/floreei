"use client";

import {
  productInputSchema,
  type Product,
  type ProductUnit,
} from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { CategoryDialog } from "@/components/catalog/category-dialog";
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
import { useCategories, useSaveProduct } from "@/lib/api/catalog";
import { unitLabels, unitOptions } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  defaultCategoryId?: string;
  onCreated?: (product: Product) => void;
  /** Torna o preço de venda obrigatório (ex.: cadastro aberto de dentro da venda no atacado, que só lista insumos com preço definido). */
  requireSalePrice?: boolean;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  defaultCategoryId,
  onCreated,
  requireSalePrice,
}: ProductDialogProps) {
  const { data: categories } = useCategories();
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  // Remonta o Select ao definir a categoria programaticamente (criação
  // inline) — o Radix não atualiza o item "marcado" de forma confiável
  // quando o valor muda fora de uma interação do próprio usuário.
  const [categorySelectKey, setCategorySelectKey] = useState(0);
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
        categoryId: product?.categoryId ?? defaultCategoryId ?? categories?.[0]?.id ?? "",
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
    // `categories` de propósito fora das deps: recarrega (nova referência) ao
    // criar categoria inline, e isso não deve resetar o resto do formulário
    // que o usuário já preencheu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, defaultCategoryId, form]);

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
            if (requireSalePrice && !(values.defaultSalePrice > 0)) {
              form.setError("defaultSalePrice", {
                message: "Preço obrigatório pra vender este insumo no atacado.",
              });
              return;
            }
            try {
              const saved = await save.mutateAsync(values);
              toast.success("Insumo salvo.");
              onCreated?.(saved);
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
            <Field
              label="Categoria"
              required
              error={form.formState.errors.categoryId?.message}
              action={
                <button
                  type="button"
                  onClick={() => setNewCategoryOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nova categoria
                </button>
              }
            >
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    key={categorySelectKey}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger data-testid="product-category-select">
                      {/* children explícito (não só placeholder): o Radix só
                          "aprende" o texto de um SelectItem quando o menu já
                          foi aberto pelo menos uma vez — sem isso, selecionar
                          uma categoria criada na hora (via "Nova categoria")
                          mostraria "Selecione" mesmo com o valor certo. */}
                      <SelectValue
                        placeholder={
                          categories?.length === 0
                            ? "Nenhuma categoria ainda"
                            : "Selecione"
                        }
                      >
                        {categories?.find((c) => c.id === field.value)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(categories ?? []).map((c) => (
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
              required={requireSalePrice}
              optional={!requireSalePrice}
              error={form.formState.errors.defaultSalePrice?.message}
              hint={
                salePrice > 0 && isPack
                  ? `= ${formatCurrency(salePerUnit)}/${unitLabel} ao vender por ${unitLabel}.`
                  : requireSalePrice
                    ? "Sem preço, este insumo não aparece na lista da venda no atacado."
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
            // Último campo antes do rodapé sticky: o rodapé fica sempre
            // colado no fim da área visível (é o objetivo dele — Cancelar/
            // Salvar sem precisar rolar até o fundo), então precisa de uma
            // folga própria pra não cobrir a última linha de texto quando o
            // formulário é rolado até o fim.
            className="pb-1"
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

        <CategoryDialog
          open={newCategoryOpen}
          onOpenChange={setNewCategoryOpen}
          onCreated={(category) => {
            form.setValue("categoryId", category.id, { shouldValidate: true });
            setCategorySelectKey((k) => k + 1);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
