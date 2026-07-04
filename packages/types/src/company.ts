import { z } from "zod";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

/** Dados cadastrais da empresa (aparecem na nota de orçamento quando preenchidos). */
export const companySettingsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa").max(160),
  document: optional(20), // CNPJ/CPF
  phone: optional(30),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  address: optional(255),
  // Logo em data URL (base64). Até ~1,5 MB.
  logo: z
    .string()
    .max(2_000_000)
    .nullable()
    .optional(),
});
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

export interface CompanySettings {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo: string | null;
}
