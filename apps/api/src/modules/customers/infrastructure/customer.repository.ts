import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { CustomerQuery, Paginated } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { CustomerEntity } from "./customer.entity";

@Injectable()
export class CustomerRepository extends TenantScopedRepository<CustomerEntity> {
  constructor(
    @InjectRepository(CustomerEntity) repo: Repository<CustomerEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Cliente");
  }

  /** Lista paginada com busca por nome, e-mail, telefone ou documento. */
  async search(query: CustomerQuery): Promise<Paginated<CustomerEntity>> {
    const qb = this.qb("customer").orderBy("customer.name", "ASC");

    if (query.search) {
      qb.andWhere(
        "(customer.name ILIKE :s OR customer.email ILIKE :s OR customer.phone ILIKE :s OR customer.document ILIKE :s OR customer.whatsapp ILIKE :s)",
        { s: `%${query.search}%` },
      );
    }
    if (query.channel) {
      qb.andWhere("customer.channel = :channel", { channel: query.channel });
    }

    return paginate(qb, query.page, query.pageSize);
  }

  /** Busca por telefone (dedupe de clientes vindos da loja). */
  findByPhone(phone: string): Promise<CustomerEntity | null> {
    return this.qb("customer")
      .andWhere("(customer.phone = :phone OR customer.whatsapp = :phone)", {
        phone,
      })
      .getOne();
  }
}
