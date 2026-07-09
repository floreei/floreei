import type { InvoiceDocumentType, InvoiceStatus } from "@sistema-flores/types";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { EventEntity } from "../../events/infrastructure/event.entity";

/**
 * Nota fiscal emitida (ou tentada) para uma venda. Uma venda pode ter várias
 * linhas ao longo do tempo (reemissão após rejeição/cancelamento) — a mais
 * recente é a "vigente". FK RESTRICT: uma venda com histórico fiscal não
 * pode ser excluída (ver EventsService.remove()).
 */
@Entity({ name: "invoices" })
@Index("ix_invoices_company_event", ["companyId", "eventId"])
export class InvoiceEntity extends TenantOwnedEntity {
  @Column({ name: "event_id", type: "uuid" })
  eventId!: string;

  @Column({ name: "document_type", type: "varchar", length: 4 })
  documentType!: InvoiceDocumentType;

  @Column({ type: "varchar", length: 12, default: "PROCESSING" })
  status!: InvoiceStatus;

  /** Nome do provedor que processou ("STUB" enquanto nenhum está configurado). */
  @Column({ type: "varchar", length: 20, default: "STUB" })
  provider!: string;

  @Column({ name: "provider_invoice_id", type: "varchar", length: 100, nullable: true })
  providerInvoiceId!: string | null;

  @Column({ name: "access_key", type: "varchar", length: 44, nullable: true })
  accessKey!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  protocol!: string | null;

  @Column({ type: "int", nullable: true })
  number!: number | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  series!: string | null;

  @Column({ name: "issue_date", type: "timestamptz", nullable: true })
  issueDate!: Date | null;

  @Column({ name: "xml_url", type: "text", nullable: true })
  xmlUrl!: string | null;

  @Column({ name: "danfe_url", type: "text", nullable: true })
  danfeUrl!: string | null;

  @Column({ name: "rejection_reason", type: "text", nullable: true })
  rejectionReason!: string | null;

  @Column({ name: "cancel_reason", type: "text", nullable: true })
  cancelReason!: string | null;

  @Column({ name: "canceled_at", type: "timestamptz", nullable: true })
  canceledAt!: Date | null;

  @Column({ name: "requested_at", type: "timestamptz" })
  requestedAt!: Date;

  /** Payload bruto devolvido pelo provedor — útil pra depurar sem esquema fixo. */
  @Column({ name: "raw_response", type: "jsonb", nullable: true })
  rawResponse!: unknown | null;

  @ManyToOne(() => EventEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "event_id" })
  event!: EventEntity;
}
