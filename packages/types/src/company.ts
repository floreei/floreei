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
  /** Chave Pix (CPF/CNPJ, e-mail, telefone ou aleatória) — QR code na nota. */
  pixKey: optional(140),
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
  pixKey: string | null;
  logo: string | null;
}

/** Cor no formato hex #RRGGBB. */
const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor no formato #RRGGBB");

/** Endereço da loja (subdomínio): letras minúsculas, números e hífen. */
export const storeSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Mínimo de 3 caracteres")
  .max(40, "Máximo de 40 caracteres")
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "Use apenas letras minúsculas, números e hífen",
  );

/** Configurações da loja online (storefront) por empresa. */
export const storeSettingsSchema = z.object({
  slug: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    storeSlugSchema.nullable().optional(),
  ),
  enabled: z.boolean().default(false),
  primaryColor: hexColor.default("#2F6050"),
  accentColor: hexColor.default("#C6795B"),
  headline: optional(120),
  description: optional(400),
  mercadoPagoPublicKey: optional(200),
  // Write-only: só atualiza o token se vier preenchido; nunca é retornado.
  mercadoPagoAccessToken: optional(400),
});
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

export interface StoreSettings {
  slug: string | null;
  enabled: boolean;
  primaryColor: string;
  accentColor: string;
  headline: string | null;
  description: string | null;
  mercadoPagoPublicKey: string | null;
  /** true se o access token do Mercado Pago está configurado (nunca expõe o token). */
  mercadoPagoConnected: boolean;
}

/** Dados públicos da vitrine (o que a loja mostra ao consumidor). */
export interface StoreBranding {
  slug: string;
  name: string;
  logo: string | null;
  primaryColor: string;
  accentColor: string;
  headline: string | null;
  description: string | null;
  /** Telefone/WhatsApp de contato da loja (para o CTA de atendimento). */
  whatsapp: string | null;
  /** Public key do Mercado Pago (pode ir ao browser). */
  mercadoPagoPublicKey: string | null;
}
