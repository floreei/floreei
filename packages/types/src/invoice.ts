import { z } from "zod";
import type { InvoiceDocumentType, InvoiceStatus } from "./enums";

/**
 * Nota fiscal emitida (ou tentada) para uma venda. Uma venda pode ter várias
 * (histórico de tentativas/reemissões) — este é o registro individual.
 * Campos do provedor (chave de acesso, protocolo, XML/DANFE) são nullable
 * porque, sem um provedor real configurado, nunca são preenchidos.
 */
export interface Invoice {
  id: string;
  companyId: string;
  eventId: string;
  documentType: InvoiceDocumentType;
  status: InvoiceStatus;
  provider: string;
  providerInvoiceId: string | null;
  accessKey: string | null;
  protocol: string | null;
  number: number | null;
  series: string | null;
  issueDate: string | null;
  xmlUrl: string | null;
  danfeUrl: string | null;
  rejectionReason: string | null;
  cancelReason: string | null;
  canceledAt: string | null;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const invoiceCancelSchema = z.object({
  reason: z.string().trim().min(3, "Informe o motivo do cancelamento").max(500),
});
export type InvoiceCancelInput = z.infer<typeof invoiceCancelSchema>;
