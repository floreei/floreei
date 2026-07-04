import { z } from "zod";
import { idSchema, paginationQuerySchema } from "./common";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

/** Dados para criar/editar um cliente. */
export const customerInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(160),
  phone: optionalText(30),
  whatsapp: optionalText(30),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  document: optionalText(20),
  address: optionalText(255),
  notes: optionalText(2000),
});
export type CustomerInput = z.infer<typeof customerInputSchema>;

/** Filtros de listagem de clientes. */
export const customerQuerySchema = paginationQuerySchema;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;

/** Representação de um cliente devolvida pela API. */
export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  document: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const customerIdSchema = idSchema;

export interface CustomerProfileStats {
  eventsCount: number;
  totalSold: number;
  totalReceived: number;
  balanceDue: number;
}

export interface CustomerEventSummary {
  id: string;
  title: string;
  date: string;
  status: string;
  soldValue: number;
  receivedValue: number;
}

export interface CustomerQuoteSummary {
  id: string;
  number: number;
  status: string;
  totalSale: number;
  createdAt: string;
}

export interface CustomerProfile {
  customer: Customer;
  stats: CustomerProfileStats;
  events: CustomerEventSummary[];
  quotes: CustomerQuoteSummary[];
}
