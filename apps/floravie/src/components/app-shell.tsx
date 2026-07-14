"use client";

import { useCallback, useRef, useState } from "react";
import { About } from "./about";
import { Benefits } from "./benefits";
import { CartDrawer } from "./cart-drawer";
import { CheckoutModal } from "./checkout-modal";
import { Cities } from "./cities";
import { Hero } from "./hero";
import { Newsletter } from "./newsletter";
import { Occasions } from "./occasions";
import { ProductModal } from "./product-modal";
import { ProductRail } from "./product-rail";
import { ProductsProvider } from "./products-provider";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { StoreProvider } from "./store-provider";
import { WhatsAppFloat } from "./whatsapp-float";
import type { Branding, Product } from "@/lib/types";

export function AppShell({
  initialProducts,
  branding,
}: {
  initialProducts: Product[];
  branding: Branding | null;
}) {
  const hasProducts = initialProducts.length > 0;
  const [toastMsg, setToastMsg] = useState("Adicionado à sacola 🌷");
  const [toastShow, setToastShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Equivale a toast(msg) da referência: mostra a pílula e some após 2,2s.
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
      <Hero />
      <Benefits />
      {hasProducts ? (
        <ProductRail
          id="buques"
          eyebrow="Os queridinhos"
          title="Buquês do Ateliê"
          cat="buques"
        />
      ) : (
        <section className="block" id="buques">
          <div className="wrap">
            <div className="catalog-empty">
              <h2>Nossa vitrine está sendo preparada 🌷</h2>
              <p>Em breve, buquês e arranjos fresquinhos aqui. Volte logo!</p>
            </div>
          </div>
        </section>
      )}
      <Occasions />
      {hasProducts && (
        <ProductRail
          id="cestas"
          eyebrow="Para a casa e para presentear"
          title="Arranjos, Vasos & Cestas"
          cat="cestas"
        />
      )}
      <About />
      <Cities />
      <Newsletter />
      <SiteFooter whatsapp={branding?.whatsapp ?? null} />
      <WhatsAppFloat whatsapp={branding?.whatsapp ?? null} />

      {/* Overlays */}
      <ProductModal />
      <CartDrawer />
      <CheckoutModal />

      {/* Toast */}
      <div className={`toast${toastShow ? " show" : ""}`}>{toastMsg}</div>
    </StoreProvider>
    </ProductsProvider>
  );
}
