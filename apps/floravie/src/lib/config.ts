// Origem dos dados do storefront. Flag ligada (padrão) → catálogo MOCKADO
// (src/lib/products.ts); desligada → consumo da API do Floreei. Assim dá pra
// manter o mock (e as imagens) e alternar sem mexer no front.
export const USE_MOCK =
  (process.env.NEXT_PUBLIC_FLORAVIE_USE_MOCK ?? "true") !== "false";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/** Slug da loja da Floravie no ERP (usado no endpoint público do storefront). */
export const STORE_SLUG =
  process.env.NEXT_PUBLIC_FLORAVIE_STORE_SLUG ?? "floravie";
