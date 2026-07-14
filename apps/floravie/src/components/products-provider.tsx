"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { USE_MOCK } from "@/lib/config";
import { loadProducts } from "@/lib/data-source";
import { PRODUCTS } from "@/lib/products";
import type { Product } from "@/lib/types";

type ProductsContextValue = {
  products: Product[];
  loading: boolean;
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

/** Lista de produtos (mock ou API, conforme a flag). */
export function useProducts(): Product[] {
  return useProductsContext().products;
}

/** Função de lookup por id — segura para usar dentro de loops de render. */
export function useProductLookup(): (id: string) => Product | undefined {
  return useProductsContext().productById;
}

/**
 * Carrega o catálogo uma vez e o expõe pelo contexto no shape `Product`. Com a
 * flag ligada é síncrono (mock, sem flicker); desligada, busca a API no mount.
 * O front (rails, modal, sacola, checkout) não muda — só troca a origem.
 */
export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(
    USE_MOCK ? PRODUCTS : [],
  );
  const [loading, setLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) return;
    let active = true;
    loadProducts()
      .then((p) => {
        if (active) setProducts(p);
      })
      .catch(() => {
        // Sem catálogo da API, mantém a lista vazia; o front degrada sem quebrar.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const productById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  );

  const value = useMemo(
    () => ({ products, loading, productById }),
    [products, loading, productById],
  );

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}
