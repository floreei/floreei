import { MigrationInterface, QueryRunner } from "typeorm";

export class PurchaseDeliveryAndAttachments1783200000000
  implements MigrationInterface
{
  name = "PurchaseDeliveryAndAttachments1783200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Entrega prevista (data + horário livre "HH:MM").
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD "delivery_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD "delivery_time" character varying(5)`,
    );

    // Anexos da compra (comprovante de pagamento, nota, etc.).
    await queryRunner.query(
      `CREATE TABLE "purchase_attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "purchase_id" uuid NOT NULL, "label" character varying(120) NOT NULL, "url" character varying(500) NOT NULL, CONSTRAINT "PK_purchase_attachments" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_purchase_attachments_company" ON "purchase_attachments" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_purchase_attachments_purchase" ON "purchase_attachments" ("purchase_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_attachments" ADD CONSTRAINT "FK_purchase_attachments_purchase" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_attachments" DROP CONSTRAINT "FK_purchase_attachments_purchase"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."ix_purchase_attachments_purchase"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."ix_purchase_attachments_company"`,
    );
    await queryRunner.query(`DROP TABLE "purchase_attachments"`);
    await queryRunner.query(
      `ALTER TABLE "purchases" DROP COLUMN "delivery_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" DROP COLUMN "delivery_date"`,
    );
  }
}
