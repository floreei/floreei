import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  Payment,
  PaymentInput,
  PaymentResult,
} from "@sistema-flores/types";
import { roundMoney } from "../../../common/money/money";
import { EventRepository } from "../../events/infrastructure/event.repository";
import { PurchaseRepository } from "../../purchases/infrastructure/purchase.repository";
import { PaymentEntity } from "../infrastructure/payment.entity";
import { PaymentRepository } from "../infrastructure/payment.repository";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function toPayment(p: PaymentEntity): Payment {
  return {
    id: p.id,
    companyId: p.companyId,
    direction: p.direction,
    eventId: p.eventId,
    purchaseId: p.purchaseId,
    amount: p.amount,
    date: p.date,
    method: p.method,
    notes: p.notes,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  };
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly events: EventRepository,
    private readonly purchases: PurchaseRepository,
  ) {}

  /** Registra um recebimento de cliente para um evento. */
  async receiveForEvent(
    eventId: string,
    input: PaymentInput,
  ): Promise<PaymentResult> {
    const event = await this.events.findByIdOrFail(eventId);
    const balance = roundMoney(event.soldValue - event.receivedValue);
    if (input.amount > balance + 0.001) {
      throw new BadRequestException(
        `Valor acima do saldo a receber (${balance.toFixed(2)}).`,
      );
    }

    const payment = await this.payments.save(
      this.payments.create({
        direction: "IN",
        eventId,
        amount: input.amount,
        date: input.date ?? today(),
        method: input.method,
        notes: input.notes ?? null,
      }),
    );

    const paid = roundMoney(event.receivedValue + input.amount);
    await this.events.updateById(eventId, { receivedValue: paid });

    return {
      payment: toPayment(payment),
      total: event.soldValue,
      paid,
      balanceDue: roundMoney(event.soldValue - paid),
    };
  }

  /** Registra um pagamento a fornecedor para uma compra. */
  async payForPurchase(
    purchaseId: string,
    input: PaymentInput,
  ): Promise<PaymentResult> {
    const purchase = await this.purchases.findByIdOrFail(purchaseId);
    const balance = roundMoney(purchase.total - purchase.paidAmount);
    if (input.amount > balance + 0.001) {
      throw new BadRequestException(
        `Valor acima do saldo a pagar (${balance.toFixed(2)}).`,
      );
    }

    const payment = await this.payments.save(
      this.payments.create({
        direction: "OUT",
        purchaseId,
        amount: input.amount,
        date: input.date ?? today(),
        method: input.method,
        notes: input.notes ?? null,
      }),
    );

    const paid = roundMoney(purchase.paidAmount + input.amount);
    await this.purchases.updateById(purchaseId, { paidAmount: paid });

    return {
      payment: toPayment(payment),
      total: purchase.total,
      paid,
      balanceDue: roundMoney(purchase.total - paid),
    };
  }

  async listForEvent(eventId: string): Promise<Payment[]> {
    return (await this.payments.listForEvent(eventId)).map(toPayment);
  }

  async listForPurchase(purchaseId: string): Promise<Payment[]> {
    return (await this.payments.listForPurchase(purchaseId)).map(toPayment);
  }

  /** Desfaz um recebimento lançado por engano: devolve ao "a receber" e some do caixa. */
  async removeEventPayment(eventId: string, paymentId: string): Promise<void> {
    const payment = await this.payments.findByIdOrFail(paymentId);
    if (payment.eventId !== eventId || payment.direction !== "IN") {
      throw new BadRequestException("Recebimento não pertence a esta venda.");
    }
    const event = await this.events.findByIdOrFail(eventId);
    await this.events.updateById(eventId, {
      receivedValue: roundMoney(event.receivedValue - payment.amount),
    });
    await this.payments.deleteById(paymentId);
  }

  /** Desfaz um pagamento a fornecedor lançado por engano: volta ao "a pagar". */
  async removePurchasePayment(
    purchaseId: string,
    paymentId: string,
  ): Promise<void> {
    const payment = await this.payments.findByIdOrFail(paymentId);
    if (payment.purchaseId !== purchaseId || payment.direction !== "OUT") {
      throw new BadRequestException("Pagamento não pertence a esta compra.");
    }
    const purchase = await this.purchases.findByIdOrFail(purchaseId);
    await this.purchases.updateById(purchaseId, {
      paidAmount: roundMoney(purchase.paidAmount - payment.amount),
    });
    await this.payments.deleteById(paymentId);
  }

  /** Edita um recebimento (valor/forma/data): reajusta o total recebido do evento. */
  async updateEventPayment(
    eventId: string,
    paymentId: string,
    input: PaymentInput,
  ): Promise<PaymentResult> {
    const payment = await this.payments.findByIdOrFail(paymentId);
    if (payment.eventId !== eventId || payment.direction !== "IN") {
      throw new BadRequestException("Recebimento não pertence a esta venda.");
    }
    const event = await this.events.findByIdOrFail(eventId);
    const receivedWithout = roundMoney(event.receivedValue - payment.amount);
    const available = roundMoney(event.soldValue - receivedWithout);
    if (input.amount > available + 0.001) {
      throw new BadRequestException(
        `Valor acima do saldo a receber (${available.toFixed(2)}).`,
      );
    }
    await this.payments.updateById(paymentId, {
      amount: input.amount,
      method: input.method,
      date: input.date ?? payment.date,
      notes: input.notes ?? null,
    });
    const paid = roundMoney(receivedWithout + input.amount);
    await this.events.updateById(eventId, { receivedValue: paid });
    return {
      payment: toPayment(await this.payments.findByIdOrFail(paymentId)),
      total: event.soldValue,
      paid,
      balanceDue: roundMoney(event.soldValue - paid),
    };
  }

  /** Edita um pagamento a fornecedor: reajusta o valor pago da compra. */
  async updatePurchasePayment(
    purchaseId: string,
    paymentId: string,
    input: PaymentInput,
  ): Promise<PaymentResult> {
    const payment = await this.payments.findByIdOrFail(paymentId);
    if (payment.purchaseId !== purchaseId || payment.direction !== "OUT") {
      throw new BadRequestException("Pagamento não pertence a esta compra.");
    }
    const purchase = await this.purchases.findByIdOrFail(purchaseId);
    const paidWithout = roundMoney(purchase.paidAmount - payment.amount);
    const available = roundMoney(purchase.total - paidWithout);
    if (input.amount > available + 0.001) {
      throw new BadRequestException(
        `Valor acima do saldo a pagar (${available.toFixed(2)}).`,
      );
    }
    await this.payments.updateById(paymentId, {
      amount: input.amount,
      method: input.method,
      date: input.date ?? payment.date,
      notes: input.notes ?? null,
    });
    const paid = roundMoney(paidWithout + input.amount);
    await this.purchases.updateById(purchaseId, { paidAmount: paid });
    return {
      payment: toPayment(await this.payments.findByIdOrFail(paymentId)),
      total: purchase.total,
      paid,
      balanceDue: roundMoney(purchase.total - paid),
    };
  }
}
