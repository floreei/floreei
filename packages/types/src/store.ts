import { z } from "zod";
import { dateStringSchema, idSchema, paginationQuerySchema } from "./common";

/** Item da vitrine (público). */
export interface StoreCatalogItem {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
}

/** Categoria com seus itens publicados. */
export interface StoreCatalogCategory {
  id: string | null;
  name: string;
  items: StoreCatalogItem[];
}

/** Catálogo completo da loja (branding + itens por categoria). */
export interface StoreCatalog {
  categories: StoreCatalogCategory[];
}

/** Item enviado no checkout (o preço é sempre recalculado no servidor). */
export const storeCheckoutItemSchema = z.object({
  arrangementId: idSchema,
  quantity: z.coerce.number().int().positive().max(99),
});

/** Dados do checkout: cliente + itens do carrinho. */
export const storeCheckoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, "Informe seu nome").max(160),
    phone: z.string().trim().min(8, "Informe um telefone").max(30),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("E-mail inválido")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    address: z.string().trim().max(255).optional(),
  }),
  notes: z.string().trim().max(500).optional(),
  items: z.array(storeCheckoutItemSchema).min(1, "Carrinho vazio"),
});
export type StoreCheckoutInput = z.infer<typeof storeCheckoutSchema>;

/** Resposta do checkout: pedido criado + link de pagamento do Mercado Pago. */
export interface StoreCheckoutResult {
  orderId: string;
  paymentUrl: string;
}

export const STORE_ORDER_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  CANCELED: "CANCELED",
  FAILED: "FAILED",
} as const;
export type StoreOrderStatus =
  (typeof STORE_ORDER_STATUS)[keyof typeof STORE_ORDER_STATUS];

export const storeOrderStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "CANCELED",
  "FAILED",
]);

/** Filtros da lista de pedidos da loja (backoffice). */
export const storeOrderQuerySchema = paginationQuerySchema.extend({
  status: storeOrderStatusSchema.optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
});
export type StoreOrderQuery = z.infer<typeof storeOrderQuerySchema>;

/** Item do pedido (snapshot no momento da compra). */
export interface StoreOrderItem {
  arrangementId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/** Pedido da loja, como aparece no ERP (backoffice). */
export interface StoreOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  items: StoreOrderItem[];
  total: number;
  status: StoreOrderStatus;
  /** Venda gerada no ERP quando o pagamento é aprovado. */
  eventId: string | null;
  createdAt: string;
}
