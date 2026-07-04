import { z } from "zod";

/** Papéis de acesso (RBAC básico — Fase 1). */
export const Role = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
} as const;
export const roleSchema = z.enum([Role.ADMIN, Role.OPERATOR]);
export type Role = z.infer<typeof roleSchema>;

/** Unidade de medida de um produto do catálogo. */
export const ProductUnit = {
  UNIDADE: "UNIDADE",
  MACO: "MACO",
  HASTE: "HASTE",
  VASO: "VASO",
  CAIXA: "CAIXA",
} as const;
export const productUnitSchema = z.enum([
  ProductUnit.UNIDADE,
  ProductUnit.MACO,
  ProductUnit.HASTE,
  ProductUnit.VASO,
  ProductUnit.CAIXA,
]);
export type ProductUnit = z.infer<typeof productUnitSchema>;

/** Ciclo de vida de um orçamento. */
export const QuoteStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  CANCELED: "CANCELED",
} as const;
export const quoteStatusSchema = z.enum([
  QuoteStatus.DRAFT,
  QuoteStatus.SENT,
  QuoteStatus.APPROVED,
  QuoteStatus.REJECTED,
  QuoteStatus.EXPIRED,
  QuoteStatus.CANCELED,
]);
export type QuoteStatus = z.infer<typeof quoteStatusSchema>;

/** Ciclo de vida de uma compra a fornecedor. */
export const PurchaseStatus = {
  ORDERED: "ORDERED",
  RECEIVED: "RECEIVED",
  CANCELED: "CANCELED",
} as const;
export const purchaseStatusSchema = z.enum([
  PurchaseStatus.ORDERED,
  PurchaseStatus.RECEIVED,
  PurchaseStatus.CANCELED,
]);
export type PurchaseStatus = z.infer<typeof purchaseStatusSchema>;

/** Direção de um lançamento financeiro. */
export const PaymentDirection = {
  IN: "IN", // recebimento de cliente (evento)
  OUT: "OUT", // pagamento a fornecedor (compra)
} as const;
export const paymentDirectionSchema = z.enum([
  PaymentDirection.IN,
  PaymentDirection.OUT,
]);
export type PaymentDirection = z.infer<typeof paymentDirectionSchema>;

/** Forma de pagamento. */
export const PaymentMethod = {
  PIX: "PIX",
  CASH: "CASH",
  CARD: "CARD",
  TRANSFER: "TRANSFER",
  BOLETO: "BOLETO",
  OTHER: "OTHER",
} as const;
export const paymentMethodSchema = z.enum([
  PaymentMethod.PIX,
  PaymentMethod.CASH,
  PaymentMethod.CARD,
  PaymentMethod.TRANSFER,
  PaymentMethod.BOLETO,
  PaymentMethod.OTHER,
]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

/** Tipo de movimentação de estoque. */
export const StockMovementType = {
  ENTRADA: "ENTRADA", // entrada (compra/ajuste positivo)
  SAIDA: "SAIDA", // saída (uso em evento/venda)
  PERDA: "PERDA", // perda, quebra, vencimento
  AJUSTE: "AJUSTE", // ajuste de inventário (entrada)
} as const;
export const stockMovementTypeSchema = z.enum([
  StockMovementType.ENTRADA,
  StockMovementType.SAIDA,
  StockMovementType.PERDA,
  StockMovementType.AJUSTE,
]);
export type StockMovementType = z.infer<typeof stockMovementTypeSchema>;

/** Sinal de cada tipo de movimentação sobre o saldo. */
export const stockMovementSign: Record<StockMovementType, 1 | -1> = {
  ENTRADA: 1,
  AJUSTE: 1,
  SAIDA: -1,
  PERDA: -1,
};

/** Origem de uma movimentação de estoque. */
export const StockSource = {
  PURCHASE: "PURCHASE",
  EVENT: "EVENT",
  MANUAL: "MANUAL",
} as const;
export const stockSourceSchema = z.enum([
  StockSource.PURCHASE,
  StockSource.EVENT,
  StockSource.MANUAL,
]);
export type StockSource = z.infer<typeof stockSourceSchema>;

/** Tipo de venda: pedido de balcão/entrega ou evento de decoração. */
export const EventType = {
  ORDER: "ORDER", // pedido / venda de balcão / entrega
  EVENT: "EVENT", // evento de decoração
} as const;
export const eventTypeSchema = z.enum([EventType.ORDER, EventType.EVENT]);
export type EventType = z.infer<typeof eventTypeSchema>;

/** Ciclo de vida de um evento (venda confirmada). */
export const EventStatus = {
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELED: "CANCELED",
} as const;
export const eventStatusSchema = z.enum([
  EventStatus.CONFIRMED,
  EventStatus.IN_PROGRESS,
  EventStatus.DONE,
  EventStatus.CANCELED,
]);
export type EventStatus = z.infer<typeof eventStatusSchema>;
