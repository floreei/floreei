"use client";

import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Branding, Product } from "@/lib/types";
import { CartDrawer } from "./cart-drawer";
import { CheckoutModal } from "./checkout-modal";
import { ProductModal } from "./product-modal";
import { ProductsProvider } from "./products-provider";
import { ReviewsModal } from "./reviews-modal";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { StoreProvider } from "./store-provider";
import { WhatsAppFloat } from "./whatsapp-float";

/**
 * Casca comum das páginas do storefront: providers (catálogo + carrinho),
 * header, footer, WhatsApp, overlays (produto, avaliações, sacola, checkout) e
 * toast. O conteúdo específico de cada página entra como `children`.
 */
export function StoreShell({
  initialProducts,
  branding,
  children,
}: {
  initialProducts: Product[];
  branding: Branding | null;
  children: ReactNode;
}) {
  const [toastMsg, setToastMsg] = useState("Adicionado à sacola 🌷");
  const [toastShow, setToastShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastShow(false), 2200);
  }, []);

  return (
    <ProductsProvider initialProducts={initialProducts}>
      <StoreProvider onToast={showToast}>
        <SiteHeader />
        {children}
        <SiteFooter whatsapp={branding?.whatsapp ?? null} />
        <WhatsAppFloat whatsapp={branding?.whatsapp ?? null} />

        {/* Overlays */}
        <ProductModal />
        <ReviewsModal />
        <CartDrawer />
        <CheckoutModal />

        {/* Toast */}
        <div className={`toast${toastShow ? " show" : ""}`}>{toastMsg}</div>
      </StoreProvider>
    </ProductsProvider>
  );
}
