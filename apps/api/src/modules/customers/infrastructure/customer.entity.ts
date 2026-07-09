import type { SalesChannel } from "@sistema-flores/types";
import { Column, Entity } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";

/** Cliente da floricultura (pessoa física ou jurídica). */
@Entity({ name: "customers" })
export class CustomerEntity extends TenantOwnedEntity {
  @Column({ type: "varchar", length: 160 })
  name!: string;

  /** Venda direta (varejo) ou atacado — determina em qual venda ele aparece. */
  @Column({ type: "varchar", length: 10, default: "RETAIL" })
  channel!: SalesChannel;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  whatsapp!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  document!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  address!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;
}
