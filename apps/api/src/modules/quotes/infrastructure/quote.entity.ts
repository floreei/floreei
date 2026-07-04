import type { QuoteStatus } from "@sistema-flores/types";
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
import { CustomerEntity } from "../../customers/infrastructure/customer.entity";
import { EventEntity } from "../../events/infrastructure/event.entity";
import { UserEntity } from "../../users/infrastructure/user.entity";
import { QuoteItemEntity } from "./quote-item.entity";

/** Orçamento. Ao ser aprovado, converte-se em um Evento (venda). */
@Entity({ name: "quotes" })
@Index("uq_quotes_company_number", ["companyId", "number"], { unique: true })
export class QuoteEntity extends TenantOwnedEntity {
  @Column({ type: "int" })
  number!: number;

  @Column({ name: "customer_id", type: "uuid" })
  customerId!: string;

  @Column({ name: "event_id", type: "uuid", nullable: true })
  eventId!: string | null;

  @Column({ name: "created_by_id", type: "uuid", nullable: true })
  createdById!: string | null;

  @Column({ type: "varchar", length: 16, default: "DRAFT" })
  status!: QuoteStatus;

  @Column({ name: "valid_until", type: "date", nullable: true })
  validUntil!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({
    name: "total_cost",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  totalCost!: number;

  @Column({
    name: "total_sale",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  totalSale!: number;

  @Column({
    name: "total_profit",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  totalProfit!: number;

  @Column({
    name: "margin_pct",
    type: "decimal",
    precision: 6,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  marginPct!: number;

  @ManyToOne(() => CustomerEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "customer_id" })
  customer!: CustomerEntity;

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "created_by_id" })
  createdBy!: UserEntity | null;

  @ManyToOne(() => EventEntity, (event) => event.quotes, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "event_id" })
  event!: EventEntity | null;

  @OneToMany(() => QuoteItemEntity, (item) => item.quote, {
    cascade: true,
    eager: true,
    orphanedRowAction: "delete",
  })
  items!: QuoteItemEntity[];
}
