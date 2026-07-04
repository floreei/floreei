import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { StockMovementEntity } from "./stock-movement.entity";

const SIGNED_QTY =
  "SUM(CASE WHEN m.type IN ('ENTRADA','AJUSTE') THEN m.quantity ELSE -m.quantity END)";

@Injectable()
export class StockMovementRepository extends TenantScopedRepository<StockMovementEntity> {
  constructor(
    @InjectRepository(StockMovementEntity)
    repo: Repository<StockMovementEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Movimentação");
  }

  /** Saldo atual por produto (productId → quantidade). */
  async onHandByProduct(): Promise<Map<string, number>> {
    const rows = await this.qb("m")
      .select("m.product_id", "productId")
      .addSelect(SIGNED_QTY, "qty")
      .groupBy("m.product_id")
      .getRawMany<{ productId: string; qty: string }>();
    return new Map(rows.map((r) => [r.productId, Number(r.qty) || 0]));
  }

  /** Saldo de um único produto. */
  async onHand(productId: string): Promise<number> {
    const row = await this.qb("m")
      .select(SIGNED_QTY, "qty")
      .andWhere("m.product_id = :productId", { productId })
      .getRawOne<{ qty: string | null }>();
    return Number(row?.qty ?? 0) || 0;
  }

  /** Lotes (entradas) com validade dentro de N dias. */
  listExpiring(fromDate: string, toDate: string): Promise<StockMovementEntity[]> {
    return this.qb("m")
      .andWhere("m.type IN ('ENTRADA','AJUSTE')")
      .andWhere("m.expires_at IS NOT NULL")
      .andWhere("m.expires_at BETWEEN :from AND :to", {
        from: fromDate,
        to: toDate,
      })
      .leftJoinAndSelect("m.product", "product")
      .orderBy("m.expires_at", "ASC")
      .getMany();
  }

  listBySource(sourceId: string): Promise<StockMovementEntity[]> {
    return this.findAll({ where: { sourceId } });
  }

  /** Remove todas as movimentações de uma origem (ex.: reprocessar uma compra). */
  async deleteBySource(sourceId: string, source: string): Promise<void> {
    await this.repo.delete({
      companyId: this.companyId,
      sourceId,
      source,
    } as FindOptionsWhere<StockMovementEntity>);
  }

  list(productId?: string): Promise<StockMovementEntity[]> {
    const qb = this.qb("m")
      .leftJoinAndSelect("m.product", "product")
      .orderBy("m.date", "DESC")
      .addOrderBy("m.createdAt", "DESC")
      .limit(200);
    if (productId) {
      qb.andWhere("m.product_id = :productId", { productId });
    }
    return qb.getMany();
  }
}
