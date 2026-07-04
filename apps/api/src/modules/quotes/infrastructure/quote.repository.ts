import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Paginated, QuoteQuery } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { QuoteEntity } from "./quote.entity";

@Injectable()
export class QuoteRepository extends TenantScopedRepository<QuoteEntity> {
  constructor(
    @InjectRepository(QuoteEntity) repo: Repository<QuoteEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Orçamento");
  }

  /** Próximo número sequencial de orçamento da empresa. */
  async nextNumber(): Promise<number> {
    const row = await this.qb("quote")
      .select("MAX(quote.number)", "max")
      .getRawOne<{ max: string | null }>();
    return (Number(row?.max ?? 0) || 0) + 1;
  }

  findDetailed(id: string): Promise<QuoteEntity | null> {
    return this.findById(id, ["items", "customer"]);
  }

  async search(query: QuoteQuery): Promise<Paginated<QuoteEntity>> {
    const qb = this.qb("quote")
      .leftJoinAndSelect("quote.customer", "customer")
      .orderBy("quote.number", "DESC");

    if (query.status) {
      qb.andWhere("quote.status = :status", { status: query.status });
    }
    if (query.customerId) {
      qb.andWhere("quote.customer_id = :customerId", {
        customerId: query.customerId,
      });
    }
    if (query.search) {
      qb.andWhere(
        "(customer.name ILIKE :s OR CAST(quote.number AS TEXT) ILIKE :s)",
        { s: `%${query.search}%` },
      );
    }

    return paginate(qb, query.page, query.pageSize);
  }
}
