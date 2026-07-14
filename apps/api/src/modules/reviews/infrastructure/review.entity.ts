import type { ReviewSource, ReviewStatus } from "@sistema-flores/types";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { ArrangementEntity } from "../../arrangements/infrastructure/arrangement.entity";

/**
 * Avaliação de um buquê na loja online. Enviada pelo consumidor (CUSTOMER) ou
 * semeada (SEED) para credibilidade inicial. Nasce APPROVED; a moderação pode
 * ocultá-la (HIDDEN) ou excluí-la.
 */
@Entity({ name: "arrangement_reviews" })
@Index("ix_reviews_company_arrangement", ["companyId", "arrangementId"])
export class ReviewEntity extends TenantOwnedEntity {
  @Column({ name: "arrangement_id", type: "uuid" })
  arrangementId!: string;

  @Column({ name: "author_name", type: "varchar", length: 80 })
  authorName!: string;

  @Column({ type: "int" })
  rating!: number;

  @Column({ type: "text", nullable: true })
  comment!: string | null;

  @Column({ type: "varchar", length: 10, default: "APPROVED" })
  status!: ReviewStatus;

  @Column({ type: "varchar", length: 10, default: "CUSTOMER" })
  source!: ReviewSource;

  @ManyToOne(() => ArrangementEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "arrangement_id" })
  arrangement!: ArrangementEntity;
}
