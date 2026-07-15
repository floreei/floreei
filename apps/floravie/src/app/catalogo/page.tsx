import { Suspense } from "react";
import { CatalogView } from "@/components/catalog-view";
import { StoreShell } from "@/components/store-shell";
import { loadStorefrontData } from "@/lib/data-source";

export const metadata = {
  title: "Catálogo — Floravie Ateliê",
  description: "Buquês, arranjos, flores em vaso e cestas de presente.",
};

// Página de catálogo: mesmos dados (cacheados) da home, mas com grid paginado
// + filtros (categoria, preço, ordenação) e busca. useSearchParams exige
// Suspense na renderização estática.
export default async function CatalogPage() {
  const { products, branding } = await loadStorefrontData();
  return (
    <StoreShell initialProducts={products} branding={branding}>
      <Suspense fallback={null}>
        <CatalogView />
      </Suspense>
    </StoreShell>
  );
}
