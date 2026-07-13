import { z } from "zod";
import {
  dateStringSchema,
  idSchema,
  moneySchema,
  quantitySchema,
} from "./common";
import { productUnitSchema, salesChannelSchema } from "./enums";

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
  /** Conversa em andamento (para persistir o histórico); ausente = nova. */
  conversationId: idSchema.nullable().optional(),
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

// ── Venda (venda direta ou atacado) ───────────────────────────────────────

export const CREATE_SALE = "CREATE_SALE";
export const CREATE_SALES_BATCH = "CREATE_SALES_BATCH";

/** Cliente novo (mínimo) que o assistente sugere cadastrar na venda. */
export const assistantNewCustomerSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(160),
  whatsapp: z.string().trim().max(30).optional(),
});
export type AssistantNewCustomer = z.infer<typeof assistantNewCustomerSchema>;

/** Item de venda: produto/buquê existente, produto novo (índice) ou descrição. */
export const assistantSaleItemSchema = z.object({
  productId: idSchema.nullable().optional(),
  arrangementId: idSchema.nullable().optional(),
  /** Índice em `newProducts` quando o item é um produto a ser criado. */
  newProductRef: z.number().int().min(0).nullable().optional(),
  description: z.string().trim().min(1, "Descreva o item").max(200),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  unit: productUnitSchema.optional(),
  unitSalePrice: moneySchema.default(0),
});
export type AssistantSaleItem = z.infer<typeof assistantSaleItemSchema>;

/** Campos de uma venda (compartilhados entre venda única e lote). */
const saleFields = {
  channel: salesChannelSchema.default("RETAIL"),
  /** Cliente existente (id) ou novo (`newCustomer`); nenhum = consumidor. */
  customerId: idSchema.nullable().optional(),
  newCustomer: assistantNewCustomerSchema.nullable().optional(),
  customerName: z.string().trim().min(1).max(160),
  /** Valor livre (com título) OU itens. */
  amount: moneySchema.optional(),
  title: z.string().trim().max(180).optional(),
  newProducts: z.array(assistantNewProductSchema).default([]),
  items: z.array(assistantSaleItemSchema).optional(),
  /** Recebido agora (à vista) ou a prazo (fica em contas a receber). */
  paid: z.boolean().default(false),
  /** Já entregue (balcão) ou a entregar. */
  delivered: z.boolean().default(false),
  /** Data da venda (padrão: hoje, resolvido na execução). */
  date: dateStringSchema.optional(),
  /** Entrega prevista (ex.: "levar na sexta"). */
  deliveryDate: dateStringSchema.optional(),
  /** Vencimento (só quando a prazo) — referência da cobrança. */
  dueDate: dateStringSchema.optional(),
};

/** Uma venda dentro de um lote (sem `kind`). */
export const batchSaleSchema = z.object(saleFields);
export type BatchSale = z.infer<typeof batchSaleSchema>;

// Sem .refine no topo: a união discriminada exige ZodObject puro. A regra
// "valor OU itens" é validada na execução.
export const createSaleDraftSchema = z.object({
  kind: z.literal(CREATE_SALE),
  ...saleFields,
});
export type CreateSaleDraft = z.infer<typeof createSaleDraftSchema>;

/** Registro de VÁRIAS vendas de uma vez (uma por cliente). */
export const createSalesBatchDraftSchema = z.object({
  kind: z.literal(CREATE_SALES_BATCH),
  sales: z.array(batchSaleSchema).min(1, "Adicione ao menos uma venda").max(40),
});
export type CreateSalesBatchDraft = z.infer<typeof createSalesBatchDraftSchema>;

// ── Cadastros e ajustes simples ────────────────────────────────────────────

export const CREATE_CUSTOMER = "CREATE_CUSTOMER";
export const CREATE_PRODUCT = "CREATE_PRODUCT";
export const CREATE_ARRANGEMENT = "CREATE_ARRANGEMENT";
export const ADJUST_STOCK = "ADJUST_STOCK";
export const CREATE_EXPENSE = "CREATE_EXPENSE";
export const REGISTER_PAYMENT = "REGISTER_PAYMENT";

export const createCustomerDraftSchema = z.object({
  kind: z.literal(CREATE_CUSTOMER),
  name: z.string().trim().min(2, "Informe o nome").max(160),
  whatsapp: z.string().trim().max(30).optional(),
  phone: z.string().trim().max(30).optional(),
  channel: salesChannelSchema.default("RETAIL"),
});
export type CreateCustomerDraft = z.infer<typeof createCustomerDraftSchema>;

export const createProductDraftSchema = z.object({
  kind: z.literal(CREATE_PRODUCT),
  name: z.string().trim().min(2, "Informe o nome").max(160),
  unit: productUnitSchema.default("UNIDADE"),
  defaultSalePrice: moneySchema.default(0),
  defaultPurchasePrice: moneySchema.default(0),
});
export type CreateProductDraft = z.infer<typeof createProductDraftSchema>;

export const createArrangementDraftSchema = z.object({
  kind: z.literal(CREATE_ARRANGEMENT),
  name: z.string().trim().min(2, "Informe o nome").max(160),
  salePrice: moneySchema.default(0),
});
export type CreateArrangementDraft = z.infer<typeof createArrangementDraftSchema>;

export const adjustStockDraftSchema = z.object({
  kind: z.literal(ADJUST_STOCK),
  productId: idSchema,
  productName: z.string().trim().min(1).max(200),
  unit: z.string().optional(),
  /** Novo saldo ABSOLUTO em estoque (a IA consulta o atual e soma/subtrai). */
  newBalance: z.coerce.number().min(0),
  notes: z.string().trim().max(500).optional(),
});
export type AdjustStockDraft = z.infer<typeof adjustStockDraftSchema>;

export const createExpenseDraftSchema = z.object({
  kind: z.literal(CREATE_EXPENSE),
  description: z.string().trim().min(2, "Descreva a despesa").max(160),
  costCenter: z.string().trim().min(1).max(80).default("Geral"),
  amount: moneySchema,
  dueDate: dateStringSchema,
  notes: z.string().trim().max(500).optional(),
});
export type CreateExpenseDraft = z.infer<typeof createExpenseDraftSchema>;

export const registerPaymentDraftSchema = z.object({
  kind: z.literal(REGISTER_PAYMENT),
  /** EVENT = recebimento de cliente; PURCHASE = pagamento a fornecedor. */
  target: z.enum(["EVENT", "PURCHASE"]),
  targetId: idSchema,
  label: z.string().trim().min(1).max(200),
  amount: moneySchema,
  method: z.string().optional(),
  date: dateStringSchema,
});
export type RegisterPaymentDraft = z.infer<typeof registerPaymentDraftSchema>;

export const assistantDraftSchema = z.discriminatedUnion("kind", [
  createPurchaseDraftSchema,
  editPurchaseDraftSchema,
  createSaleDraftSchema,
  createSalesBatchDraftSchema,
  createCustomerDraftSchema,
  createProductDraftSchema,
  createArrangementDraftSchema,
  adjustStockDraftSchema,
  createExpenseDraftSchema,
  registerPaymentDraftSchema,
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
  /** Id da conversa (persistência do histórico); o cliente reenvia no próximo turno. */
  conversationId?: string;
}

// ── Histórico (transcript + auditoria de ações) ────────────────────────────

export interface AssistantMessageEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

export interface AssistantConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface AssistantConversation {
  id: string;
  title: string;
  messages: AssistantMessageEntry[];
}

export interface AssistantActionEntry {
  id: string;
  kind: string;
  summary: string;
  href: string;
  conversationId: string | null;
  createdAt: string;
}

/** Histórico consolidado (usado no console do gestor). */
export interface AssistantLog {
  actions: AssistantActionEntry[];
  conversations: AssistantConversationSummary[];
}

export interface AssistantExecuteResult {
  /** Id do registro criado/editado (compra ou venda). */
  recordId: string;
  /** Link para o registro (ex.: "/compras/abc" ou "/vendas/abc"). */
  href: string;
  created: { supplier: boolean; products: number; customer: boolean };
  message: string;
}

// ── Medição de uso e cota (tokens/mês por empresa) ─────────────────────────

/** Tokens consumidos numa chamada ao provedor (para medição por empresa). */
export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

/** Uso do mês corrente de uma empresa vs. a cota efetiva (console do gestor). */
export interface AssistantUsageSummary {
  /** Total de tokens consumidos no mês corrente. */
  monthTokens: number;
  /** Cota efetiva do mês (override da empresa, se houver; senão a do plano). */
  quota: number;
  /** Override manual da empresa (o "plus"); null = usa a cota do plano. */
  quotaOverride: number | null;
  /** Cota-padrão do plano vigente (ou do trial). */
  planQuota: number;
  /** Tokens restantes no mês (>= 0). */
  remaining: number;
  /** Custo estimado do mês em R$ (referência para margem). */
  estimatedCostBRL: number;
}

/** Define/limpa o override de cota de uma empresa (null = volta ao do plano). */
export const setAssistantQuotaSchema = z.object({
  quota: z.coerce.number().int().min(0).max(100_000_000).nullable(),
});
export type SetAssistantQuotaInput = z.infer<typeof setAssistantQuotaSchema>;
