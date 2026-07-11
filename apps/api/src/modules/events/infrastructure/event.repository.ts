import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { EventQuery, Paginated } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { EventEntity } from "./event.entity";

@Injectable()
export class EventRepository extends TenantScopedRepository<EventEntity> {
  constructor(
    @InjectRepository(EventEntity) repo: Repository<EventEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Evento");
  }

  findDetailed(id: string): Promise<EventEntity | null> {
    return this.findById(id, ["customer"]);
  }

  async search(query: EventQuery): Promise<Paginated<EventEntity>> {
    const qb = this.qb("event")
      .leftJoinAndSelect("event.customer", "customer")
      .orderBy("event.date", "DESC");

    if (query.type) {
      qb.andWhere("event.type = :type", { type: query.type });
    }
    if (query.channel) {
      qb.andWhere("event.channel = :channel", { channel: query.channel });
    }
    if (query.status) {
      qb.andWhere("event.status = :status", { status: query.status });
    }
    if (query.customerId) {
      qb.andWhere("event.customer_id = :customerId", {
        customerId: query.customerId,
      });
    }
    if (query.paymentStatus === "paid") {
      qb.andWhere("event.received_value >= event.sold_value");
    } else if (query.paymentStatus === "pending") {
      qb.andWhere("event.received_value < event.sold_value");
    } else if (query.paymentStatus === "overdue") {
      qb.andWhere("event.received_value < event.sold_value");
      qb.andWhere("event.date < CURRENT_DATE");
    }
    if (query.delivered === true) {
      qb.andWhere("event.status = 'DONE'");
    } else if (query.delivered === false) {
      qb.andWhere("event.status IN ('CONFIRMED', 'IN_PROGRESS')");
    }
    if (query.from) {
      qb.andWhere("event.date >= :from", { from: query.from });
    }
    if (query.to) {
      qb.andWhere("event.date <= :to", { to: query.to });
    }
    if (query.search) {
      qb.andWhere("(event.title ILIKE :s OR customer.name ILIKE :s)", {
        s: `%${query.search}%`,
      });
    }

    return paginate(qb, query.page, query.pageSize);
  }
}
