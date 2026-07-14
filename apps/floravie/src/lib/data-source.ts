import { API_URL, STORE_SLUG, USE_MOCK } from "./config";
import { PRODUCTS } from "./products";
import type { Product } from "./types";

/** Forma (parcial) do catálogo público da API do Floreei — tipada localmente
 * para não acoplar a Floravie ao pacote de tipos do ERP. */
interface ApiCatalogItem {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  description: string | null;
  badge: string | null;
  storeCategory: string | null;
  sizes: { label: string; priceDelta: number }[];
  rating: number;
  reviews: number;
}
interface ApiCatalog {
  categories: { id: string | null; name: string; items: ApiCatalogItem[] }[];
}

/** Nota (0–5) → estrelas cheias, no mesmo formato de string usado pelo front. */
function toStars(rating: number): string {
  const full = Math.round(rating);
  return "★★★★★".slice(0, full);
}

function toProduct(item: ApiCatalogItem): Product {
  return {
    id: item.id,
    cat: item.storeCategory === "cestas" ? "cestas" : "buques",
    name: item.name,
    price: item.price,
    img: item.imageUrl ?? "/images/placeholder.jpg",
    badge: item.badge,
    rating: toStars(item.rating),
    reviews: item.reviews,
    desc: item.description ?? "",
    sizes:
      item.sizes.length > 0
        ? item.sizes.map((s) => ({ l: s.label, d: s.priceDelta }))
        : [{ l: "Padrão", d: 0 }],
  };
}

/**
 * Fonte única do catálogo. Com a flag ligada devolve o mock (imediato); com ela
 * desligada busca o catálogo da API e mapeia para o shape `Product` do front,
 * que permanece inalterado.
 */
export async function loadProducts(): Promise<Product[]> {
  if (USE_MOCK) return PRODUCTS;
  const res = await fetch(`${API_URL}/store/${STORE_SLUG}/catalog`);
  if (!res.ok) {
    throw new Error(`Falha ao carregar o catálogo (${res.status}).`);
  }
  const data = (await res.json()) as ApiCatalog;
  return data.categories.flatMap((c) => c.items.map(toProduct));
}
