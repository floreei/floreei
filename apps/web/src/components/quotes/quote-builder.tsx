"use client";

import {
  calculateItem,
  calculateQuote,
  isFractionalUnit,
  quoteInputSchema,
  type Product,
  type Quote,
} from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { useCustomers } from "@/lib/api/customers";
import { useProducts } from "@/lib/api/catalog";
import { useSaveQuote } from "@/lib/api/quotes";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface QuoteBuilderProps {
  quote?: Quote;
}

type FormValues = {
  customerId: string;
  validUntil?: string;
  notes?: string;
  items: Array<{
    productId?: string | null;
    description: string;
    quantity: number;
    unit: Product["unit"];
    purchasePrice: number;
    salePrice: number;
  }>;
};

export function QuoteBuilder({ quote }: QuoteBuilderProps) {
  const router = useRouter();
  const { data: customers } = useCustomers({ pageSize: 100 });
  const { data: products } = useProducts({ pageSize: 200, onlyActive: true });
  const save = useSaveQuote(quote?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(quoteInputSchema),
    defaultValues: {
      customerId: quote?.customerId ?? "",
      validUntil: quote?.validUntil ?? "",
      notes: quote?.notes ?? "",
      items:
        quote?.items.map((i) => ({
          productId: i.productId,
          description: i.description,
          quantity: i.quantity,
          unit: i.unit,
          purchasePrice: i.purchasePrice,
          salePrice: i.salePrice,
        })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const totals = calculateQuote(
    (watchedItems ?? []).map((i) => ({
      quantity: Number(i.quantity) || 0,
      purchasePrice: Number(i.purchasePrice) || 0,
      salePrice: Number(i.salePrice) || 0,
    })),
  );

  const onSelectProduct = (index: number, productId: string) => {
    const product = products?.data.find((p) => p.id === productId);
    if (!product) return;
    form.setValue(`items.${index}.productId`, product.id);
    form.setValue(`items.${index}.description`, product.name);
    form.setValue(`items.${index}.unit`, product.unit);
    form.setValue(`items.${index}.purchasePrice`, product.defaultPurchasePrice);
    form.setValue(`items.${index}.salePrice`, product.defaultSalePrice);
    if (!form.getValues(`items.${index}.quantity`)) {
      form.setValue(`items.${index}.quantity`, 1);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const saved = await save.mutateAsync(values);
          toast.success(quote ? "Orçamento atualizado." : "Orçamento criado.");
          router.push(`/orcamentos/${saved.id}`);
        } catch (error) {
          toast.error(
            error instanceof ApiError ? error.message : "Erro ao salvar.",
          );
        }
      })}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cliente" required error={form.formState.errors.customerId?.message}>
                <Controller
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="customer-select">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.data.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Válido até" htmlFor="valid-until" optional>
                <Input id="valid-until" type="date" {...form.register("validUntil")} />
              </Field>
            </div>
            <Field label="Observações" htmlFor="q-notes" optional>
              <Textarea id="q-notes" rows={2} {...form.register("notes")} />
            </Field>
          </CardContent>
        </Card>

        <Card className="bg-primary/[0.04]">
          <CardContent className="space-y-3 p-6">
            <TotalRow label="Custo total" value={formatCurrency(totals.totalCost)} />
            <TotalRow label="Venda total" value={formatCurrency(totals.totalSale)} strong />
            <TotalRow
              label="Lucro"
              value={formatCurrency(totals.totalProfit)}
              accent
            />
            <TotalRow label="Margem" value={formatPercent(totals.marginPct)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="hidden grid-cols-[1fr_90px_120px_120px_130px_40px] gap-2 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
            <span>Item</span>
            <span className="text-right">Qtd.</span>
            <span className="text-right">Compra</span>
            <span className="text-right">Venda</span>
            <span className="text-right">Lucro</span>
            <span />
          </div>

          <div className="divide-y divide-border">
            {fields.map((fieldRow, index) => {
              const row = watchedItems?.[index];
              const line = calculateItem({
                quantity: Number(row?.quantity) || 0,
                purchasePrice: Number(row?.purchasePrice) || 0,
                salePrice: Number(row?.salePrice) || 0,
              });
              return (
                <div
                  key={fieldRow.id}
                  className="grid grid-cols-2 gap-2 p-4 md:grid-cols-[1fr_90px_120px_120px_130px_40px] md:items-center"
                  data-testid="quote-item-row"
                >
                  <div className="col-span-2 space-y-2 md:col-span-1">
                    <Controller
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? undefined}
                          onValueChange={(v) => onSelectProduct(index, v)}
                        >
                          <SelectTrigger className="h-9" data-testid="item-product-select">
                            <SelectValue placeholder="Escolher insumo" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.data
                              .filter((p) => p.defaultSalePrice > 0)
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <Input
                      className="h-9"
                      placeholder="Descrição do item"
                      {...form.register(`items.${index}.description`)}
                    />
                  </div>
                  <Input
                    className="h-9 text-right"
                    type="number"
                    step={isFractionalUnit(row?.unit ?? "UNIDADE") ? "any" : "1"}
                    min={isFractionalUnit(row?.unit ?? "UNIDADE") ? "0" : "1"}
                    aria-label="Quantidade"
                    {...form.register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                  <Input
                    className="h-9 text-right"
                    type="number"
                    step="0.01"
                    min="0"
                    aria-label="Preço de compra"
                    {...form.register(`items.${index}.purchasePrice`, {
                      valueAsNumber: true,
                    })}
                  />
                  <Input
                    className="h-9 text-right"
                    type="number"
                    step="0.01"
                    min="0"
                    aria-label="Preço de venda"
                    {...form.register(`items.${index}.salePrice`, {
                      valueAsNumber: true,
                    })}
                  />
                  <div className="text-right text-sm font-medium tabular-nums">
                    {formatCurrency(line.lineProfit)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover item"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  productId: null,
                  description: "",
                  quantity: 1,
                  unit: "UNIDADE",
                  purchasePrice: 0,
                  salePrice: 0,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Adicionar item
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" loading={form.formState.isSubmitting}>
          {quote ? "Salvar alterações" : "Criar orçamento"}
        </Button>
      </div>
    </form>
  );
}

function TotalRow({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`tabular-nums ${
          accent
            ? "text-base font-semibold text-clay"
            : strong
              ? "text-base font-semibold"
              : "text-sm font-medium"
        }`}
        data-testid={`total-${label.toLowerCase().replace(/\s/g, "-")}`}
      >
        {value}
      </span>
    </div>
  );
}
