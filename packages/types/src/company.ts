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

/**
 * Dados fiscais da empresa — necessários pra emitir nota fiscal (NFC-e/NF-e).
 * Endereço aqui é ESTRUTURADO (o XML da nota exige campos separados),
 * diferente do `address` de texto livre usado no timbrado dos documentos.
 */
export const companyFiscalSettingsSchema = z.object({
  stateRegistration: optional(20), // Inscrição Estadual (ou "ISENTO")
  taxRegime: optional(20), // ex.: "Simples Nacional", "Regime Normal" — texto livre
  addressStreet: optional(160),
  addressNumber: optional(20),
  addressComplement: optional(80),
  addressNeighborhood: optional(80),
  addressCity: optional(80),
  addressState: optional(2), // UF
  addressZip: optional(9),
  cityCode: optional(7), // código IBGE do município, exigido no XML
  /** Emitir a nota automaticamente ao fechar a venda (senão, é manual). */
  invoiceAutoEmit: z.boolean().default(false),
  // ── Padrões fiscais (aplicados a TODAS as notas; o gateway calcula o imposto) ──
  /** Ambiente de emissão: homologação (teste, sem valor fiscal) ou produção. */
  environment: z.enum(["HOMOLOGACAO", "PRODUCAO"]).default("HOMOLOGACAO"),
  naturezaOperacao: optional(60), // ex.: "Venda de mercadoria"
  cfopInState: optional(4), // CFOP dentro do estado (ex.: 5102)
  cfopOutState: optional(4), // CFOP fora do estado (ex.: 6102)
  icmsCsosn: optional(4), // CSOSN (Simples Nacional, ex.: 102)
  icmsCst: optional(3), // CST do ICMS (regime normal, ex.: 00)
  origem: optional(1), // origem da mercadoria (0-8; padrão 0 = nacional)
});
export type CompanyFiscalSettingsInput = z.infer<typeof companyFiscalSettingsSchema>;

export interface CompanyFiscalSettings {
  stateRegistration: string | null;
  taxRegime: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  cityCode: string | null;
  invoiceAutoEmit: boolean;
  environment: "HOMOLOGACAO" | "PRODUCAO";
  naturezaOperacao: string | null;
  cfopInState: string | null;
  cfopOutState: string | null;
  icmsCsosn: string | null;
  icmsCst: string | null;
  origem: string | null;
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
  /** Loja com storefront PRÓPRIO (ex.: Floravie) — ignora o template de cores. */
  custom: boolean;
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
