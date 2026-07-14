import { z } from "zod";
import { idSchema, paginationQuerySchema } from "./common";

/** APPROVED = visível na loja; HIDDEN = ocultada pela moderação (não sai). */
export const reviewStatusSchema = z.enum(["APPROVED", "HIDDEN"]);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

/** CUSTOMER = enviada por um cliente; SEED = semeada (credibilidade inicial). */
export const reviewSourceSchema = z.enum(["CUSTOMER", "SEED"]);
export type ReviewSource = z.infer<typeof reviewSourceSchema>;

/** Envio público de avaliação (storefront) para um buquê. */
export const storeReviewInputSchema = z.object({
  authorName: z.string().trim().min(2, "Informe seu nome").max(80),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type StoreReviewInput = z.infer<typeof storeReviewInputSchema>;

/** Avaliação pública (o que a loja mostra ao consumidor). */
export interface StoreReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** Avaliação no backoffice (moderação) — inclui estado e origem. */
export interface Review {
  id: string;
  companyId: string;
  arrangementId: string;
  arrangementName: string | null;
  authorName: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  source: ReviewSource;
  createdAt: string;
}

/** Filtros da lista de avaliações no backoffice. */
export const reviewQuerySchema = paginationQuerySchema.extend({
  arrangementId: idSchema.optional(),
  status: reviewStatusSchema.optional(),
});
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;

/** Moderação: alterna o estado (ocultar/reexibir) de uma avaliação. */
export const reviewModerationSchema = z.object({
  status: reviewStatusSchema,
});
export type ReviewModerationInput = z.infer<typeof reviewModerationSchema>;
