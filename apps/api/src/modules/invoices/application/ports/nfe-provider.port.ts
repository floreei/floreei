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

/** Endereço estruturado do destinatário — exigido no XML da NF-e a CNPJ. */
export interface NfeAddressData {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  cityCode: string | null;
  state: string | null;
  zip: string | null;
}

/** Dados de quem recebe a nota. null = consumidor não identificado (comum em NFC-e). */
export interface NfeRecipientData {
  name: string;
  document: string | null;
  /** CPF | CNPJ inferido pelo tamanho do documento; null quando sem documento. */
  documentType: "CPF" | "CNPJ" | null;
  stateRegistration: string | null;
  email: string | null;
  address: NfeAddressData | null;
}

export interface NfeItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  /** Código fiscal do produto — o provedor real usa isso pra calcular imposto. */
  ncm: string | null;
}

/**
 * Padrões fiscais da empresa aplicados a TODAS as linhas — o gateway calcula o
 * imposto a partir daqui + do NCM de cada item (granularidade por-empresa no v1).
 */
export interface NfeFiscalDefaults {
  environment: "HOMOLOGACAO" | "PRODUCAO";
  naturezaOperacao: string | null;
  cfopInState: string | null;
  cfopOutState: string | null;
  icmsCsosn: string | null;
  icmsCst: string | null;
  origem: string | null;
}

export interface NfeEmissionRequest {
  /** Referência única da nota (id do InvoiceEntity) — idempotência no gateway. */
  ref: string;
  documentType: InvoiceDocumentType;
  issuer: NfeIssuerData;
  recipient: NfeRecipientData | null;
  fiscalDefaults: NfeFiscalDefaults;
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
  /** Nome curto persistido em `invoice.provider` (ex.: "STUB", "FOCUS"). */
  readonly name: string;
  emit(request: NfeEmissionRequest): Promise<NfeEmissionResult>;
  /** `ref` é a referência da nota (id do InvoiceEntity), não o número da SEFAZ. */
  cancel(ref: string, reason: string): Promise<NfeCancelResult>;
  checkStatus(ref: string): Promise<NfeStatusResult>;
}

export const NFE_PROVIDER = Symbol("NFE_PROVIDER");
