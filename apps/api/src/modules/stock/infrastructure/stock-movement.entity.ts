import type { StockMovementType, StockSource } from "@sistema-flores/types";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { quantityTransformer } from "../../../common/database/decimal.transformer";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { ProductEntity } from "../../catalog/infrastructure/product.entity";

/** Movimentação de estoque de um produto (entrada, saída, perda, ajuste). */
@Entity({ name: "stock_movements" })
@Index("ix_stock_company_product", ["companyId", "productId"])
export class StockMovementEntity extends TenantOwnedEntity {
  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @Column({ type: "varchar", length: 12 })
  type!: StockMovementType;

  @Column({ type: "varchar", length: 12, default: "MANUAL" })
  source!: StockSource;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 3,
    transformer: quantityTransformer,
  })
  quantity!: number;

  @Column({ type: "varchar", length: 60, nullable: true })
  lot!: string | null;

  @Column({ name: "expires_at", type: "date", nullable: true })
  expiresAt!: string | null;

  @Column({ name: "source_id", type: "uuid", nullable: true })
  sourceId!: string | null;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  notes!: string | null;

  @ManyToOne(() => ProductEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: ProductEntity;
}
