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
} as const;
export const quoteStatusSchema = z.enum([
  QuoteStatus.DRAFT,
  QuoteStatus.SENT,
  QuoteStatus.APPROVED,
  QuoteStatus.REJECTED,
  QuoteStatus.EXPIRED,
]);
export type QuoteStatus = z.infer<typeof quoteStatusSchema>;

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
