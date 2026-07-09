"use client";

import {
  purchaseInputSchema,
  sumMoney,
  type Product,
  type Purchase,
} from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackageCheck, Plus, Trash2, Truck } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { useProducts } from "@/lib/api/catalog";
import { useSavePurchase } from "@/lib/api/purchases";
import { useSuppliers } from "@/lib/api/suppliers";
import { unitLabels } from "@/lib/labels";
import { cn, formatCurrency } from "@/lib/utils";

type ItemForm = {
  productId?: string | null;
  description: string;
  quantity: number;
  unit: Product["unit"];
  unitPrice: number;
};

type FormValues = {
  supplierId: string;
  date: string;
  deliveryDate?: string;
  deliveryTime?: string;
  status: Purchase["status"];
  freight: number;
  notes?: string;
  items: ItemForm[];
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const emptyItem: ItemForm = {
  productId: null,
  description: "",
  quantity: 1,
  unit: "MACO",
  unitPrice: 0,
};

function initialValues(purchase?: Purchase | null): FormValues {
  return {
    supplierId: purchase?.supplierId ?? "",
    date: purchase?.date ?? todayStr(),
    deliveryDate: purchase?.deliveryDate ?? "",
    deliveryTime: purchase?.deliveryTime ?? "",
    status: purchase?.status ?? "ORDERED",
    freight: purchase?.freight ?? 0,
    notes: purchase?.notes ?? "",
    items: purchase?.items.length
      ? purchase.items.map((i) => ({
          productId: i.productId,
          description: i.description,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
        }))
      : [{ ...emptyItem }],
  };
}

export function PurchaseDialog({
  open,
  onOpenChange,
  purchase,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase?: Purchase | null;
}) {
  const { data: suppliers } = useSuppliers({ pageSize: 100 });
  const { data: products } = useProducts({ pageSize: 200, onlyActive: true });
  const save = useSavePurchase(purchase?.id);
  const isEdit = Boolean(purchase);

  const form = useForm<FormValues>({
    resolver: zodResolver(purchaseInputSchema),
    defaultValues: initialValues(purchase),
  });

  // Carrega os dados ao abrir (edição precisa trazer itens/entrega — não é cadastro).
  useEffect(() => {
    if (open) form.reset(initialValues(purchase));
  }, [open, purchase, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");
  const freight = Number(form.watch("freight")) || 0;
  const received = form.watch("status") === "RECEIVED";
  const itemsTotal = sumMoney(
    (items ?? []).map((i) => (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)),
  );
  const total = itemsTotal + freight;

  const onPickProduct = (index: number, productId: string) => {
    const product = products?.data.find((p) => p.id === productId);
    if (!product) return;
    form.setValue(`items.${index}.productId`, product.id);
    form.setValue(`items.${index}.description`, product.name);
    // A quantidade é em EMBALAGENS de compra; o estoque converte por packSize.
    form.setValue(`items.${index}.unit`, product.purchaseUnit);
    // Preenche o preço padrão do catálogo (por embalagem) — editável.
    if (!form.getValues(`items.${index}.unitPrice`)) {
      form.setValue(`items.${index}.unitPrice`, product.defaultPurchasePrice);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar compra" : "Nova compra"}</DialogTitle>
          <DialogDescription>
            Escolha o fornecedor, liste os itens (insumos, para atualizar o
            estoque) — flores, materiais, doces, decorativos — a entrega e o valor.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await save.mutateAsync(values);
              toast.success(isEdit ? "Compra atualizada." : "Compra registrada.");
              onOpenChange(false);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao salvar.",
              );
            }
          })}
        >
          {/* Fornecedor + data do pedido */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Fornecedor"
              required
              className="sm:col-span-2"
              error={form.formState.errors.supplierId?.message}
            >
              <Controller
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="purchase-supplier-select">
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.data.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Data do pedido" htmlFor="pu-date" required>
              <Input id="pu-date" type="date" {...form.register("date")} />
            </Field>
          </div>

          {/* Itens (flores) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Insumos</Label>
              <span className="text-xs text-muted-foreground">
                Ligue ao insumo para entrar no estoque
              </span>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {fields.map((row, index) => {
                const qty = Number(items?.[index]?.quantity) || 0;
                const unitPrice = Number(items?.[index]?.unitPrice) || 0;
                const line = qty * unitPrice;
                const prod = products?.data.find(
                  (p) => p.id === items?.[index]?.productId,
                );
                const perUnit =
                  prod && prod.packSize > 1 ? unitPrice / prod.packSize : null;
                return (
                  <div
                    key={row.id}
                    className="space-y-2 rounded-lg border border-border/70 p-3"
                    data-testid="purchase-item-row"
                  >
                    <div className="flex items-center gap-2">
                      <Controller
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <Select
                            value={field.value ?? undefined}
                            onValueChange={(v) => onPickProduct(index, v)}
                          >
                            <SelectTrigger
                              className="h-9 flex-1"
                              data-testid="purchase-item-product"
                            >
                              <SelectValue placeholder="Insumo" />
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
                    <Input
                      className="h-9"
                      placeholder="Ou descreva (não atualiza estoque)"
                      {...form.register(`items.${index}.description`)}
                    />
                    <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Qtd.</Label>
                        <Input
                          className="h-9 text-right"
                          type="number"
                          step="0.001"
                          min="0"
                          aria-label="Quantidade"
                          {...form.register(`items.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Preço unit.
                        </Label>
                        <Controller
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <CurrencyInput
                              className="h-9"
                              aria-label="Preço unitário"
                              value={field.value ?? 0}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                      <div className="pb-2 text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(line)}
                        </span>
                      </div>
                    </div>
                    {perUnit != null && prod ? (
                      <p className="text-right text-xs text-muted-foreground">
                        ≈ {formatCurrency(perUnit)}/
                        {unitLabels[prod.unit].toLowerCase()} ({prod.packSize}{" "}
                        {unitLabels[prod.unit].toLowerCase()} por{" "}
                        {unitLabels[prod.purchaseUnit].toLowerCase()})
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...emptyItem })}
            >
              <Plus className="h-4 w-4" />
              Adicionar item
            </Button>
          </div>

          {/* Entrega */}
          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Entrega
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data prevista" htmlFor="pu-delivery-date" optional>
                <Input
                  id="pu-delivery-date"
                  type="date"
                  {...form.register("deliveryDate")}
                />
              </Field>
              <Field label="Horário" htmlFor="pu-delivery-time" optional>
                <Input
                  id="pu-delivery-time"
                  type="time"
                  {...form.register("deliveryTime")}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => form.setValue("status", "ORDERED")}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                  !received
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <Truck className="h-4 w-4" />
                Ainda não chegou
              </button>
              <button
                type="button"
                onClick={() => form.setValue("status", "RECEIVED")}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                  received
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <PackageCheck className="h-4 w-4" />
                Já recebi
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {received
                ? "As flores entram no estoque ao salvar."
                : "Marque “Já recebi” aqui ou na compra para dar entrada no estoque."}
            </p>
          </div>

          {/* Frete + total */}
          <div className="flex items-end justify-between gap-4 rounded-lg bg-primary/[0.05] p-4">
            <Field label="Frete" htmlFor="pu-freight" optional className="max-w-[160px]">
              <Controller
                control={form.control}
                name="freight"
                render={({ field }) => (
                  <CurrencyInput
                    id="pu-freight"
                    value={field.value ?? 0}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total da compra
              </p>
              <p
                className="font-serif text-2xl font-semibold tabular-nums"
                data-testid="purchase-total"
              >
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          <Field label="Observações" htmlFor="pu-notes" optional>
            <Textarea id="pu-notes" rows={2} {...form.register("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {isEdit ? "Salvar alterações" : "Registrar compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
