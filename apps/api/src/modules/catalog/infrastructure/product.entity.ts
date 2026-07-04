import type { ProductUnit } from "@sistema-flores/types";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { decimalTransformer } from "../../../common/database/decimal.transformer";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { CategoryEntity } from "./category.entity";

/** Produto do catálogo (flor/folhagem/insumo) reutilizável em orçamentos. */
@Entity({ name: "products" })
export class ProductEntity extends TenantOwnedEntity {
  @Column({ name: "category_id", type: "uuid" })
  categoryId!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 16, default: "UNIDADE" })
  unit!: ProductUnit;

  @Column({
    name: "default_purchase_price",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  defaultPurchasePrice!: number;

  @Column({
    name: "default_sale_price",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  defaultSalePrice!: number;

  @Column({ name: "min_stock", type: "int", default: 0 })
  minStock!: number;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @ManyToOne(() => CategoryEntity, (category) => category.products, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "category_id" })
  category!: CategoryEntity;
}
