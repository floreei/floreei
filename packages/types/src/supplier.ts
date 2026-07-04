import { z } from "zod";
import { paginationQuerySchema } from "./common";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

/** Dados para criar/editar um fornecedor. */
export const supplierInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(160),
  city: optional(120),
  contact: optional(120),
  whatsapp: optional(30),
  paymentTerms: optional(160),
  notes: optional(2000),
});
export type SupplierInput = z.infer<typeof supplierInputSchema>;

export const supplierQuerySchema = paginationQuerySchema;
export type SupplierQuery = z.infer<typeof supplierQuerySchema>;

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  city: string | null;
  contact: string | null;
  whatsapp: string | null;
  paymentTerms: string | null;
  notes: string | null;
  /** Total já comprado deste fornecedor (quando solicitado). */
  totalPurchased?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProfileStats {
  purchasesCount: number;
  totalPurchased: number;
  totalPaid: number;
  balanceDue: number;
}

export interface SupplierPurchaseSummary {
  id: string;
  date: string;
  status: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
}

export interface SupplierProfile {
  supplier: Supplier;
  stats: SupplierProfileStats;
  purchases: SupplierPurchaseSummary[];
}
