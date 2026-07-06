import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/database/base.entity";
import { quantityTransformer } from "../../../common/database/decimal.transformer";
import { ProductEntity } from "../../catalog/infrastructure/product.entity";
import { ArrangementEntity } from "./arrangement.entity";

/** Linha da ficha técnica: um insumo e a quantidade consumida (unidade-base). */
@Entity({ name: "arrangement_items" })
export class ArrangementItemEntity extends BaseEntity {
  @Column({ name: "arrangement_id", type: "uuid" })
  arrangementId!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 3,
    transformer: quantityTransformer,
  })
  quantity!: number;

  @ManyToOne(() => ArrangementEntity, (arrangement) => arrangement.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "arrangement_id" })
  arrangement!: ArrangementEntity;

  @ManyToOne(() => ProductEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_id" })
  product!: ProductEntity;
}
