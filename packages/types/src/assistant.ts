import { z } from "zod";
import {
  dateStringSchema,
  idSchema,
  moneySchema,
  quantitySchema,
} from "./common";
import { productUnitSchema } from "./enums";

/**
 * Assistente de IA (v1 — compras). O histórico da conversa é agnóstico de
 * provedor: o cliente guarda `AiMessage[]` e reenvia a cada turno (backend
 * stateless). A IA nunca grava direto — ela devolve um `AssistantDraft` que o
 * usuário aprova antes de o backend executar.
 */

// ── Conversa (formato normalizado, agnóstico de provedor) ──────────────────

export const aiToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Argumentos da ferramenta (JSON já parseado). */
  input: z.unknown(),
});
export type AiToolCall = z.infer<typeof aiToolCallSchema>;

export const aiToolResultSchema = z.object({
  toolCallId: z.string(),
  content: z.string(),
});

export const aiMessageSchema = z.object({
  role: z.enum(["user", "assistant", "tool"]),
  /** Texto (user/assistant). */
  text: z.string().optional(),
  /** Chamadas de ferramenta pedidas pelo assistant. */
  toolCalls: z.array(aiToolCallSchema).optional(),
  /** Resultados das ferramentas (role "tool"). */
  toolResults: z.array(aiToolResultSchema).optional(),
});
export type AiMessage = z.infer<typeof aiMessageSchema>;

export const assistantChatRequestSchema = z.object({
  messages: z.array(aiMessageSchema).max(60),
});
export type AssistantChatRequest = z.infer<typeof assistantChatRequestSchema>;

// ── Rascunho de ação (proposta que o usuário aprova) ───────────────────────

export const CREATE_PURCHASE = "CREATE_PURCHASE";
export const EDIT_PURCHASE = "EDIT_PURCHASE";

/** Fornecedor novo (mínimo) que o assistente sugere cadastrar. */
export const assistantNewSupplierSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(160),
  city: z.string().trim().max(120).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  pixKey: z.string().trim().max(140).optional(),
});
export type AssistantNewSupplier = z.infer<typeof assistantNewSupplierSchema>;

/** Produto novo (mínimo) que o assistente sugere cadastrar. */
export const assistantNewProductSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(160),
  unit: productUnitSchema.default("UNIDADE"),
});
export type AssistantNewProduct = z.infer<typeof assistantNewProductSchema>;

/** Item da compra: produto existente, produto novo (índice) ou só descrição. */
export const assistantPurchaseItemSchema = z.object({
  productId: idSchema.nullable().optional(),
  /** Índice em `newProducts` quando o item é um produto a ser criado. */
  newProductRef: z.number().int().min(0).nullable().optional(),
  description: z.string().trim().min(1, "Descreva o item").max(200),
  quantity: quantitySchema,
  unit: productUnitSchema.default("UNIDADE"),
  unitPrice: moneySchema.default(0),
});
export type AssistantPurchaseItem = z.infer<typeof assistantPurchaseItemSchema>;

export const createPurchaseDraftSchema = z.object({
  kind: z.literal(CREATE_PURCHASE),
  /** Fornecedor existente (id) OU novo (`newSupplier`). */
  supplierId: idSchema.nullable().optional(),
  newSupplier: assistantNewSupplierSchema.nullable().optional(),
  /** Nome do fornecedor só para exibição no resumo. */
  supplierName: z.string().trim().min(1).max(160),
  newProducts: z.array(assistantNewProductSchema).default([]),
  items: z.array(assistantPurchaseItemSchema).min(1, "Adicione ao menos um item"),
  /** Já entregue → entra no estoque na hora (RECEIVED); senão é um pedido. */
  delivered: z.boolean().default(false),
  date: dateStringSchema,
  deliveryDate: dateStringSchema.optional(),
  freight: moneySchema.default(0),
  notes: z.string().trim().max(2000).optional(),
});
export type CreatePurchaseDraft = z.infer<typeof createPurchaseDraftSchema>;

export const editPurchaseDraftSchema = z.object({
  kind: z.literal(EDIT_PURCHASE),
  purchaseId: idSchema,
  /** Rótulo da compra para exibição ("Compra de X em dd/mm"). */
  purchaseLabel: z.string().trim().min(1).max(200),
  changes: z
    .object({
      /** true = marcar como entregue (receber); false = desfazer entrega. */
      delivered: z.boolean().optional(),
      date: dateStringSchema.optional(),
      deliveryDate: dateStringSchema.optional(),
      notes: z.string().trim().max(2000).optional(),
    })
    .refine((c) => Object.keys(c).length > 0, {
      message: "Informe ao menos uma mudança",
    }),
});
export type EditPurchaseDraft = z.infer<typeof editPurchaseDraftSchema>;

export const assistantDraftSchema = z.discriminatedUnion("kind", [
  createPurchaseDraftSchema,
  editPurchaseDraftSchema,
]);
export type AssistantDraft = z.infer<typeof assistantDraftSchema>;

// ── Respostas do backend ───────────────────────────────────────────────────

export interface AssistantChatResponse {
  /** Histórico atualizado — o cliente guarda e reenvia no próximo turno. */
  messages: AiMessage[];
  /** Texto do assistente para exibir (quando aguarda o usuário). */
  reply?: string;
  /** Proposta pronta para aprovação (abre o modal de resumo). */
  draft?: AssistantDraft;
}

export interface AssistantExecuteResult {
  purchaseId: string;
  /** Link para a compra criada/editada (ex.: "/compras/abc"). */
  href: string;
  created: { supplier: boolean; products: number };
  message: string;
}
