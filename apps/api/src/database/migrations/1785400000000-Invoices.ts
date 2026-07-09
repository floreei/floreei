import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Nota fiscal (NFC-e/NF-e) emitida — ou tentada — para uma venda. FK RESTRICT
 * pra `events`: uma venda com histórico fiscal não pode ser excluída
 * (EventsService.remove() já valida isso antes, esta é a rede de segurança).
 */
export class Invoices1785400000000 implements MigrationInterface {
  name = "Invoices1785400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "company_id" uuid NOT NULL,
        "event_id" uuid NOT NULL,
        "document_type" character varying(4) NOT NULL,
        "status" character varying(12) NOT NULL DEFAULT 'PROCESSING',
        "provider" character varying(20) NOT NULL DEFAULT 'STUB',
        "provider_invoice_id" character varying(100),
        "access_key" character varying(44),
        "protocol" character varying(50),
        "number" integer,
        "series" character varying(10),
        "issue_date" TIMESTAMP WITH TIME ZONE,
        "xml_url" text,
        "danfe_url" text,
        "rejection_reason" text,
        "cancel_reason" text,
        "canceled_at" TIMESTAMP WITH TIME ZONE,
        "requested_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "raw_response" jsonb,
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_company_id" ON "invoices" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_invoices_company_event" ON "invoices" ("company_id", "event_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_event"`,
    );
    await queryRunner.query(`DROP INDEX "public"."ix_invoices_company_event"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invoices_company_id"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
  }
}
