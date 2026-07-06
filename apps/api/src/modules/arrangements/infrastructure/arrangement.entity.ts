import type { ArrangementPricingMode } from "@sistema-flores/types";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { decimalTransformer } from "../../../common/database/decimal.transformer";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { CategoryEntity } from "../../catalog/infrastructure/category.entity";
import { ArrangementItemEntity } from "./arrangement-item.entity";

/** Produto composto / buquê: nome, preço de venda e a ficha técnica (receita). */
@Entity({ name: "arrangements" })
export class ArrangementEntity extends TenantOwnedEntity {
  @Column({ name: "category_id", type: "uuid", nullable: true })
  categoryId!: string | null;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ name: "pricing_mode", type: "varchar", length: 20, default: "FIXED" })
  pricingMode!: ArrangementPricingMode;

  @Column({
    name: "sale_price",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  salePrice!: number;

  @Column({
    name: "profit_value",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  profitValue!: number;

  @Column({
    name: "profit_pct",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  profitPct!: number;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  /** Foto do buquê (URL do Firebase Storage) — vitrine da loja online. */
  @Column({ name: "image_url", type: "varchar", length: 1000, nullable: true })
  imageUrl!: string | null;

  /** Publicado na loja online. */
  @Column({ name: "store_published", type: "boolean", default: false })
  storePublished!: boolean;

  @ManyToOne(() => CategoryEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "category_id" })
  category!: CategoryEntity | null;

  @OneToMany(() => ArrangementItemEntity, (item) => item.arrangement, {
    cascade: true,
  })
  items!: ArrangementItemEntity[];
}
