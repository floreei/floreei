import { z } from "zod";
import { moneySchema, paginationQuerySchema } from "./common";
import { paymentMethodSchema, type PaymentMethod } from "./enums";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");
const optionalDate = dateString
  .optional()
  .or(z.literal("").transform(() => undefined));

/** Centros de custo sugeridos (campo é livre, estes são atalhos na UI). */
/**
 * Categorias de despesa (overhead) — o que NÃO é insumo nem para revenda.
 * Ferramentas, móveis e contas entram aqui; papel/cola/flor são insumos.
 */
export const COST_CENTERS = [
  "Ferramentas",
  "Equipamentos e móveis",
  "Contas (água/luz/internet)",
  "Aluguel",
  "Salários",
  "Transporte",
  "Marketing",
  "Impostos e taxas",
  "Manutenção",
  "Outros",
] as const;

/** Tipo de anexo de uma despesa: a conta (boleto/fatura) ou o comprovante de pagamento. */
export const expenseAttachmentKindSchema = z.enum(["BILL", "RECEIPT"]);
export type ExpenseAttachmentKind = z.infer<typeof expenseAttachmentKindSchema>;

/** Anexo de despesa: arquivo no Firebase Storage (a URL de download). */
export const expenseAttachmentInputSchema = z.object({
  label: z.string().trim().min(1, "Nome do arquivo").max(160),
  url: z.string().trim().url("Arquivo inválido").max(1000),
  kind: expenseAttachmentKindSchema,
  contentType: z.string().trim().max(100).optional(),
});
export type ExpenseAttachmentInput = z.infer<typeof expenseAttachmentInputSchema>;

export interface ExpenseAttachment {
  id: string;
  expenseId: string;
  label: string;
  url: string;
  kind: ExpenseAttachmentKind;
  contentType: string | null;
  createdAt: string;
}

/** Registro de despesa (nasce "a pagar"; o pagamento é um passo à parte). */
export const expenseInputSchema = z.object({
  description: z.string().trim().min(2, "Descreva a despesa").max(160),
  costCenter: z.string().trim().min(1, "Informe o centro de custo").max(80),
  amount: moneySchema.refine((v) => v > 0, "Valor deve ser maior que zero"),
  dueDate: dateString,
  recurring: z.boolean().default(false),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type ExpenseInput = z.infer<typeof expenseInputSchema>;

/** Marca uma despesa como paga (data + método + comprovante opcional). */
export const payExpenseSchema = z.object({
  paidDate: optionalDate,
  paymentMethod: paymentMethodSchema,
  receipt: z
    .object({
      label: z.string().trim().min(1).max(160),
      url: z.string().trim().url().max(1000),
      contentType: z.string().trim().max(100).optional(),
    })
    .optional(),
});
export type PayExpenseInput = z.infer<typeof payExpenseSchema>;

export const expenseQuerySchema = paginationQuerySchema.extend({
  from: dateString.optional(),
  to: dateString.optional(),
  costCenter: z.string().trim().optional(),
  /** Filtro de situação: todas (default), a pagar, pagas, vencidas. */
  status: z.enum(["all", "unpaid", "paid", "overdue"]).optional(),
});
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;

export interface Expense {
  id: string;
  companyId: string;
  description: string;
  costCenter: string;
  amount: number;
  /** Data de vencimento. */
  dueDate: string;
  paid: boolean;
  paidDate: string | null;
  paymentMethod: PaymentMethod | null;
  recurring: boolean;
  notes: string | null;
  attachments: ExpenseAttachment[];
  createdAt: string;
  updatedAt: string;
}
