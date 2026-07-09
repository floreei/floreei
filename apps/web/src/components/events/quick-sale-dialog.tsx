"use client";

import type { Customer, ProductUnit } from "@sistema-flores/types";
import { Minus, Plus, Search, ShoppingCart, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { UnitToggle } from "@/components/events/unit-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { useArrangements } from "@/lib/api/arrangements";
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
import { cn, formatCurrency } from "@/lib/utils";

const CONSUMER = "__consumer__";
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Item vendável: um buquê (arranjo) ou um insumo (produto avulso). */
interface Sellable {
  kind: "arrangement" | "product";
  id: string;
  name: string;
  /** Preço de venda sugerido (por unidade de compra, no caso de produto). */
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

const key = (s: Sellable) => `${s.kind}:${s.id}`;

export function QuickSaleDialog({
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
  const { data: arrangements } = useArrangements({
    pageSize: 200,
    onlyActive: true,
  });
  const { data: customers } = useCustomers({ pageSize: 100 });
  const quickSale = useQuickSale();
  const receive = useReceiveForEvent();
  const router = useRouter();

  // Filtro visual do catálogo: buquês, revenda (insumos avulsos) ou valor livre.
  const [mode, setMode] = useState<"buque" | "revenda" | "amount">("buque");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [amount, setAmount] = useState(0);
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [paid, setPaid] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  const reset = () => {
    setMode("buque");
    setSearch("");
    setCart({});
    setAmount(0);
    setTitle("");
    setCustomerId(undefined);
    setPaid(true);
  };

  // Buquês primeiro (venda principal da floricultura), depois insumos avulsos.
  const sellables = useMemo<Sellable[]>(
    () => [
      ...(arrangements?.data ?? []).map((a) => ({
        kind: "arrangement" as const,
        id: a.id,
        name: a.name,
        price: a.salePrice,
      })),
      // Só insumos com preço de venda entram no atacado; os "só buquê"
      // (ex.: urso) ficam de fora — o custo deles vai no preço do buquê.
      ...(products?.data ?? [])
        .filter((p) => p.defaultSalePrice > 0)
        .map((p) => ({
          kind: "product" as const,
          id: p.id,
          name: p.name,
          price: p.defaultSalePrice,
          packSize: p.packSize,
          purchaseUnit: p.purchaseUnit,
          unit: p.unit,
          imageUrl: p.imageUrl,
        })),
    ],
    [arrangements, products],
  );

  const filtered = useMemo(() => {
    const kind = mode === "buque" ? "arrangement" : "product";
    const base = sellables.filter((s) => s.kind === kind);
    const term = search.trim().toLowerCase();
    return term
      ? base.filter((s) => s.name.toLowerCase().includes(term))
      : base;
  }, [sellables, search, mode]);

  const cartItems = Object.values(cart);
  const total =
    mode === "amount"
      ? round(Number(amount) || 0)
      : round(cartItems.reduce((s, i) => s + i.quantity * i.price, 0));

  const addSellable = (sellable: Sellable) =>
    setCart((c) => {
      const k = key(sellable);
      if (c[k]) {
        return { ...c, [k]: { ...c[k], quantity: c[k].quantity + 1 } };
      }
      const saleUnit = defaultSaleUnit(sellable);
      return {
        ...c,
        [k]: {
          sellable,
          quantity: 1,
          price: suggestedUnitPrice(sellable, saleUnit),
          saleUnit,
        },
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
      const current = c[k];
      if (!current) return c;
      const quantity = current.quantity + delta;
      if (quantity <= 0) {
        const { [k]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [k]: { ...current, quantity } };
    });

  const canSubmit = mode === "amount" ? total > 0 : cartItems.length > 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      const input =
        mode === "amount"
          ? { customerId, amount: total, title: title || undefined }
          : {
              customerId,
              items: cartItems.map((i) =>
                i.sellable.kind === "arrangement"
                  ? {
                      arrangementId: i.sellable.id,
                      quantity: i.quantity,
                      unitSalePrice: i.price,
                    }
                  : {
                      productId: i.sellable.id,
                      quantity: i.quantity,
                      saleUnit: i.saleUnit,
                      unitSalePrice: i.price,
                    },
              ),
            };
      const sale = await quickSale.mutateAsync(input);
      if (paid && total > 0) {
        await receive.mutateAsync({
          eventId: sale.id,
          input: { amount: total, method: "PIX" },
        });
      }
      toast.success(
        paid ? "Venda registrada e recebida." : "Venda registrada (a prazo).",
        {
          action: {
            label: "Imprimir nota",
            onClick: () => router.push(`/eventos/${sale.id}/imprimir`),
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
          <DialogTitle className="text-xl">Venda rápida</DialogTitle>
          <DialogDescription>
            Toque nos buquês ou insumos, ou informe um valor. Depois escolha à
            vista ou fiado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          <ModeButton active={mode === "buque"} onClick={() => setMode("buque")}>
            Buquês
          </ModeButton>
          <ModeButton active={mode === "revenda"} onClick={() => setMode("revenda")}>
            Revenda
          </ModeButton>
          <ModeButton active={mode === "amount"} onClick={() => setMode("amount")}>
            Valor livre
          </ModeButton>
        </div>

        {mode !== "amount" ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={mode === "buque" ? "Buscar buquê…" : "Buscar insumo…"}
                  className="h-11 lg:h-11 pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[38dvh] space-y-1 overflow-y-auto pr-1 sm:max-h-52">
                {filtered.map((s) => (
                  <button
                    key={key(s)}
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
                    {loadingProducts
                      ? "Carregando…"
                      : sellables.length === 0
                        ? "Nada cadastrado ainda. Cadastre buquês ou insumos."
                        : "Nada encontrado."}
                  </p>
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
                    const k = key(item.sellable);
                    return (
                      <div key={k} className="space-y-2 rounded-md bg-background p-2">
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {item.sellable.name}
                          </span>
                          <button
                            type="button"
                            aria-label="Menos"
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-border sm:h-7 sm:w-7"
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
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-border sm:h-7 sm:w-7"
                            onClick={() => changeQty(k, 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Remover"
                            className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-destructive sm:h-7 sm:w-7"
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
                          <Label htmlFor={`price-${k}`} className="text-xs text-muted-foreground">
                            Preço{item.saleUnit ? `/${unitLabels[item.saleUnit]}` : ""}
                          </Label>
                          <CurrencyInput
                            id={`price-${k}`}
                            className="h-10 min-w-0 sm:h-8"
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
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="qs-amount" className="flex items-center gap-1">
                Valor da venda
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <CurrencyInput
                id="qs-amount"
                className="h-12 lg:h-12 text-lg"
                value={amount}
                onChange={setAmount}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="qs-title">Descrição (opcional)</Label>
              <Input
                id="qs-title"
                className="h-12"
                placeholder="Buquê pronto"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
        )}

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
                <SelectItem value={CONSUMER}>Consumidor (sem cliente)</SelectItem>
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
                Pagar na entrega
              </ModeButton>
            </div>
            <p className="text-xs text-muted-foreground">
              {paid
                ? "Recebido agora."
                : "A prazo — fica em contas a receber até a entrega."}
            </p>
          </div>
        </div>

        {/* Rodapé sticky COMPACTO (Total + ação numa linha só): o CTA fica
            sempre visível no celular sem esconder o conteúdo acima. */}
        <div data-kb-hide className="sticky bottom-0 z-10 -mx-4 -mb-4 flex items-center gap-3 border-t border-border bg-card px-4 py-3 max-sm:mt-auto max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:-mb-6 sm:px-6">
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

        <CustomerDialog
          open={newCustomerOpen}
          onOpenChange={setNewCustomerOpen}
          onCreated={(customer: Customer) => setCustomerId(customer.id)}
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
      className={cn(
        "h-11 rounded-lg border text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
