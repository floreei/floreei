import type { EventStatus, EventType } from "@sistema-flores/types";
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
import { QuoteEntity } from "../../quotes/infrastructure/quote.entity";
import { UserEntity } from "../../users/infrastructure/user.entity";
import { EventItemEntity } from "./event-item.entity";

/** Evento = venda confirmada (ex.: "Casamento João e Maria"). */
@Entity({ name: "events" })
@Index("ix_events_company_status_date", ["companyId", "status", "date"])
export class EventEntity extends TenantOwnedEntity {
  @Column({ type: "varchar", length: 8, default: "EVENT" })
  type!: EventType;

  @Column({ type: "varchar", length: 180 })
  title!: string;

  @Column({ name: "customer_id", type: "uuid", nullable: true })
  customerId!: string | null;

  @Column({ name: "quote_id", type: "uuid", nullable: true })
  quoteId!: string | null;

  @Column({ name: "responsible_user_id", type: "uuid", nullable: true })
  responsibleUserId!: string | null;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  location!: string | null;

  @Column({ type: "varchar", length: 16, default: "CONFIRMED" })
  status!: EventStatus;

  @Column({
    name: "sold_value",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  soldValue!: number;

  @Column({
    name: "received_value",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  receivedValue!: number;

  @Column({
    name: "estimated_profit",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  estimatedProfit!: number;

  @Column({
    name: "real_profit",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  realProfit!: number | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @ManyToOne(() => CustomerEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "customer_id" })
  customer!: CustomerEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "responsible_user_id" })
  responsible!: UserEntity | null;

  @OneToMany(() => QuoteEntity, (quote) => quote.event)
  quotes!: QuoteEntity[];

  @OneToMany(() => EventItemEntity, (item) => item.event, { cascade: true })
  items!: EventItemEntity[];
}
