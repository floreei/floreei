"use client";

import type { Customer, Product } from "@sistema-flores/types";
import { Minus, Plus, Search, ShoppingCart, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CustomerDialog } from "@/components/customers/customer-dialog";
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
import { useProducts } from "@/lib/api/catalog";
import { useCustomers } from "@/lib/api/customers";
import { useQuickSale } from "@/lib/api/events";
import { useReceiveForEvent } from "@/lib/api/finance";
import { cn, formatCurrency } from "@/lib/utils";

const CONSUMER = "__consumer__";
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

interface CartItem {
  product: Product;
  quantity: number;
  /** Preço de venda deste item nesta venda (editável; começa no padrão). */
  price: number;
}

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
  const { data: customers } = useCustomers({ pageSize: 100 });
  const quickSale = useQuickSale();
  const receive = useReceiveForEvent();

  const [mode, setMode] = useState<"products" | "amount">("products");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [amount, setAmount] = useState(0);
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [paid, setPaid] = useState(true); // já pago por padrão
  const [submitting, setSubmitting] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  const reset = () => {
    setMode("products");
    setSearch("");
    setCart({});
    setAmount(0);
    setTitle("");
    setCustomerId(undefined);
    setPaid(true);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = products?.data ?? [];
    return term
      ? list.filter((p) => p.name.toLowerCase().includes(term))
      : list;
  }, [products, search]);

  const cartItems = Object.values(cart);
  const total =
    mode === "amount"
      ? round(Number(amount) || 0)
      : round(cartItems.reduce((s, i) => s + i.quantity * i.price, 0));

  const addProduct = (product: Product) =>
    setCart((c) => ({
      ...c,
      [product.id]: {
        product,
        quantity: (c[product.id]?.quantity ?? 0) + 1,
        price: c[product.id]?.price ?? product.defaultSalePrice,
      },
    }));

  const setPrice = (id: string, price: number) =>
    setCart((c) => (c[id] ? { ...c, [id]: { ...c[id], price } } : c));

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

  const canSubmit = mode === "amount" ? total > 0 : cartItems.length > 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      const input =
        mode === "amount"
          ? { customerId, amount: total, title: title || undefined }
          : {
              customerId,
              items: cartItems.map((i) => ({
                productId: i.product.id,
                quantity: i.quantity,
                unitSalePrice: i.price,
              })),
            };
      const sale = await quickSale.mutateAsync(input);
      if (paid && total > 0) {
        await receive.mutateAsync({
          eventId: sale.id,
          input: { amount: total, method: "PIX" },
        });
      }
      toast.success(
        paid
          ? "Venda registrada e recebida."
          : "Venda registrada (a prazo).",
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
            Toque nos produtos ou informe um valor. Depois escolha à vista ou fiado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <ModeButton active={mode === "products"} onClick={() => setMode("products")}>
            Produtos
          </ModeButton>
          <ModeButton active={mode === "amount"} onClick={() => setMode("amount")}>
            Valor livre
          </ModeButton>
        </div>

        {mode === "products" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar flor…"
                  className="h-11 pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
                {filtered.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {formatCurrency(product.defaultSalePrice)}
                    </span>
                  </button>
                ))}
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {loadingProducts
                      ? "Carregando produtos…"
                      : (products?.data.length ?? 0) === 0
                        ? "Nenhum produto no catálogo. Cadastre em Catálogo."
                        : "Nenhuma flor encontrada."}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col rounded-lg border border-border bg-muted/30 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <ShoppingCart className="h-4 w-4" /> Carrinho
              </div>
              <div className="max-h-52 flex-1 space-y-2 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Toque num produto para adicionar.
                  </p>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="space-y-2 rounded-md bg-background p-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1 truncate text-sm font-medium">
                          {item.product.name}
                        </span>
                        <button
                          type="button"
                          aria-label="Menos"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border"
                          onClick={() => changeQty(item.product.id, -1)}
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
                          onClick={() => changeQty(item.product.id, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remover"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => changeQty(item.product.id, -item.quantity)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`price-${item.product.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          Preço
                        </Label>
                        <CurrencyInput
                          id={`price-${item.product.id}`}
                          className="h-8"
                          value={item.price}
                          onChange={(v) => setPrice(item.product.id, v)}
                        />
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatCurrency(round(item.quantity * item.price))}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="qs-amount" className="flex items-center gap-1">
                Valor da venda
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <CurrencyInput
                id="qs-amount"
                className="h-12 text-lg"
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

        <div className="grid gap-4 sm:grid-cols-2">
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

        <div className="space-y-3 border-t border-border pt-3">
          <div className="flex items-center justify-between rounded-xl bg-primary/[0.06] px-4 py-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-serif text-2xl font-semibold tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>

          <Button
            className="h-12 w-full text-base"
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
