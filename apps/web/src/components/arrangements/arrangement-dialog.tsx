"use client";

import {
  arrangementInputSchema,
  arrangementSalePrice,
  calculateArrangement,
  isFractionalUnit,
  type Arrangement,
  type ArrangementPricingMode,
} from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/file-upload";
import { ProductCombobox } from "@/components/catalog/product-combobox";
import { ApiError } from "@/lib/api/client";
import { useSaveArrangement } from "@/lib/api/arrangements";
import { useProducts } from "@/lib/api/catalog";
import { cn, formatCurrency } from "@/lib/utils";

type ItemForm = { productId: string; quantity: number };
type FormValues = {
  name: string;
  pricingMode: ArrangementPricingMode;
  salePrice: number;
  profitValue: number;
  profitPct: number;
  active: boolean;
  imageUrl: string | null;
  storePublished: boolean;
  items: ItemForm[];
  produce: number;
};

const emptyItem: ItemForm = { productId: "", quantity: 1 };

const pricingModes: Array<[ArrangementPricingMode, string]> = [
  ["FIXED", "Preço fixo"],
  ["PROFIT_VALUE", "Lucro (R$)"],
  ["MARGIN_PCT", "Lucro s/ custo (%)"],
];

function initialValues(a?: Arrangement | null): FormValues {
  return {
    name: a?.name ?? "",
    pricingMode: a?.pricingMode ?? "FIXED",
    salePrice: a?.salePrice ?? 0,
    profitValue: a?.profitValue ?? 0,
    profitPct: a?.profitPct ?? 0,
    active: a?.active ?? true,
    imageUrl: a?.imageUrl ?? null,
    storePublished: a?.storePublished ?? false,
    items: a?.items.length
      ? a.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      : [{ ...emptyItem }],
    produce: 0,
  };
}

export function ArrangementDialog({
  open,
  onOpenChange,
  arrangement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arrangement?: Arrangement | null;
}) {
  const { data: products } = useProducts({ pageSize: 200, onlyActive: true });
  const save = useSaveArrangement(arrangement?.id);
  const isEdit = Boolean(arrangement);

  const form = useForm<FormValues>({
    resolver: zodResolver(arrangementInputSchema),
    defaultValues: initialValues(arrangement),
  });

  useEffect(() => {
    if (open) form.reset(initialValues(arrangement));
  }, [open, arrangement, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");
  const pricingMode = form.watch("pricingMode");
  const productById = (id: string) => products?.data.find((p) => p.id === id);

  const components = (items ?? []).map((i) => ({
    quantity: Number(i.quantity) || 0,
    unitCost: productById(i.productId)?.currentUnitCost ?? 0,
  }));
  const cost = calculateArrangement(components, 0).cost;
  // Preço efetivo conforme a política (fixo / lucro R$ / margem %).
  const effectivePrice = arrangementSalePrice(cost, pricingMode, {
    salePrice: Number(form.watch("salePrice")) || 0,
    profitValue: Number(form.watch("profitValue")) || 0,
    profitPct: Number(form.watch("profitPct")) || 0,
  });
  const totals = calculateArrangement(components, effectivePrice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar buquê" : "Novo buquê"}</DialogTitle>
          <DialogDescription>
            Monte a ficha técnica com os insumos — flores, folhagens, laços,
            bombons, itens decorativos — e a quantidade de cada um. O custo vem
            do custo atual de cada insumo.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await save.mutateAsync(values);
              const qty = Number(values.produce) || 0;
              toast.success(
                isEdit
                  ? "Buquê atualizado."
                  : qty > 0
                    ? `Buquê criado — ${qty} produzido(s), estoque baixado.`
                    : "Buquê criado.",
              );
              onOpenChange(false);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao salvar.",
              );
            }
          })}
        >
          <Field label="Nome" htmlFor="a-name" required error={form.formState.errors.name?.message}>
            <Input id="a-name" autoFocus placeholder="Buquê Encanto" {...form.register("name")} />
          </Field>

          <div className="space-y-2">
            <Label>Como definir o preço</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-lg border border-border p-1">
                {pricingModes.map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => form.setValue("pricingMode", mode)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      pricingMode === mode
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="max-w-[200px]">
                {pricingMode === "FIXED" ? (
                  <Controller
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <CurrencyInput id="a-sale" value={field.value ?? 0} onChange={field.onChange} />
                    )}
                  />
                ) : pricingMode === "PROFIT_VALUE" ? (
                  <Controller
                    control={form.control}
                    name="profitValue"
                    render={({ field }) => (
                      <CurrencyInput
                        id="a-profit"
                        value={field.value ?? 0}
                        onChange={field.onChange}
                      />
                    )}
                  />
                ) : (
                  <div className="relative">
                    <Input
                      id="a-margin"
                      type="number"
                      min="0"
                      step="1"
                      className="pr-8 text-right"
                      {...form.register("profitPct")}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {pricingMode === "FIXED"
                ? "Você define o preço de venda."
                : pricingMode === "MARGIN_PCT"
                  ? "Preço = custo + esse % sobre o custo. Ex.: 100% dobra o custo. Acompanha o custo dos insumos."
                  : "O preço acompanha o custo dos insumos para manter o lucro."}
            </p>
          </div>

          {/* Ficha técnica */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ficha técnica (insumos)</Label>
              {form.formState.errors.items?.message ? (
                <span className="text-xs font-medium text-destructive">
                  {form.formState.errors.items.message}
                </span>
              ) : null}
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {fields.map((row, index) => {
                const product = productById(items?.[index]?.productId ?? "");
                const qty = Number(items?.[index]?.quantity) || 0;
                const lineCost = (product?.currentUnitCost ?? 0) * qty;
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_92px_auto_auto] items-center gap-2 rounded-lg border border-border/70 p-2"
                    data-testid="arrangement-item-row"
                  >
                    <Controller
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <ProductCombobox
                          value={field.value}
                          onChange={field.onChange}
                          data-testid="arrangement-item-product"
                        />
                      )}
                    />
                    <Input
                      className="h-9 text-right"
                      type="number"
                      step={isFractionalUnit(product?.unit ?? "UNIDADE") ? "any" : "1"}
                      min={isFractionalUnit(product?.unit ?? "UNIDADE") ? "0" : "1"}
                      aria-label="Quantidade"
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                    <span className="w-20 text-right text-sm font-medium tabular-nums text-muted-foreground">
                      {formatCurrency(lineCost)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remover insumo"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
              <Plus className="h-4 w-4" />
              Adicionar insumo
            </Button>
          </div>

          {!isEdit ? (
            <Field
              label="Produzir agora (opcional)"
              htmlFor="a-produce"
              hint="Baixa esta quantidade × a ficha técnica do estoque, registrando a fabricação. Deixe 0 para só cadastrar a receita."
            >
              <Input
                id="a-produce"
                type="number"
                min="0"
                step="1"
                className="max-w-[160px]"
                {...form.register("produce")}
              />
            </Field>
          ) : null}

          {/* Loja online */}
          <div className="space-y-3 rounded-lg border border-border/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="a-published">Publicar na loja online</Label>
                <p className="text-xs text-muted-foreground">
                  Aparece na vitrine da sua loja, com foto e preço.
                </p>
              </div>
              <input
                id="a-published"
                type="checkbox"
                className="h-5 w-5 shrink-0 accent-primary"
                {...form.register("storePublished")}
              />
            </div>
            <Controller
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FileUpload
                  scope="arrangements"
                  accept="image/*"
                  label="Enviar foto do buquê"
                  value={
                    field.value
                      ? {
                          url: field.value,
                          label: "Foto do buquê",
                          contentType: "image/*",
                        }
                      : null
                  }
                  onChange={(f) => field.onChange(f?.url ?? null)}
                />
              )}
            />
          </div>

          {/* Preço / custo / margem ao vivo */}
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-primary/[0.05] p-4 text-center sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Preço de venda</p>
              <p
                className="font-serif text-xl font-semibold tabular-nums"
                data-testid="arrangement-price"
              >
                {formatCurrency(effectivePrice)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Custo</p>
              <p className="font-serif text-xl font-semibold tabular-nums" data-testid="arrangement-cost">
                {formatCurrency(totals.cost)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Lucro</p>
              <p
                className={cn(
                  "font-serif text-xl font-semibold tabular-nums",
                  totals.margin < 0 ? "text-destructive" : "text-success",
                )}
              >
                {formatCurrency(totals.margin)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Margem</p>
              <p className="font-serif text-xl font-semibold tabular-nums">
                {totals.marginPercent.toFixed(1)}%
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {isEdit ? "Salvar alterações" : "Criar buquê"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
