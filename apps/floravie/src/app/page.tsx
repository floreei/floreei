import { AppShell } from "@/components/app-shell";
import { USE_MOCK } from "@/lib/config";
import { fetchBranding, fetchCatalogProducts } from "@/lib/data-source";
import { PRODUCTS } from "@/lib/products";
import type { Branding, Product } from "@/lib/types";

// Server Component: resolve catálogo + branding no servidor. Com USE_MOCK (padrão)
// usa o mock local; caso contrário busca a API com cache de longa duração + tag
// (o fetch cacheado torna a página cacheável — a purga vem por /api/revalidate).
export default async function HomePage() {
  let products: Product[] = PRODUCTS;
  let branding: Branding | null = null;
  if (!USE_MOCK) {
    try {
      [products, branding] = await Promise.all([
        fetchCatalogProducts(),
        fetchBranding(),
      ]);
    } catch {
      // Sem catálogo da API, degrada para lista vazia sem quebrar a página.
      products = [];
    }
  }
  return <AppShell initialProducts={products} branding={branding} />;
}
