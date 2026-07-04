import { Injectable } from "@nestjs/common";
import type { FinanceSummary, OpenAccount } from "@sistema-flores/types";
import { roundMoney } from "../../../common/money/money";
import { EventRepository } from "../../events/infrastructure/event.repository";
import { PurchaseRepository } from "../../purchases/infrastructure/purchase.repository";
import { PaymentRepository } from "../infrastructure/payment.repository";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

@Injectable()
export class FinanceService {
  constructor(
    private readonly events: EventRepository,
    private readonly purchases: PurchaseRepository,
    private readonly payments: PaymentRepository,
  ) {}

  async summary(reference = new Date()): Promise<FinanceSummary> {
    const monthStart = `${reference.getFullYear()}-${pad(reference.getMonth() + 1)}-01`;
    const monthEnd = `${reference.getFullYear()}-${pad(reference.getMonth() + 1)}-${pad(
      new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate(),
    )}`;

    const receivables = await this.receivables();
    const payables = await this.payables();

    const [receivedThisMonth, paidThisMonth] = await Promise.all([
      this.payments.sumInRange("IN", monthStart, monthEnd),
      this.payments.sumInRange("OUT", monthStart, monthEnd),
    ]);

    const totalReceivable = roundMoney(
      receivables.reduce((acc, r) => acc + r.balanceDue, 0),
    );
    const totalPayable = roundMoney(
      payables.reduce((acc, p) => acc + p.balanceDue, 0),
    );

    return {
      totalReceivable,
      totalPayable,
      receivedThisMonth,
      paidThisMonth,
      netThisMonth: roundMoney(receivedThisMonth - paidThisMonth),
      receivables,
      payables,
    };
  }

  /** Eventos com saldo a receber. */
  async receivables(): Promise<OpenAccount[]> {
    const rows = await this.events
      .qb("event")
      .leftJoinAndSelect("event.customer", "customer")
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.sold_value > event.received_value")
      .orderBy("event.date", "ASC")
      .getMany();

    return rows.map((event) => ({
      id: event.id,
      kind: "EVENT" as const,
      title: event.title,
      partyName: event.customer?.name ?? "Consumidor",
      date: event.date,
      total: event.soldValue,
      paid: event.receivedValue,
      balanceDue: roundMoney(event.soldValue - event.receivedValue),
    }));
  }

  /** Compras com saldo a pagar. */
  async payables(): Promise<OpenAccount[]> {
    const rows = await this.purchases
      .qb("purchase")
      .leftJoinAndSelect("purchase.supplier", "supplier")
      .andWhere("purchase.status <> 'CANCELED'")
      .andWhere("purchase.total > purchase.paid_amount")
      .orderBy("purchase.date", "ASC")
      .getMany();

    return rows.map((purchase) => ({
      id: purchase.id,
      kind: "PURCHASE" as const,
      title: `Compra ${purchase.date}`,
      partyName: purchase.supplier?.name ?? "Fornecedor",
      date: purchase.date,
      total: purchase.total,
      paid: purchase.paidAmount,
      balanceDue: roundMoney(purchase.total - purchase.paidAmount),
    }));
  }
}
