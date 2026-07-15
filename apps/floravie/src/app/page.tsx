import { HomeView } from "@/components/home-view";
import { StoreShell } from "@/components/store-shell";
import { loadStorefrontData } from "@/lib/data-source";

// Server Component: resolve catálogo + branding no servidor (mock ou API
// cacheada por tag) e monta a home dentro da casca do storefront.
export default async function HomePage() {
  const { products, branding } = await loadStorefrontData();
  return (
    <StoreShell initialProducts={products} branding={branding}>
      <HomeView />
    </StoreShell>
  );
}
