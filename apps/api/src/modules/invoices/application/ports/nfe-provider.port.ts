import type { InvoiceDocumentType, InvoiceStatus } from "@sistema-flores/types";

/** Dados fiscais de quem emite (a floricultura) — vêm de CompanyEntity. */
export interface NfeIssuerData {
  companyId: string;
  name: string;
  document: string | null;
  stateRegistration: string | null;
  taxRegime: string | null;
  address: {
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    cityCode: string | null;
  };
}

/** Dados de quem recebe a nota. null = consumidor não identificado (comum em NFC-e). */
export interface NfeRecipientData {
  name: string;
  document: string | null;
  email: string | null;
  address: string | null;
}

export interface NfeItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  /** Código fiscal do produto — o provedor real usa isso pra calcular imposto. */
  ncm: string | null;
}

export interface NfeEmissionRequest {
  documentType: InvoiceDocumentType;
  issuer: NfeIssuerData;
  recipient: NfeRecipientData | null;
  items: NfeItemData[];
  totalValue: number;
}

export interface NfeEmissionResult {
  status: Extract<InvoiceStatus, "PROCESSING" | "AUTHORIZED" | "REJECTED">;
  providerInvoiceId?: string | null;
  accessKey?: string | null;
  protocol?: string | null;
  number?: number | null;
  series?: string | null;
  xmlUrl?: string | null;
  danfeUrl?: string | null;
  rejectionReason?: string | null;
  raw?: unknown;
}

export interface NfeCancelResult {
  status: Extract<InvoiceStatus, "CANCELED" | "REJECTED">;
  cancelReason?: string | null;
  raw?: unknown;
}

export interface NfeStatusResult {
  status: InvoiceStatus;
  accessKey?: string | null;
  protocol?: string | null;
  xmlUrl?: string | null;
  danfeUrl?: string | null;
  rejectionReason?: string | null;
}

/**
 * Interface pluginável de emissão fiscal. Enquanto nenhum provedor real
 * (Focus NFe, PlugNotas etc.) estiver contratado, `StubNfeProvider` é a
 * implementação injetada (ver invoices.module.ts) — trocar pelo provedor
 * real é trocar essa única linha de DI, sem tocar em service/controller.
 */
export interface NfeProviderPort {
  emit(request: NfeEmissionRequest): Promise<NfeEmissionResult>;
  cancel(providerInvoiceId: string, reason: string): Promise<NfeCancelResult>;
  checkStatus(providerInvoiceId: string): Promise<NfeStatusResult>;
}

export const NFE_PROVIDER = Symbol("NFE_PROVIDER");
