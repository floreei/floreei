import { Injectable } from "@nestjs/common";
import type {
  CashInInput,
  CashMovement,
  Cashflow,
  MonthlyCashflow,
  MonthlyCashPoint,
  Payment,
} from "@sistema-flores/types";
import { todayISO } from "../../../common/date/today";
import { roundMoney } from "../../../common/money/money";
import { EventRepository } from "../../events/infrastructure/event.repository";
import { ExpenseRepository } from "../../expenses/infrastructure/expense.repository";
import { PurchaseRepository } from "../../purchases/infrastructure/purchase.repository";
import { PaymentEntity } from "../infrastructure/payment.entity";
import { PaymentRepository } from "../infrastructure/payment.repository";

const today = todayISO;

function paymentToMovement(
  p: PaymentEntity,
  eventNames: Map<string, string>,
  purchaseNames: Map<string, string>,
): CashMovement {
  const isReceive = p.direction === "IN" && Boolean(p.eventId);
  const isSupplier = p.direction === "OUT" && Boolean(p.purchaseId);
  const kind = isReceive
    ? "receivement"
    : isSupplier
      ? "supplier_payment"
      : "manual";

  let description: string;
  let sourceType: CashMovement["sourceType"] = null;
  let sourceId: string | null = null;
  if (isReceive) {
    description = `Recebimento — ${eventNames.get(p.eventId!) ?? "venda"}`;
    sourceType = "event";
    sourceId = p.eventId;
  } else if (isSupplier) {
    description = `Pagamento a ${purchaseNames.get(p.purchaseId!) ?? "fornecedor"}`;
    sourceType = "purchase";
    sourceId = p.purchaseId;
  } else {
    description =
      p.description ?? p.notes ?? (p.direction === "IN" ? "Entrada avulsa" : "Saída");
  }

  return {
    id: p.id,
    date: p.date,
    direction: p.direction,
    kind,
    description,
    amount: p.amount,
    sourceType,
    sourceId,
  };
}

@Injectable()
export class CashflowService {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly expenses: ExpenseRepository,
    private readonly events: EventRepository,
    private readonly purchases: PurchaseRepository,
  ) {}

  async cashflow(fromInput?: string, toInput?: string): Promise<Cashflow> {
    const from = fromInput ?? today();
    const to = toInput ?? from;

    const [payments, expenses] = await Promise.all([
      this.payments.listInRange(from, to),
      this.expenses.listInRange(from, to),
    ]);

    // Enriquece com o nome do cliente (venda) e do fornecedor (compra).
    const eventNames = new Map<string, string>();
    const purchaseNames = new Map<string, string>();
    for (const p of payments) {
      if (p.eventId && !eventNames.has(p.eventId)) {
        const ev = await this.events.findById(p.eventId, ["customer"]);
        if (ev) {
          eventNames.set(p.eventId, ev.title || ev.customer?.name || "venda");
        }
      }
      if (p.purchaseId && !purchaseNames.has(p.purchaseId)) {
        const pu = await this.purchases.findById(p.purchaseId, ["supplier"]);
        if (pu) purchaseNames.set(p.purchaseId, pu.supplier?.name ?? "fornecedor");
      }
    }

    const movements: CashMovement[] = [
      ...payments.map((p) => paymentToMovement(p, eventNames, purchaseNames)),
      ...expenses.map((e) => ({
        id: e.id,
        date: e.date,
        direction: "OUT" as const,
        kind: "expense" as const,
        description: `${e.description} · ${e.costCenter}`,
        amount: e.amount,
        sourceType: null,
        sourceId: null,
      })),
    ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    const entradas = roundMoney(
      movements.filter((m) => m.direction === "IN").reduce((s, m) => s + m.amount, 0),
    );
    const saidas = roundMoney(
      movements.filter((m) => m.direction === "OUT").reduce((s, m) => s + m.amount, 0),
    );

    return {
      from,
      to,
      entradas,
      saidas,
      saldo: roundMoney(entradas - saidas),
      movements,
    };
  }

  /** Entradas/saídas/saldo agregados por mês num ano (para o gráfico). */
  async monthly(year?: number): Promise<MonthlyCashflow> {
    const y = year ?? new Date().getFullYear();
    const from = `${y}-01-01`;
    const to = `${y}-12-31`;

    const [payments, expenses] = await Promise.all([
      this.payments.listInRange(from, to),
      this.expenses.listInRange(from, to),
    ]);

    const months: MonthlyCashPoint[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      entradas: 0,
      saidas: 0,
      saldo: 0,
    }));

    const monthIndex = (date: string | Date) =>
      Number(String(date).slice(5, 7)) - 1;

    for (const p of payments) {
      const m = monthIndex(p.date);
      if (m < 0 || m > 11) continue;
      if (p.direction === "IN") months[m].entradas += p.amount;
      else months[m].saidas += p.amount;
    }
    for (const e of expenses) {
      const m = monthIndex(e.date);
      if (m < 0 || m > 11) continue;
      months[m].saidas += e.amount;
    }

    for (const mm of months) {
      mm.entradas = roundMoney(mm.entradas);
      mm.saidas = roundMoney(mm.saidas);
      mm.saldo = roundMoney(mm.entradas - mm.saidas);
    }

    return { year: y, months };
  }

  /** Entrada de caixa avulsa (receita sem venda vinculada). */
  async cashIn(input: CashInInput): Promise<Payment> {
    const payment = await this.payments.save(
      this.payments.create({
        direction: "IN",
        amount: input.amount,
        date: input.date ?? today(),
        method: input.method,
        description: input.description,
      }),
    );
    return {
      id: payment.id,
      companyId: payment.companyId,
      direction: payment.direction,
      eventId: payment.eventId,
      purchaseId: payment.purchaseId,
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      notes: payment.notes,
      createdAt:
        payment.createdAt instanceof Date
          ? payment.createdAt.toISOString()
          : payment.createdAt,
    };
  }
}
