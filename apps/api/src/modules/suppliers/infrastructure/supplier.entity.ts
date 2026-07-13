import { Column, Entity } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";

/** Fornecedor de flores e insumos. */
@Entity({ name: "suppliers" })
export class SupplierEntity extends TenantOwnedEntity {
  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  city!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  contact!: string | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  whatsapp!: string | null;

  /** Chave Pix do fornecedor (pagamento por Pix na hora do pagamento). */
  @Column({ name: "pix_key", type: "varchar", length: 140, nullable: true })
  pixKey!: string | null;

  @Column({ name: "payment_terms", type: "varchar", length: 160, nullable: true })
  paymentTerms!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;
}
