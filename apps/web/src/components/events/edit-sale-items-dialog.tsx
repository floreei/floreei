"use client";

import type { Event, ProductUnit } from "@sistema-flores/types";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnitToggle } from "@/components/events/unit-toggle";
import { useArrangements } from "@/lib/api/arrangements";
import { useProducts } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { useEditSaleItems } from "@/lib/api/events";
import { unitLabels } from "@/lib/labels";
import {
  defaultSaleUnit,
  hasUnitChoice,
  suggestedUnitPrice,
} from "@/lib/sale-units";
import { cn, formatCurrency } from "@/lib/utils";

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

interface Sellable {
  kind: "arrangement" | "product";
  id: string;
  name: string;
  /** Preço por unidade de compra (produto) ou por buquê. */
  price: number;
  packSize?: number;
  purchaseUnit?: ProductUnit;
  unit?: ProductUnit;
}
interface CartItem {
  sellable: Sellable;
  quantity: number;
  price: number;
  saleUnit?: ProductUnit;
}
const key = (s: Sellable) => `${s.kind}:${s.id}`;

/** Reconstrói o carrinho dos itens já vendidos, cruzando com o catálogo atual. */
function cartFromEvent(
  event: Event,
  sellables: Sellable[],
): Record<string, CartItem> {
  const byKey = new Map(sellables.map((s) => [key(s), s]));
  const cart: Record<string, CartItem> = {};
  for (const item of event.items) {
    const k = item.arrangementId
      ? `arrangement:${item.arrangementId}`
      : `product:${item.productId}`;
    const sellable: Sellable =
      byKey.get(k) ??
      (item.arrangementId
        ? {
            kind: "arrangement",
            id: item.arrangementId,
            name: item.description,
            price: item.unitSalePrice,
          }
        : {
            kind: "product",
            id: item.productId ?? "",
            name: item.description,
            price: item.unitSalePrice,
            packSize: 1,
            unit: item.unit,
          });
    if (!sellable.id) continue;
    cart[key(sellable)] = {
      sellable,
      quantity: item.quantity,
      price: item.unitSalePrice,
      saleUnit: item.unit,
    };
  }
  return cart;
}

export function EditSaleItemsDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
}) {
  const { data: products, isLoading: loadingProducts } = useProducts({
    pageSize: 200,
    onlyActive: true,
  });
  const { data: arrangements } = useArrangements({
    pageSize: 200,
    onlyActive: true,
  });
  const save = useEditSaleItems(event.id);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [mode, setMode] = useState<"ITEMS" | "FIXED">("ITEMS");
  const [fixedValue, setFixedValue] = useState(0);

  const sellables = useMemo<Sellable[]>(
    () => [
      ...(arrangements?.data ?? []).map((a) => ({
        kind: "arrangement" as const,
        id: a.id,
        name: a.name,
        price: a.salePrice,
      })),
      ...(products?.data ?? []).map((p) => ({
        kind: "product" as const,
        id: p.id,
        name: p.name,
        price: p.defaultSalePrice,
        packSize: p.packSize,
        purchaseUnit: p.purchaseUnit,
        unit: p.unit,
      })),
    ],
    [arrangements, products],
  );

  // (Re)inicializa ao abrir: carrinho dos itens atuais e modo inferido dos dados.
  useEffect(() => {
    if (!open) return;
    const initial = cartFromEvent(event, sellables);
    setCart(initial);
    const sum = round(
      Object.values(initial).reduce((s, i) => s + i.quantity * i.price, 0),
    );
    const hasItems = Object.keys(initial).length > 0;
    setMode(hasItems && Math.abs(sum - event.soldValue) < 0.005 ? "ITEMS" : "FIXED");
    setFixedValue(event.soldValue);
    setSearch("");
  }, [open, event, sellables]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? sellables.filter((s) => s.name.toLowerCase().includes(term))
      : sellables;
  }, [sellables, search]);

  const cartItems = Object.values(cart);
  const itemsSum = round(
    cartItems.reduce((s, i) => s + i.quantity * i.price, 0),
  );

  const addSellable = (s: Sellable) =>
    setCart((c) => {
      const k = key(s);
      if (c[k]) {
        return { ...c, [k]: { ...c[k], quantity: c[k].quantity + 1 } };
      }
      const saleUnit = defaultSaleUnit(s);
      return {
        ...c,
        [k]: { sellable: s, quantity: 1, price: suggestedUnitPrice(s, saleUnit), saleUnit },
      };
    });
  const setPrice = (k: string, price: number) =>
    setCart((c) => (c[k] ? { ...c, [k]: { ...c[k], price } } : c));
  const changeSaleUnit = (k: string, saleUnit: ProductUnit) =>
    setCart((c) =>
      c[k]
        ? {
            ...c,
            [k]: {
              ...c[k],
              saleUnit,
              price: suggestedUnitPrice(c[k].sellable, saleUnit),
            },
          }
        : c,
    );
  const changeQty = (k: string, delta: number) =>
    setCart((c) => {
      const cur = c[k];
      if (!cur) return c;
      const quantity = cur.quantity + delta;
      if (quantity <= 0) {
        const { [k]: _drop, ...rest } = c;
        return rest;
      }
      return { ...c, [k]: { ...cur, quantity } };
    });

  const total = mode === "ITEMS" ? itemsSum : round(fixedValue);
  const canSubmit = cartItems.length > 0;

  const submit = async () => {
    try {
      await save.mutateAsync({
        pricingMode: mode,
        soldValue: mode === "FIXED" ? round(fixedValue) : undefined,
        items: cartItems.map((i) =>
          i.sellable.kind === "arrangement"
            ? { arrangementId: i.sellable.id, quantity: i.quantity, unitSalePrice: i.price }
            : {
                productId: i.sellable.id,
                quantity: i.quantity,
                saleUnit: i.saleUnit,
                unitSalePrice: i.price,
              },
        ),
      });
      toast.success("Itens da venda atualizados.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível salvar.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar itens vendidos</DialogTitle>
          <DialogDescription>
            Os itens dão baixa no estoque e definem o custo. Escolha se o total
            segue a soma dos itens ou fica com um valor fixo.
          </DialogDescription>
        </DialogHeader>

        {/* Seletor do total */}
        <div className="inline-flex w-fit rounded-lg border border-border p-1">
          <ModeButton active={mode === "ITEMS"} onClick={() => setMode("ITEMS")}>
            Somar itens
          </ModeButton>
          <ModeButton active={mode === "FIXED"} onClick={() => setMode("FIXED")}>
            Valor fixo
          </ModeButton>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Catálogo */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar buquê ou produto…"
                className="h-11 pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {filtered.map((s) => (
                <button
                  key={key(s)}
                  type="button"
                  onClick={() => addSellable(s)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <span className="flex items-center gap-2 truncate text-sm font-medium">
                    {s.name}
                    {s.kind === "arrangement" ? (
                      <Badge variant="default">Buquê</Badge>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(s.price)}
                  </span>
                </button>
              ))}
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {loadingProducts ? "Carregando…" : "Nada encontrado."}
                </p>
              ) : null}
            </div>
          </div>

          {/* Carrinho */}
          <div className="flex flex-col rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="h-4 w-4" /> Itens da venda
            </div>
            <div className="max-h-56 flex-1 space-y-2 overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Toque num item para adicionar.
                </p>
              ) : (
                cartItems.map((item) => {
                  const k = key(item.sellable);
                  return (
                    <div key={k} className="space-y-2 rounded-md bg-background p-2">
                      <div className="flex items-center gap-2">
                        <span className="flex-1 truncate text-sm font-medium">
                          {item.sellable.name}
                        </span>
                        <button
                          type="button"
                          aria-label="Menos"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border"
                          onClick={() => changeQty(k, -1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Mais"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border"
                          onClick={() => changeQty(k, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remover"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => changeQty(k, -item.quantity)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {hasUnitChoice(item.sellable) ? (
                        <UnitToggle
                          purchaseUnit={item.sellable.purchaseUnit as ProductUnit}
                          unit={item.sellable.unit as ProductUnit}
                          value={item.saleUnit}
                          onChange={(u) => changeSaleUnit(k, u)}
                        />
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`ep-${k}`} className="text-xs text-muted-foreground">
                          Preço{item.saleUnit ? `/${unitLabels[item.saleUnit]}` : ""}
                        </Label>
                        <CurrencyInput
                          id={`ep-${k}`}
                          className="h-8"
                          value={item.price}
                          onChange={(v) => setPrice(k, v)}
                        />
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatCurrency(round(item.quantity * item.price))}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-xl bg-primary/[0.06] px-4 py-3">
          {mode === "ITEMS" ? (
            <>
              <span className="text-sm font-medium">Total (soma dos itens)</span>
              <span className="font-serif text-lg font-semibold tabular-nums">
                {formatCurrency(itemsSum)}
              </span>
            </>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <div>
                <Label htmlFor="fixed-total" className="text-sm font-medium">
                  Valor fixo da venda
                </Label>
                <p className="text-xs text-muted-foreground">
                  Soma dos itens: {formatCurrency(itemsSum)}
                </p>
              </div>
              <CurrencyInput
                id="fixed-total"
                className="h-11 w-40 text-right text-base"
                value={fixedValue}
                onChange={setFixedValue}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={save.isPending} disabled={!canSubmit}>
            Salvar itens ({formatCurrency(total)})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
