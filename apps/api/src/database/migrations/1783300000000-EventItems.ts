import { MigrationInterface, QueryRunner } from "typeorm";

export class EventItems1783300000000 implements MigrationInterface {
  name = "EventItems1783300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "event_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "event_id" uuid NOT NULL, "product_id" uuid, "description" character varying(200) NOT NULL, "quantity" numeric(12,3) NOT NULL, "unit" character varying(16) NOT NULL DEFAULT 'UNIDADE', "unit_sale_price" numeric(12,2) NOT NULL DEFAULT '0', "line_total" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_event_items" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_event_items_event" ON "event_items" ("event_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_items" ADD CONSTRAINT "FK_event_items_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_items" ADD CONSTRAINT "FK_event_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_items" DROP CONSTRAINT "FK_event_items_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_items" DROP CONSTRAINT "FK_event_items_event"`,
    );
    await queryRunner.query(`DROP INDEX "public"."ix_event_items_event"`);
    await queryRunner.query(`DROP TABLE "event_items"`);
  }
}
