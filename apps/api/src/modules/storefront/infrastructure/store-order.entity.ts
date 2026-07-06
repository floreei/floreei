import type { StoreOrderItem, StoreOrderStatus } from "@sistema-flores/types";
import { Column, Entity } from "typeorm";
import { decimalTransformer } from "../../../common/database/decimal.transformer";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";

/** Pedido feito na loja online. Vira uma venda no ERP quando o pagamento aprova. */
@Entity({ name: "store_orders" })
export class StoreOrderEntity extends TenantOwnedEntity {
  @Column({ name: "customer_id", type: "uuid", nullable: true })
  customerId!: string | null;

  @Column({ name: "customer_name", type: "varchar", length: 160 })
  customerName!: string;

  @Column({ name: "customer_phone", type: "varchar", length: 30 })
  customerPhone!: string;

  @Column({ name: "customer_email", type: "varchar", length: 180, nullable: true })
  customerEmail!: string | null;

  @Column({ name: "delivery_address", type: "varchar", length: 255, nullable: true })
  deliveryAddress!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  /** Snapshot dos itens no momento da compra. */
  @Column({ type: "jsonb", default: () => "'[]'" })
  items!: StoreOrderItem[];

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  total!: number;

  @Column({ type: "varchar", length: 16, default: "PENDING" })
  status!: StoreOrderStatus;

  @Column({ name: "mp_preference_id", type: "varchar", length: 120, nullable: true })
  mpPreferenceId!: string | null;

  @Column({ name: "mp_payment_id", type: "varchar", length: 120, nullable: true })
  mpPaymentId!: string | null;

  /** Venda (event) gerada no ERP quando o pagamento é aprovado. */
  @Column({ name: "event_id", type: "uuid", nullable: true })
  eventId!: string | null;
}
