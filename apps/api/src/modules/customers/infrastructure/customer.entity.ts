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

  // Endereço fiscal ESTRUTURADO (destinatário da NF-e; a NFC-e dispensa).
  @Column({ name: "state_registration", type: "varchar", length: 20, nullable: true })
  stateRegistration!: string | null;

  @Column({ name: "address_street", type: "varchar", length: 160, nullable: true })
  addressStreet!: string | null;

  @Column({ name: "address_number", type: "varchar", length: 20, nullable: true })
  addressNumber!: string | null;

  @Column({ name: "address_complement", type: "varchar", length: 80, nullable: true })
  addressComplement!: string | null;

  @Column({ name: "address_neighborhood", type: "varchar", length: 80, nullable: true })
  addressNeighborhood!: string | null;

  @Column({ name: "address_city", type: "varchar", length: 80, nullable: true })
  addressCity!: string | null;

  @Column({ name: "address_state", type: "varchar", length: 2, nullable: true })
  addressState!: string | null;

  @Column({ name: "address_zip", type: "varchar", length: 9, nullable: true })
  addressZip!: string | null;

  @Column({ name: "city_code", type: "varchar", length: 7, nullable: true })
  cityCode!: string | null;
}
