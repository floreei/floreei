"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { Product } from "@/lib/types";

type ProductsContextValue = {
  products: Product[];
  productById: (id: string) => Product | undefined;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

function useProductsContext() {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error("useProducts deve ser usado dentro de <ProductsProvider>");
  }
  return ctx;
}

/** Lista de produtos (vinda do servidor: mock ou catálogo cacheado da API). */
export function useProducts(): Product[] {
  return useProductsContext().products;
}

/** Função de lookup por id — segura para usar dentro de loops de render. */
export function useProductLookup(): (id: string) => Product | undefined {
  return useProductsContext().productById;
}

/**
 * Recebe os produtos já resolvidos no **servidor** (`app/page.tsx`) e os expõe
 * pelo contexto. Não faz fetch no cliente — assim o catálogo é buscado uma vez,
 * no servidor, com cache de longa duração + invalidação por tag (não bate no
 * banco a cada visita). O front (rails, modal, sacola, checkout) não muda.
 */
export function ProductsProvider({
  children,
  initialProducts,
}: {
  children: ReactNode;
  initialProducts: Product[];
}) {
  const productById = useCallback(
    (id: string) => initialProducts.find((p) => p.id === id),
    [initialProducts],
  );

  const value = useMemo(
    () => ({ products: initialProducts, productById }),
    [initialProducts, productById],
  );

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}
