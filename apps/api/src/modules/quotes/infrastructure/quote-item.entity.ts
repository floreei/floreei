import type { ProductUnit } from "@sistema-flores/types";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/database/base.entity";
import {
  decimalTransformer,
  quantityTransformer,
} from "../../../common/database/decimal.transformer";
import { ProductEntity } from "../../catalog/infrastructure/product.entity";
import { QuoteEntity } from "./quote.entity";

/**
 * Item de um orçamento. Preços são "snapshot" do catálogo no momento — assim o
 * histórico não muda se o preço do produto for alterado depois.
 */
@Entity({ name: "quote_items" })
export class QuoteItemEntity extends BaseEntity {
  @Column({ name: "quote_id", type: "uuid" })
  quoteId!: string;

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
    name: "purchase_price",
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  purchasePrice!: number;

  @Column({
    name: "sale_price",
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  salePrice!: number;

  @Column({
    name: "line_cost",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  lineCost!: number;

  @Column({
    name: "line_sale",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  lineSale!: number;

  @Column({
    name: "line_profit",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  lineProfit!: number;

  @Column({
    name: "margin_pct",
    type: "decimal",
    precision: 6,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  marginPct!: number;

  @ManyToOne(() => QuoteEntity, (quote) => quote.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "quote_id" })
  quote!: QuoteEntity;

  @ManyToOne(() => ProductEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "product_id" })
  product!: ProductEntity | null;
}
