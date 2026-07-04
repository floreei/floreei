import type { ProductUnit } from "@sistema-flores/types";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/database/base.entity";
import {
  decimalTransformer,
  quantityTransformer,
} from "../../../common/database/decimal.transformer";
import { ProductEntity } from "../../catalog/infrastructure/product.entity";
import { EventEntity } from "./event.entity";

/** Item vendido numa venda/evento (flor, quantidade e preço de venda). */
@Entity({ name: "event_items" })
export class EventItemEntity extends BaseEntity {
  @Column({ name: "event_id", type: "uuid" })
  eventId!: string;

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
    name: "unit_sale_price",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  unitSalePrice!: number;

  @Column({
    name: "line_total",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  lineTotal!: number;

  @ManyToOne(() => EventEntity, (event) => event.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: EventEntity;

  @ManyToOne(() => ProductEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "product_id" })
  product!: ProductEntity | null;
}
