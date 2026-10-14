import { z } from "zod";
import { idSchema } from "./common";

/**
 * Um passo da régua de cobrança: quantos dias em relação ao vencimento dispara
 * o lembrete. Negativo = antes do vencimento, 0 = no dia, positivo = depois.
 */
export const dunningStepSchema = z.object({
  offsetDays: z.number().int().min(-90).max(365),
  enabled: z.boolean().default(true),
});
export type DunningStep = z.infer<typeof dunningStepSchema>;

/** Como o cliente paga: chave PIX (texto), link do Mercado Pago, ou nada. */
export const dunningPaymentMethodSchema = z.enum(["PIX", "MP_LINK", "NONE"]);
export type DunningPaymentMethod = z.infer<typeof dunningPaymentMethodSchema>;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

/** Passos padrão: 3 dias antes, no vencimento, 3 e 7 dias depois. */
export const DEFAULT_DUNNING_STEPS: DunningStep[] = [
  { offsetDays: -3, enabled: true },
  { offsetDays: 0, enabled: true },
  { offsetDays: 3, enabled: true },
  { offsetDays: 7, enabled: true },
];

export const dunningSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  steps: z.array(dunningStepSchema).max(10).default(DEFAULT_DUNNING_STEPS),
  paymentMethod: dunningPaymentMethodSchema.default("NONE"),
  pixKey: optionalText(200),
  mpLink: optionalText(500),
  /** Linha extra opcional do lojista (ex.: "Qualquer dúvida, me chama!"). */
  extraLine: optionalText(300),
});
export type DunningSettingsInput = z.infer<typeof dunningSettingsSchema>;

export interface DunningSettings {
  enabled: boolean;
  steps: DunningStep[];
  paymentMethod: DunningPaymentMethod;
  pixKey: string | null;
  mpLink: string | null;
  extraLine: string | null;
}

/**
 * Cobrança de uma venda montada para envio MANUAL: o lojista baixa a nota em
 * PDF (gerada no navegador a partir de `document`) e cola a mensagem no
 * WhatsApp. `message` é o texto completo da régua (compat); o front monta a
 * saudação curta por conta própria.
 */
export interface CobrancaMessage {
  /** Telefone do cliente (só dígitos, com DDI) ou null se não houver. */
  phone: string | null;
  message: string;
  /** Link da página pública da cobrança (fatura salvável em PDF). */
  link: string;
  /** Dados da nota, os mesmos da página pública, para gerar o PDF. */
  document: CobrancaDocument;
}

/** Lote de vendas para exportar as notas de cobrança (só as em aberto saem). */
export const exportCobrancasSchema = z.object({
  eventIds: z.array(idSchema).min(1).max(200),
});
export type ExportCobrancasInput = z.infer<typeof exportCobrancasSchema>;

/** Nota de cobrança de uma venda + identificação, para gerar o PDF no front. */
export interface CobrancaDocument extends PublicCobranca {
  eventId: string;
  /** Link da página pública da cobrança. */
  link: string;
}

/** Resposta da exportação em lote: uma nota por venda em aberto encontrada. */
export interface CobrancaDocuments {
  documents: CobrancaDocument[];
}

/** Uma linha de item na página pública da cobrança. */
export interface PublicCobrancaItem {
  description: string;
  quantity: number;
  /** Unidade do item (chave do enum Unit) — o front resolve o rótulo. */
  unit: string;
  unitSalePrice: number;
  lineTotal: number;
}

/**
 * Dados públicos de uma cobrança — o que a página `/c/[id]` mostra ao cliente.
 * Nenhum dado sensível (custo, lucro, telefone) é exposto.
 */
export interface PublicCobranca {
  /** Referência curta e legível da venda (ex.: "A1B2C3D4"). */
  reference: string;
  company: {
    name: string;
    document: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    logo: string | null;
  };
  customerName: string;
  /** Data da venda (ISO). */
  date: string;
  /** Vencimento do saldo (ISO) ou null. */
  dueDate: string | null;
  soldValue: number;
  receivedValue: number;
  /** Saldo em aberto (soldValue - receivedValue). */
  amountDue: number;
  title: string;
  items: PublicCobrancaItem[];
  notes: string | null;
  /** Chave PIX para o QR (config da régua ou, na falta, a da empresa). */
  pixKey: string | null;
  /** Link de pagamento do Mercado Pago, quando configurado na régua. */
  mpLink: string | null;
}

export type DunningStatus = "SENT" | "FAILED" | "SKIPPED";

/** Um envio (ou tentativa) registrado, para dedupe e histórico. */
export interface DunningLogEntry {
  id: string;
  eventId: string | null;
  customerName: string | null;
  /** offsetDays do passo que gerou o envio. */
  step: number;
  status: DunningStatus;
  channel: string;
  message: string;
  sentAt: string;
  error: string | null;
}
