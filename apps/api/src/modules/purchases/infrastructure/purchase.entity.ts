import type { PurchaseStatus } from "@sistema-flores/types";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { decimalTransformer } from "../../../common/database/decimal.transformer";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { SupplierEntity } from "../../suppliers/infrastructure/supplier.entity";
import { PurchaseItemEntity } from "./purchase-item.entity";

/** Compra registrada a um fornecedor. */
@Entity({ name: "purchases" })
@Index("ix_purchases_company_date", ["companyId", "date"])
export class PurchaseEntity extends TenantOwnedEntity {
  @Column({ name: "supplier_id", type: "uuid" })
  supplierId!: string;

  @Column({ type: "date" })
  date!: string;

  /** Entrega prevista (opcional): data + horário livre "HH:MM". */
  @Column({ name: "delivery_date", type: "date", nullable: true })
  deliveryDate!: string | null;

  @Column({ name: "delivery_time", type: "varchar", length: 5, nullable: true })
  deliveryTime!: string | null;

  @Column({ type: "varchar", length: 16, default: "RECEIVED" })
  status!: PurchaseStatus;

  @Column({
    name: "items_total",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  itemsTotal!: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  freight!: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  total!: number;

  @Column({
    name: "paid_amount",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  paidAmount!: number;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @ManyToOne(() => SupplierEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "supplier_id" })
  supplier!: SupplierEntity;

  @OneToMany(() => PurchaseItemEntity, (item) => item.purchase, {
    cascade: true,
  })
  items!: PurchaseItemEntity[];
}
