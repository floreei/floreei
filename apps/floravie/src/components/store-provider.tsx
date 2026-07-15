"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { API_URL, STORE_SLUG, USE_MOCK } from "@/lib/config";
import { FRETE, FRETE_GRATIS } from "@/lib/constants";
import type { CartItem, Order } from "@/lib/types";
import { useProductLookup } from "./products-provider";

type PdSel = { id: string | null; sizeIdx: number; qty: number };

const emptyOrder: Order = {
  dest: "",
  fone: "",
  end: "",
  cidade: "Recife",
  data: "hoje",
  periodo: "tarde",
  msg: "",
  de: "",
  anon: false,
  pay: "pix",
  cardNum: "",
  cardNome: "",
  cardVal: "",
  cardCvv: "",
};

type StoreContextValue = {
  cart: CartItem[];
  cartQty: number;
  subtotal: number;
  frete: number;
  total: number; // total considerando desconto Pix (order.pay)
  // Modal de produto
  productOpen: boolean;
  pdSel: PdSel;
  openProduct: (id: string) => void;
  closeProduct: () => void;
  // Modal de avaliações (abre por cima do modal de produto)
  reviewsOpen: boolean;
  openReviews: () => void;
  closeReviews: () => void;
  setSize: (i: number) => void;
  setQty: (d: number) => void;
  addToCart: () => void;
  quickAdd: (id: string) => void;
  // Sacola
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  chQty: (i: number, d: number) => void;
  removeItem: (i: number) => void;
  clearCart: () => void;
  // Checkout
  checkoutOpen: boolean;
  coStep: number;
  order: Order;
  setOrder: (patch: Partial<Order>) => void;
  setCoStep: (n: number) => void;
  openCheckout: () => void;
  startCheckout: () => void;
  closeCheckout: () => void;
  successNum: string | null;
  confirmOrder: () => void;
  // helpers de preço
  itemPrice: (c: CartItem) => number;
  // Toast
  showToast: (msg: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de <StoreProvider>");
  return ctx;
}

export function StoreProvider({
  children,
  onToast,
}: {
  children: ReactNode;
  onToast: (msg: string) => void;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pdSel, setPdSel] = useState<PdSel>({ id: null, sizeIdx: 0, qty: 1 });
  const [productOpen, setProductOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [coStep, setCoStep] = useState(1);
  const [order, setOrderState] = useState<Order>(emptyOrder);
  const [successNum, setSuccessNum] = useState<string | null>(null);

  const productById = useProductLookup();

  // Preço unitário (base + delta do tamanho selecionado).
  const itemPrice = useCallback(
    (c: CartItem) => {
      const p = productById(c.id);
      if (!p) return 0;
      return p.price + p.sizes[c.sizeIdx].d;
    },
    [productById],
  );

  const subtotal = useMemo(
    () => cart.reduce((s, c) => s + itemPrice(c) * c.qty, 0),
    [cart, itemPrice],
  );
  const frete = useMemo(
    () => (cart.length === 0 ? 0 : subtotal >= FRETE_GRATIS ? 0 : FRETE),
    [cart.length, subtotal],
  );
  const total = useMemo(() => {
    const s = subtotal + frete;
    return order.pay === "pix" ? s * 0.95 : s;
  }, [subtotal, frete, order.pay]);
  const cartQty = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);

  // ── Produto ──
  const openProduct = useCallback((id: string) => {
    setPdSel({ id, sizeIdx: 0, qty: 1 });
    setProductOpen(true);
  }, []);
  const closeProduct = useCallback(() => setProductOpen(false), []);
  const openReviews = useCallback(() => setReviewsOpen(true), []);
  const closeReviews = useCallback(() => setReviewsOpen(false), []);
  const setSize = useCallback((i: number) => setPdSel((s) => ({ ...s, sizeIdx: i })), []);
  const setQty = useCallback(
    (d: number) => setPdSel((s) => ({ ...s, qty: Math.max(1, Math.min(9, s.qty + d)) })),
    [],
  );

  const mergeInto = useCallback((sel: PdSel) => {
    if (!sel.id) return;
    setCart((prev) => {
      const found = prev.find((c) => c.id === sel.id && c.sizeIdx === sel.sizeIdx);
      if (found) {
        return prev.map((c) =>
          c === found ? { ...c, qty: Math.min(9, c.qty + sel.qty) } : c,
        );
      }
      return [...prev, { id: sel.id!, sizeIdx: sel.sizeIdx, qty: sel.qty }];
    });
  }, []);

  const addToCart = useCallback(() => {
    mergeInto(pdSel);
    onToast("Adicionado à sacola 🌷");
  }, [mergeInto, pdSel, onToast]);

  const quickAdd = useCallback(
    (id: string) => {
      mergeInto({ id, sizeIdx: 0, qty: 1 });
      onToast("Adicionado à sacola 🌷");
      setCartOpen(true);
    },
    [mergeInto, onToast],
  );

  // ── Sacola ──
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const chQty = useCallback((i: number, d: number) => {
    setCart((prev) =>
      prev.map((c, idx) =>
        idx === i ? { ...c, qty: Math.max(1, Math.min(9, c.qty + d)) } : c,
      ),
    );
  }, []);
  const removeItem = useCallback((i: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== i));
  }, []);
  const clearCart = useCallback(() => setCart([]), []);

  // ── Checkout ──
  const setOrder = useCallback((patch: Partial<Order>) => {
    setOrderState((o) => ({ ...o, ...patch }));
  }, []);
  // Abre o checkout de fato (sem checar sacola). Usado quando já sabemos que há
  // itens — ex.: logo após "Comprar agora" adicionar um item (o estado do carrinho
  // ainda não re-renderizou neste mesmo handler, então o guard leria valor antigo).
  const startCheckout = useCallback(() => {
    setCoStep(1);
    setSuccessNum(null);
    setCheckoutOpen(true);
  }, []);
  const openCheckout = useCallback(() => {
    if (cart.length === 0) {
      onToast("Sua sacola está vazia 🌸");
      return;
    }
    startCheckout();
  }, [cart.length, onToast, startCheckout]);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);
  const confirmOrder = useCallback(async () => {
    // Modo mock: mantém a tela de sucesso local do protótipo (sem API/pagamento).
    if (USE_MOCK) {
      setSuccessNum("FLV-" + Math.floor(1000 + Math.random() * 9000));
      return;
    }
    // Modo real: cria o pedido no ERP e redireciona ao Mercado Pago. Os campos de
    // entrega/mensagem/remetente que o schema do checkout não tem vão em `notes`.
    const dataTxt =
      order.data === "hoje"
        ? "Hoje"
        : order.data === "amanha"
          ? "Amanhã"
          : order.dataAg || "Agendar";
    const notes = [
      `Entrega: ${dataTxt}`,
      `Período: ${order.periodo === "manha" ? "Manhã (8h–12h)" : "Tarde (13h–18h)"}`,
      order.msg ? `Mensagem do cartão: "${order.msg}"` : "",
      order.anon
        ? "Enviar como admirador(a) secreto(a)"
        : order.de
          ? `De: ${order.de}`
          : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const payload = {
      customer: {
        name: order.dest,
        phone: order.fone,
        address: `${order.end}, ${order.cidade}`,
      },
      notes,
      items: cart.map((c) => ({
        arrangementId: c.id,
        quantity: c.qty,
        sizeIndex: c.sizeIdx,
      })),
    };
    try {
      const res = await fetch(`${API_URL}/store/${STORE_SLUG}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        onToast("Não foi possível finalizar o pedido. Tente novamente. 🌸");
        return;
      }
      const data = (await res.json()) as { paymentUrl?: string };
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      onToast("Pagamento indisponível no momento. 🌸");
    } catch {
      onToast("Falha de conexão ao finalizar. Tente novamente. 🌸");
    }
  }, [order, cart, onToast]);

  // ── Toast (expõe para componentes que não usam onToast direto) ──
  const showToast = useCallback((msg: string) => onToast(msg), [onToast]);

  // ── Scroll lock do body (equivale ao body.locked da referência) ──
  const anyOverlayOpen =
    productOpen || reviewsOpen || cartOpen || checkoutOpen;
  useEffect(() => {
    document.body.classList.toggle("locked", anyOverlayOpen);
    return () => {
      document.body.classList.remove("locked");
    };
  }, [anyOverlayOpen]);

  // ── Fechar com Esc (produto, checkout, sacola) ──
  const latest = useRef({
    reviewsOpen,
    closeProduct,
    closeReviews,
    closeCheckout,
    closeCart,
  });
  latest.current = {
    reviewsOpen,
    closeProduct,
    closeReviews,
    closeCheckout,
    closeCart,
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Esc fecha primeiro o modal de avaliações (que fica por cima).
        if (latest.current.reviewsOpen) {
          latest.current.closeReviews();
          return;
        }
        latest.current.closeProduct();
        latest.current.closeCheckout();
        latest.current.closeCart();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const value: StoreContextValue = {
    cart,
    cartQty,
    subtotal,
    frete,
    total,
    productOpen,
    pdSel,
    openProduct,
    closeProduct,
    reviewsOpen,
    openReviews,
    closeReviews,
    setSize,
    setQty,
    addToCart,
    quickAdd,
    cartOpen,
    openCart,
    closeCart,
    chQty,
    removeItem,
    clearCart,
    checkoutOpen,
    coStep,
    order,
    setOrder,
    setCoStep,
    openCheckout,
    startCheckout,
    closeCheckout,
    successNum,
    confirmOrder,
    itemPrice,
    showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
