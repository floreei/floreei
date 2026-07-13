import { z } from "zod";
import type {
  ProfileMonthlyPoint,
  ProfileOrderItem,
  ProfileTopItem,
} from "./common";
import { idSchema, paginationQuerySchema } from "./common";
import { salesChannelSchema, type SalesChannel } from "./enums";

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
  /** Venda direta (varejo) ou atacado — só aparece no seletor do canal correspondente. */
  channel: salesChannelSchema.default("RETAIL"),
  // ── Endereço fiscal ESTRUTURADO (destinatário da NF-e; a NFC-e dispensa) ──
  stateRegistration: optionalText(20), // Inscrição Estadual (ou "ISENTO")
  addressStreet: optionalText(160),
  addressNumber: optionalText(20),
  addressComplement: optionalText(80),
  addressNeighborhood: optionalText(80),
  addressCity: optionalText(80),
  addressState: optionalText(2), // UF
  addressZip: optionalText(9),
  cityCode: optionalText(7), // código IBGE do município, exigido no XML da NF-e
});
export type CustomerInput = z.infer<typeof customerInputSchema>;

/** Filtros de listagem de clientes. */
export const customerQuerySchema = paginationQuerySchema.extend({
  channel: salesChannelSchema.optional(),
});
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
  channel: SalesChannel;
  stateRegistration: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  cityCode: string | null;
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
  items: ProfileOrderItem[];
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
  /** Itens mais vendidos ao cliente, ranqueados por quantidade. */
  topItems: ProfileTopItem[];
  /** Faturamento por mês (últimos 12 meses) para o gráfico de colunas. */
  monthly: ProfileMonthlyPoint[];
  /** Mês de maior faturamento entre os últimos 12; null se não houve vendas. */
  bestMonth: ProfileMonthlyPoint | null;
}
