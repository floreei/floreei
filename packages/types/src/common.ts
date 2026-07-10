import { z } from "zod";

/** UUID v4 usado como identificador de toda entidade. */
export const idSchema = z.string().uuid();

/** E-mail normalizado (lowercase, trim). */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("E-mail inválido");

/** Só os dígitos de um documento (remove máscara de CPF/CNPJ). */
export function documentDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * CPF (11 dígitos) ou CNPJ (14) — aceita com ou sem máscara, guarda o que veio.
 * Valida pelo comprimento; o dígito verificador fica para depois.
 */
export const documentSchema = z
  .string()
  .trim()
  .refine(
    (v) => [11, 14].includes(documentDigits(v).length),
    "Informe um CNPJ ou CPF válido",
  );

/**
 * Valor monetário em reais. Aceita number ou string numérica e devolve number
 * com no máximo 2 casas. Persistido como `decimal` no banco (nunca float binário).
 */
export const moneySchema = z.coerce
  .number()
  .nonnegative("Valor não pode ser negativo")
  .finite();

/** Quantidade positiva (permite frações, ex.: 1.5 maços). */
export const quantitySchema = z.coerce
  .number()
  .positive("Quantidade deve ser maior que zero")
  .finite();

/** Parâmetros padrão de paginação para listagens. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().trim().optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Data no formato AAAA-MM-DD (usada em filtros de período). */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use AAAA-MM-DD)");

/** Envelope padrão de resposta paginada. */
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Item de linha resumido de um pedido (venda/compra), para nota e WhatsApp. */
export interface ProfileOrderItem {
  name: string;
  quantity: number;
  lineTotal: number;
}

/** Item agregado no perfil (mais vendido/comprado), ranqueado por quantidade. */
export interface ProfileTopItem {
  name: string;
  quantity: number;
  total: number;
}

/** Ponto mensal de faturamento/gasto para o gráfico de colunas do perfil. */
export interface ProfileMonthlyPoint {
  /** Mês no formato "AAAA-MM". */
  month: string;
  total: number;
  /** Nº de pedidos no mês. */
  count: number;
}
