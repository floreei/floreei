import { z } from "zod";
import { idSchema, moneySchema } from "./common";
import {
  paymentMethodSchema,
  type PaymentDirection,
  type PaymentMethod,
} from "./enums";

/** Baixa de pagamento (recebimento de evento ou pagamento de compra). */
export const paymentInputSchema = z.object({
  amount: moneySchema.refine((v) => v > 0, "Informe um valor maior que zero"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional(),
  method: paymentMethodSchema.default("PIX"),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type PaymentInput = z.infer<typeof paymentInputSchema>;

export interface Payment {
  id: string;
  companyId: string;
  direction: PaymentDirection;
  eventId: string | null;
  purchaseId: string | null;
  amount: number;
  date: string;
  method: PaymentMethod;
  notes: string | null;
  createdAt: string;
}

/** Uma conta em aberto (a receber ou a pagar). */
export interface OpenAccount {
  id: string; // id do evento, da compra ou da despesa
  kind: "EVENT" | "PURCHASE" | "EXPENSE";
  title: string;
  partyName: string; // cliente, fornecedor ou centro de custo
  date: string; // vencimento
  total: number;
  paid: number;
  balanceDue: number;
}

export interface FinanceSummary {
  /** Total ainda a receber de clientes (eventos). */
  totalReceivable: number;
  /** Total ainda a pagar a fornecedores (compras). */
  totalPayable: number;
  /** Recebido no mês de referência. */
  receivedThisMonth: number;
  /** Pago no mês de referência. */
  paidThisMonth: number;
  /** receivedThisMonth - paidThisMonth */
  netThisMonth: number;
  receivables: OpenAccount[];
  payables: OpenAccount[];
}

export const financeQuerySchema = z.object({
  kind: z.enum(["RECEIVABLE", "PAYABLE"]).optional(),
});

/** Resposta ao registrar uma baixa. */
export interface PaymentResult {
  payment: Payment;
  total: number;
  paid: number;
  balanceDue: number;
}

export const eventPaymentParams = z.object({ eventId: idSchema });
export const purchasePaymentParams = z.object({ purchaseId: idSchema });

/** Um movimento de caixa (entrada ou saída) no extrato. */
export interface CashMovement {
  id: string;
  date: string;
  direction: PaymentDirection;
  kind: "receivement" | "supplier_payment" | "expense" | "manual";
  description: string;
  amount: number;
  /** Origem do lançamento, para abrir o pedido de venda/compra. */
  sourceType: "event" | "purchase" | null;
  sourceId: string | null;
}

/** Extrato de caixa de um período com totais. */
export interface Cashflow {
  from: string;
  to: string;
  entradas: number;
  saidas: number;
  saldo: number;
  movements: CashMovement[];
}

export const cashflowQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type CashflowQuery = z.infer<typeof cashflowQuerySchema>;

/** Entradas/saídas/saldo de um mês (para o gráfico anual). */
export interface MonthlyCashPoint {
  /** 1 = janeiro … 12 = dezembro. */
  month: number;
  entradas: number;
  saidas: number;
  saldo: number;
}

/** Fluxo de caixa agregado por mês ao longo de um ano. */
export interface MonthlyCashflow {
  year: number;
  months: MonthlyCashPoint[];
}

export const monthlyCashflowQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});
export type MonthlyCashflowQuery = z.infer<typeof monthlyCashflowQuerySchema>;

/** Lançamento avulso de entrada de caixa (receita sem venda vinculada). */
export const cashInSchema = z.object({
  amount: moneySchema.refine((v) => v > 0, "Informe um valor maior que zero"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  method: paymentMethodSchema.default("PIX"),
  description: z.string().trim().min(1, "Descreva a entrada").max(160),
});
export type CashInInput = z.infer<typeof cashInSchema>;
