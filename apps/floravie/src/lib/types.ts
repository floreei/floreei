// Modelos de dados do storefront (DESIGN-SPEC §6).

/** Categorias de vitrine (casa com storeCategory da API). */
export type StoreCat = "buques" | "arranjos" | "vasos" | "cestas";

/** Rótulos e ordem de exibição das categorias. */
export const CATEGORY_LABELS: Record<StoreCat, string> = {
  buques: "Buquês",
  arranjos: "Arranjos",
  vasos: "Flores em Vaso",
  cestas: "Cestas de Presente",
};
export const CATEGORY_ORDER: StoreCat[] = [
  "buques",
  "arranjos",
  "vasos",
  "cestas",
];

/** Eyebrow (subtítulo curto) de cada categoria, usado nas vitrines. */
export const CATEGORY_EYEBROWS: Record<StoreCat, string> = {
  buques: "Os queridinhos",
  arranjos: "Para decorar e presentear",
  vasos: "Duram muito mais",
  cestas: "Para surpreender",
};

export type ProductSize = { l: string; d: number };

export type Product = {
  id: string;
  cat: StoreCat;
  name: string;
  price: number;
  img: string;
  badge: string | null;
  /** Nota média (0–5) — renderizada como estrelas fracionadas. */
  rating: number;
  reviews: number;
  desc: string;
  sizes: ProductSize[];
};

/** Avaliação pública de um produto (espelha StoreReview da API). */
export type Review = {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

/** Dados de contato/branding da loja vindos da API (identidade visual fixa). */
export type Branding = {
  name: string;
  whatsapp: string | null;
};

export type CartItem = { id: string; sizeIdx: number; qty: number };

export type PaymentMethod = "pix" | "cartao";
export type DeliveryWhen = "hoje" | "amanha" | "agendar";
export type DeliveryPeriod = "manha" | "tarde";

export type Order = {
  dest: string;
  fone: string;
  end: string;
  cidade: string;
  data: DeliveryWhen;
  dataAg?: string;
  periodo: DeliveryPeriod;
  msg: string;
  de: string;
  anon: boolean;
  pay: PaymentMethod;
  cardNum?: string;
  cardNome?: string;
  cardVal?: string;
  cardCvv?: string;
};
