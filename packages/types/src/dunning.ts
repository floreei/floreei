import { z } from "zod";

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
