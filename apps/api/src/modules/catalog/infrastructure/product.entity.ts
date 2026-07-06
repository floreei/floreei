import type { ProductUnit } from "@sistema-flores/types";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import {
  decimalTransformer,
  quantityTransformer,
} from "../../../common/database/decimal.transformer";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { CategoryEntity } from "./category.entity";

/** Produto do catálogo (flor/folhagem/insumo/material) reutilizável. */
@Entity({ name: "products" })
export class ProductEntity extends TenantOwnedEntity {
  @Column({ name: "category_id", type: "uuid" })
  categoryId!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  /** Unidade-base de consumo/estoque (ex.: HASTE). */
  @Column({ type: "varchar", length: 16, default: "UNIDADE" })
  unit!: ProductUnit;

  /** Unidade de compra (embalagem, ex.: MACO). */
  @Column({ name: "purchase_unit", type: "varchar", length: 16, default: "UNIDADE" })
  purchaseUnit!: ProductUnit;

  /** Unidades-base por embalagem de compra (ex.: 5 hastes por maço). */
  @Column({
    name: "pack_size",
    type: "decimal",
    precision: 12,
    scale: 3,
    default: 1,
    transformer: quantityTransformer,
  })
  packSize!: number;

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

  /** Custo por unidade-base (última compra ÷ packSize). Atualizado no recebimento. */
  @Column({
    name: "current_unit_cost",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  currentUnitCost!: number;

  @Column({ name: "min_stock", type: "int", default: 0 })
  minStock!: number;

  @Column({ name: "image_url", type: "varchar", length: 1000, nullable: true })
  imageUrl!: string | null;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @ManyToOne(() => CategoryEntity, (category) => category.products, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "category_id" })
  category!: CategoryEntity;
}
