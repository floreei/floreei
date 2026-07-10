import { z } from "zod";

/** Papéis de acesso (RBAC básico — Fase 1). */
export const Role = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
} as const;
export const roleSchema = z.enum([Role.ADMIN, Role.OPERATOR]);
export type Role = z.infer<typeof roleSchema>;

/** Unidade de medida de um produto do catálogo (compra ou consumo). */
export const ProductUnit = {
  UNIDADE: "UNIDADE",
  MACO: "MACO",
  HASTE: "HASTE",
  VASO: "VASO",
  CAIXA: "CAIXA",
  METRO: "METRO",
  GRAMA: "GRAMA",
  PACOTE: "PACOTE",
} as const;
export const productUnitSchema = z.enum([
  ProductUnit.UNIDADE,
  ProductUnit.MACO,
  ProductUnit.HASTE,
  ProductUnit.VASO,
  ProductUnit.CAIXA,
  ProductUnit.METRO,
  ProductUnit.GRAMA,
  ProductUnit.PACOTE,
]);
export type ProductUnit = z.infer<typeof productUnitSchema>;

/**
 * Unidades medidas por grandeza contínua — aceitam fração (ex.: 2,5 m de fita,
 * 250 g de granel). As demais são contáveis: a quantidade deve ser inteira.
 */
export const FRACTIONAL_UNITS: readonly ProductUnit[] = ["METRO", "GRAMA"];

/** A unidade aceita quantidade fracionada? (Metro/Grama sim; as contáveis não.) */
export function isFractionalUnit(unit: ProductUnit): boolean {
  return FRACTIONAL_UNITS.includes(unit);
}

/**
 * Valida a quantidade conforme a unidade: inteira para unidades contáveis,
 * decimal para Metro/Grama. Retorna `null` se válida, ou a mensagem de erro.
 */
export function invalidQuantityForUnit(
  quantity: number,
  unit: ProductUnit,
): string | null {
  if (!(quantity > 0)) return "Quantidade deve ser maior que zero";
  if (!isFractionalUnit(unit) && !Number.isInteger(quantity)) {
    return "Quantidade deve ser um número inteiro";
  }
  return null;
}

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

/**
 * Canal de venda: direta (varejo/cliente final) ou atacado (revenda em pacote
 * fechado). Compartilhado entre Venda e Cliente — um cliente de atacado só
 * aparece nas vendas no atacado, e vice-versa.
 */
export const SalesChannel = {
  RETAIL: "RETAIL",
  WHOLESALE: "WHOLESALE",
} as const;
export const salesChannelSchema = z.enum([
  SalesChannel.RETAIL,
  SalesChannel.WHOLESALE,
]);
export type SalesChannel = z.infer<typeof salesChannelSchema>;

/** Tipo de documento fiscal: derivado do canal da venda (RETAIL → NFC-e, WHOLESALE → NF-e). */
export const InvoiceDocumentType = {
  NFCE: "NFCE",
  NFE: "NFE",
} as const;
export const invoiceDocumentTypeSchema = z.enum([
  InvoiceDocumentType.NFCE,
  InvoiceDocumentType.NFE,
]);
export type InvoiceDocumentType = z.infer<typeof invoiceDocumentTypeSchema>;

/** Ciclo de vida de uma nota fiscal emitida (ou tentada) para uma venda. */
export const InvoiceStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  AUTHORIZED: "AUTHORIZED",
  REJECTED: "REJECTED",
  CANCELED: "CANCELED",
} as const;
export const invoiceStatusSchema = z.enum([
  InvoiceStatus.PENDING,
  InvoiceStatus.PROCESSING,
  InvoiceStatus.AUTHORIZED,
  InvoiceStatus.REJECTED,
  InvoiceStatus.CANCELED,
]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

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
