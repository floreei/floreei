import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Paginated, ReviewQuery } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { ReviewEntity } from "./review.entity";

export interface ReviewAggregate {
  arrangementId: string;
  avg: number;
  count: number;
}

@Injectable()
export class ReviewRepository extends TenantScopedRepository<ReviewEntity> {
  constructor(
    @InjectRepository(ReviewEntity) repo: Repository<ReviewEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Avaliação");
  }

  /** Lista para moderação (com o nome do buquê), mais recente primeiro. */
  search(query: ReviewQuery): Promise<Paginated<ReviewEntity>> {
    const qb = this.qb("review")
      .leftJoinAndSelect("review.arrangement", "arrangement")
      .orderBy("review.created_at", "DESC");
    if (query.arrangementId) {
      qb.andWhere("review.arrangement_id = :aid", { aid: query.arrangementId });
    }
    if (query.status) {
      qb.andWhere("review.status = :st", { st: query.status });
    }
    return paginate(qb, query.page, query.pageSize);
  }

  /** Avaliações APROVADas de um buquê (loja), mais recente primeiro. */
  listApprovedForArrangement(arrangementId: string): Promise<ReviewEntity[]> {
    return this.qb("review")
      .andWhere("review.arrangement_id = :aid", { aid: arrangementId })
      .andWhere("review.status = 'APPROVED'")
      .orderBy("review.created_at", "DESC")
      .getMany();
  }

  /** Média e contagem das avaliações APROVADas, por buquê (tenant atual). */
  async approvedAggregates(): Promise<ReviewAggregate[]> {
    const rows = await this.qb("review")
      .select("review.arrangement_id", "arrangementId")
      .addSelect("AVG(review.rating)", "avg")
      .addSelect("COUNT(*)", "count")
      .andWhere("review.status = 'APPROVED'")
      .groupBy("review.arrangement_id")
      .getRawMany<{ arrangementId: string; avg: string; count: string }>();
    return rows.map((r) => ({
      arrangementId: r.arrangementId,
      avg: Number(r.avg),
      count: Number(r.count),
    }));
  }
}
