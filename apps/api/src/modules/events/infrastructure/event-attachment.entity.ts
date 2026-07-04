import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { EventEntity } from "./event.entity";

/** Anexo (link) de um evento: referência de decoração, contrato, pasta de fotos. */
@Entity({ name: "event_attachments" })
@Index("ix_event_attachments_event", ["eventId"])
export class EventAttachmentEntity extends TenantOwnedEntity {
  @Column({ name: "event_id", type: "uuid" })
  eventId!: string;

  @Column({ type: "varchar", length: 120 })
  label!: string;

  @Column({ type: "varchar", length: 500 })
  url!: string;

  @ManyToOne(() => EventEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: EventEntity;
}
