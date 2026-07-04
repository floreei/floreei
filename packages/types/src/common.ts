import { z } from "zod";

/** UUID v4 usado como identificador de toda entidade. */
export const idSchema = z.string().uuid();

/** E-mail normalizado (lowercase, trim). */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("E-mail inválido");

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
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Envelope padrão de resposta paginada. */
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
