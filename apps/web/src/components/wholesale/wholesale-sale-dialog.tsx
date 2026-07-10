"use client";

import type { Customer, Product, ProductUnit } from "@sistema-flores/types";
import { Minus, Plus, Search, ShoppingCart, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductDialog } from "@/components/catalog/product-dialog";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { UnitToggle } from "@/components/events/unit-toggle";
import { Field } from "@/components/shared/field";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { useProducts } from "@/lib/api/catalog";
import { useCustomers } from "@/lib/api/customers";
import { useQuickSale } from "@/lib/api/events";
import { useReceiveForEvent } from "@/lib/api/finance";
import { unitLabels } from "@/lib/labels";
import {
  defaultSaleUnit,
  hasUnitChoice,
  suggestedUnitPrice,
} from "@/lib/sale-units";
import { formatCurrency, todayLocalISO } from "@/lib/utils";

const CONSUMER = "__consumer__";
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Insumo revendido no atacado — mesmo catálogo de Insumos, sem buquês. */
interface Sellable {
  id: string;
  name: string;
  /** Preço de venda sugerido (por unidade de compra — o maço, quando houver). */
  price: number;
  packSize?: number;
  purchaseUnit?: ProductUnit;
  unit?: ProductUnit;
  imageUrl?: string | null;
}

interface CartItem {
  sellable: Sellable;
  quantity: number;
  /** Preço praticado nesta venda (editável). */
  price: number;
  /** Unidade escolhida (maço/haste) — só para produto de pacote. */
  saleUnit?: ProductUnit;
}

/**
 * Venda no atacado: revenda de insumo em pacote fechado (maço) para outro
 * lojista/florista. Mesmo mecanismo de unidade Maço↔Haste da venda direta
 * (`sale-units.ts`), mas por padrão já sugere a unidade de compra inteira —
 * é o fluxo natural de quem compra o maço e revende o maço.
 */
export function WholesaleSaleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: products, isLoading: loadingProducts } = useProducts({
    pageSize: 200,
    onlyActive: true,
  });
  const { data: customers } = useCustomers({ pageSize: 100, channel: "WHOLESALE" });
  const quickSale = useQuickSale();
  const receive = useReceiveForEvent();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [paid, setPaid] = useState(true);
  // Atacado costuma ser pedido/retirada → por padrão "a entregar".
  const [delivered, setDelivered] = useState(false);
  const [saleDate, setSaleDate] = useState(todayLocalISO);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newProductOpen, setNewProductOpen] = useState(false);

  const reset = () => {
    setSearch("");
    setCart({});
    setCustomerId(undefined);
    setPaid(true);
    setDelivered(false);
    setSaleDate(todayLocalISO());
    setDeliveryDate("");
  };

  // Só insumos marcados "aparece no atacado" e com preço de venda entram aqui.
  const sellables = useMemo<Sellable[]>(
    () =>
      (products?.data ?? [])
        .filter((p) => p.showInWholesale && p.defaultSalePrice > 0)
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: p.defaultSalePrice,
          packSize: p.packSize,
          purchaseUnit: p.purchaseUnit,
          unit: p.unit,
          imageUrl: p.imageUrl,
        })),
    [products],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? sellables.filter((s) => s.name.toLowerCase().includes(term))
      : sellables;
  }, [sellables, search]);

  const cartItems = Object.values(cart);
  const total = round(cartItems.reduce((s, i) => s + i.quantity * i.price, 0));

  const addSellable = (sellable: Sellable) =>
    setCart((c) => {
      if (c[sellable.id]) {
        return {
          ...c,
          [sellable.id]: { ...c[sellable.id], quantity: c[sellable.id].quantity + 1 },
        };
      }
      const saleUnit = defaultSaleUnit(sellable);
      return {
        ...c,
        [sellable.id]: {
          sellable,
          quantity: 1,
          price: suggestedUnitPrice(sellable, saleUnit),
          saleUnit,
        },
      };
    });

  /** Cadastrado na hora, de dentro da venda — já entra direto no carrinho. */
  const addCreatedProduct = (product: Product) =>
    addSellable({
      id: product.id,
      name: product.name,
      price: product.defaultSalePrice,
      packSize: product.packSize,
      purchaseUnit: product.purchaseUnit,
      unit: product.unit,
      imageUrl: product.imageUrl,
    });

  const setPrice = (id: string, price: number) =>
    setCart((c) => (c[id] ? { ...c, [id]: { ...c[id], price } } : c));

  const changeSaleUnit = (id: string, saleUnit: ProductUnit) =>
    setCart((c) =>
      c[id]
        ? {
            ...c,
            [id]: {
              ...c[id],
              saleUnit,
              price: suggestedUnitPrice(c[id].sellable, saleUnit),
            },
          }
        : c,
    );

  const changeQty = (id: string, delta: number) =>
    setCart((c) => {
      const current = c[id];
      if (!current) return c;
      const quantity = current.quantity + delta;
      if (quantity <= 0) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: { ...current, quantity } };
    });

  const canSubmit = cartItems.length > 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      const sale = await quickSale.mutateAsync({
        customerId,
        channel: "WHOLESALE",
        date: saleDate || undefined,
        deliveryDate: deliveryDate || undefined,
        delivered,
        items: cartItems.map((i) => ({
          productId: i.sellable.id,
          quantity: i.quantity,
          saleUnit: i.saleUnit,
          unitSalePrice: i.price,
        })),
      });
      if (paid && total > 0) {
        // Backdata o recebimento para a data da venda (fluxo de caixa correto).
        await receive.mutateAsync({
          eventId: sale.id,
          input: { amount: total, method: "PIX", date: saleDate || undefined },
        });
      }
      toast.success(
        paid ? "Venda registrada e recebida." : "Venda registrada (a prazo).",
        {
          action: {
            label: "Imprimir nota",
            onClick: () => router.push(`/vendas/${sale.id}/imprimir`),
          },
        },
      );
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao vender.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Venda no atacado</DialogTitle>
          <DialogDescription>
            Revenda de insumo em pacote fechado (maço) ou fracionado, para
            outro lojista/florista.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Insumo</Label>
              <button
                type="button"
                onClick={() => setNewProductOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo insumo
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar insumo…"
                className="h-11 lg:h-11 pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[38dvh] space-y-1 overflow-y-auto pr-1 sm:max-h-52">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addSellable(s)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <span className="flex items-center gap-2 truncate text-sm font-medium">
                    {s.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.imageUrl}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded object-cover"
                      />
                    ) : null}
                    {s.name}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(s.price)}
                  </span>
                </button>
              ))}
              {filtered.length === 0 ? (
                loadingProducts ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Carregando…
                  </p>
                ) : sellables.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {(products?.data.length ?? 0) > 0
                        ? "Nenhum insumo marcado para o atacado com preço definido. Marque “Atacado” no cadastro do insumo."
                        : "Você ainda não cadastrou nenhum insumo."}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setNewProductOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Cadastrar insumo
                    </Button>
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nada encontrado.
                  </p>
                )
              ) : null}
            </div>
          </div>

          <div className="flex flex-col rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="h-4 w-4" /> Carrinho
            </div>
            <div className="max-h-[34dvh] flex-1 space-y-2 overflow-y-auto sm:max-h-52">
              {cartItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Toque num item para adicionar.
                </p>
              ) : (
                cartItems.map((item) => {
                  const id = item.sellable.id;
                  return (
                    <div key={id} className="space-y-2 rounded-md bg-background p-2">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {item.sellable.name}
                        </span>
                        <button
                          type="button"
                          aria-label="Menos"
                          className="flex h-9 w-9 items-center justify-center rounded-md border border-border sm:h-7 sm:w-7"
                          onClick={() => changeQty(id, -1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Mais"
                          className="flex h-9 w-9 items-center justify-center rounded-md border border-border sm:h-7 sm:w-7"
                          onClick={() => changeQty(id, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remover"
                          className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-destructive sm:h-7 sm:w-7"
                          onClick={() => changeQty(id, -item.quantity)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {hasUnitChoice(item.sellable) ? (
                        <UnitToggle
                          purchaseUnit={item.sellable.purchaseUnit as ProductUnit}
                          unit={item.sellable.unit as ProductUnit}
                          value={item.saleUnit}
                          onChange={(u) => changeSaleUnit(id, u)}
                        />
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`price-${id}`} className="text-xs text-muted-foreground">
                          Preço{item.saleUnit ? `/${unitLabels[item.saleUnit]}` : ""}
                        </Label>
                        <CurrencyInput
                          id={`price-${id}`}
                          className="h-10 min-w-0 sm:h-8"
                          value={item.price}
                          onChange={(v) => setPrice(id, v)}
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

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <Field label="Data da venda" htmlFor="ws-date">
            <Input
              id="ws-date"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </Field>
          <Field label="Data de entrega (opcional)" htmlFor="ws-delivery">
            <Input
              id="ws-delivery"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={delivered}
            onChange={(e) => setDelivered(e.target.checked)}
          />
          <span className="font-medium">Já entregue</span>
          <span className="text-muted-foreground">
            — marque se o pedido já saiu (senão fica “A entregar”).
          </span>
        </label>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Cliente (opcional)</Label>
              <button
                type="button"
                onClick={() => setNewCustomerOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Novo cliente
              </button>
            </div>
            <Select
              value={customerId ?? CONSUMER}
              onValueChange={(v) => setCustomerId(v === CONSUMER ? undefined : v)}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CONSUMER}>Sem cliente</SelectItem>
                {customers?.data.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              <ModeButton active={paid} onClick={() => setPaid(true)}>
                Já pago
              </ModeButton>
              <ModeButton active={!paid} onClick={() => setPaid(false)}>
                Pagar depois
              </ModeButton>
            </div>
            <p className="text-xs text-muted-foreground">
              {paid
                ? "Recebido agora."
                : "A prazo — fica em contas a receber."}
            </p>
          </div>
        </div>

        {/* sticky sem margem negativa no mesmo elemento — ver quick-sale-dialog.tsx */}
        <div data-kb-hide className="sticky bottom-0 z-10 max-sm:mt-auto">
          <div className="-mx-4 -mb-4 flex items-center gap-3 border-t border-border bg-card px-4 py-3 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:-mb-6 sm:px-6">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="whitespace-nowrap font-serif text-xl font-semibold tabular-nums">
                {formatCurrency(total)}
              </p>
            </div>
            <Button
              className="h-12 lg:h-12 flex-1 text-base"
              disabled={!canSubmit}
              loading={submitting}
              onClick={submit}
            >
              {paid ? "Registrar venda (paga)" : "Registrar venda (a prazo)"}
            </Button>
          </div>
        </div>

        <CustomerDialog
          open={newCustomerOpen}
          onOpenChange={setNewCustomerOpen}
          defaultChannel="WHOLESALE"
          onCreated={(customer: Customer) => setCustomerId(customer.id)}
        />
        <ProductDialog
          open={newProductOpen}
          onOpenChange={setNewProductOpen}
          requireSalePrice
          onCreated={addCreatedProduct}
        />
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
      className={
        active
          ? "h-11 rounded-lg border border-primary bg-primary/10 text-sm font-medium text-primary transition-colors"
          : "h-11 rounded-lg border border-border text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
      }
    >
      {children}
    </button>
  );
}
