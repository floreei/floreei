import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { PaymentDirection } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { roundMoney } from "../../../common/money/money";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { PaymentEntity } from "./payment.entity";

@Injectable()
export class PaymentRepository extends TenantScopedRepository<PaymentEntity> {
  constructor(
    @InjectRepository(PaymentEntity) repo: Repository<PaymentEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Pagamento");
  }

  listForEvent(eventId: string): Promise<PaymentEntity[]> {
    return this.findAll({ where: { eventId }, order: { date: "DESC" } });
  }

  listForPurchase(purchaseId: string): Promise<PaymentEntity[]> {
    return this.findAll({ where: { purchaseId }, order: { date: "DESC" } });
  }

  /** Todos os lançamentos de caixa no período (para o extrato). */
  listInRange(from: string, to: string): Promise<PaymentEntity[]> {
    return this.qb("payment")
      .andWhere("payment.date BETWEEN :from AND :to", { from, to })
      .orderBy("payment.date", "DESC")
      .addOrderBy("payment.createdAt", "DESC")
      .getMany();
  }

  /** Soma de lançamentos de uma direção dentro de um intervalo de datas. */
  async sumInRange(
    direction: PaymentDirection,
    from: string,
    to: string,
  ): Promise<number> {
    const row = await this.qb("payment")
      .select("COALESCE(SUM(payment.amount), 0)", "total")
      .andWhere("payment.direction = :direction", { direction })
      .andWhere("payment.date BETWEEN :from AND :to", { from, to })
      .getRawOne<{ total: string }>();
    return roundMoney(Number(row?.total ?? 0));
  }
}
