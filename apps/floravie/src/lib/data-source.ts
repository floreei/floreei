import { API_URL, brandingTag, catalogTag, STORE_SLUG, USE_MOCK } from "./config";
import { PRODUCTS } from "./products";
import { CATEGORY_ORDER, type Branding, type Product, type StoreCat } from "./types";

/** storeCategory (string livre da API) → categoria conhecida do front. */
function toCat(sc: string | null): StoreCat {
  return (CATEGORY_ORDER as string[]).includes(sc ?? "")
    ? (sc as StoreCat)
    : "buques";
}

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

export function toProduct(item: ApiCatalogItem): Product {
  return {
    id: item.id,
    cat: toCat(item.storeCategory),
    name: item.name,
    price: item.price,
    // Sem imagem → string vazia; o FallbackImage mostra o degradê + flor SVG.
    img: item.imageUrl ?? "",
    badge: item.badge,
    rating: item.rating,
    reviews: item.reviews,
    desc: item.description ?? "",
    sizes:
      item.sizes.length > 0
        ? item.sizes.map((s) => ({ l: s.label, d: s.priceDelta }))
        : [{ l: "Padrão", d: 0 }],
  };
}

/**
 * Busca o catálogo da API do Floreei com **cache de longa duração** (Next Data
 * Cache): `revalidate: false` mantém o resultado cacheado indefinidamente e a
 * `tag` permite purga on-demand quando o painel altera algo (o backend chama
 * `/api/revalidate`). **Chamar apenas no servidor** (ex.: `app/page.tsx`) — as
 * opções `next` só valem em fetch de servidor.
 */
export async function fetchCatalogProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/store/${STORE_SLUG}/catalog`, {
    next: { revalidate: false, tags: [catalogTag(STORE_SLUG)] },
  });
  if (!res.ok) {
    throw new Error(`Falha ao carregar o catálogo (${res.status}).`);
  }
  const data = (await res.json()) as ApiCatalog;
  return data.categories.flatMap((c) => c.items.map(toProduct));
}

interface ApiBranding {
  name: string;
  whatsapp: string | null;
}

/**
 * Branding público da loja (nome/contato), com o mesmo cache longo + tag do
 * catálogo. A identidade visual da Floravie permanece fixa — usamos daqui só os
 * dados de contato (WhatsApp) e o nome. Chamar apenas no servidor.
 */
export async function fetchBranding(): Promise<Branding | null> {
  const res = await fetch(`${API_URL}/store/${STORE_SLUG}`, {
    next: { revalidate: false, tags: [brandingTag(STORE_SLUG)] },
  });
  if (!res.ok) return null;
  const b = (await res.json()) as ApiBranding;
  return { name: b.name, whatsapp: b.whatsapp };
}

/**
 * Fonte única para as páginas do storefront (home e catálogo). Com USE_MOCK usa
 * o catálogo local; caso contrário busca catálogo + branding da API (cacheados
 * por tag). Degrada para lista vazia se a API falhar. Chamar só no servidor.
 */
export async function loadStorefrontData(): Promise<{
  products: Product[];
  branding: Branding | null;
}> {
  if (USE_MOCK) return { products: PRODUCTS, branding: null };
  try {
    const [products, branding] = await Promise.all([
      fetchCatalogProducts(),
      fetchBranding(),
    ]);
    return { products, branding };
  } catch {
    return { products: [], branding: null };
  }
}
