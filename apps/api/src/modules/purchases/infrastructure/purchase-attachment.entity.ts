import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { PurchaseEntity } from "./purchase.entity";

/** Anexo (link) de uma compra: comprovante de pagamento, nota, foto. */
@Entity({ name: "purchase_attachments" })
@Index("ix_purchase_attachments_purchase", ["purchaseId"])
export class PurchaseAttachmentEntity extends TenantOwnedEntity {
  @Column({ name: "purchase_id", type: "uuid" })
  purchaseId!: string;

  @Column({ type: "varchar", length: 120 })
  label!: string;

  @Column({ type: "varchar", length: 500 })
  url!: string;

  @ManyToOne(() => PurchaseEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "purchase_id" })
  purchase!: PurchaseEntity;
}
