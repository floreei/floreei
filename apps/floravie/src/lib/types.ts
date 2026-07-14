// Modelos de dados do storefront (DESIGN-SPEC §6).

export type ProductSize = { l: string; d: number };

export type Product = {
  id: string;
  cat: "buques" | "cestas";
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
