import type { ProductUnit } from "@sistema-flores/types";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/database/base.entity";
import {
  decimalTransformer,
  quantityTransformer,
} from "../../../common/database/decimal.transformer";
import { ProductEntity } from "../../catalog/infrastructure/product.entity";
import { PurchaseEntity } from "./purchase.entity";

/** Item de uma compra. */
@Entity({ name: "purchase_items" })
export class PurchaseItemEntity extends BaseEntity {
  @Column({ name: "purchase_id", type: "uuid" })
  purchaseId!: string;

  @Column({ name: "product_id", type: "uuid", nullable: true })
  productId!: string | null;

  @Column({ type: "varchar", length: 200 })
  description!: string;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 3,
    transformer: quantityTransformer,
  })
  quantity!: number;

  @Column({ type: "varchar", length: 16, default: "UNIDADE" })
  unit!: ProductUnit;

  @Column({
    name: "unit_price",
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPrice!: number;

  @Column({
    name: "line_total",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  lineTotal!: number;

  @ManyToOne(() => PurchaseEntity, (purchase) => purchase.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "purchase_id" })
  purchase!: PurchaseEntity;

  @ManyToOne(() => ProductEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "product_id" })
  product!: ProductEntity | null;
}
