import { MigrationInterface, QueryRunner } from "typeorm";

/** Pedidos da loja online (store_orders). Viram venda no ERP quando o MP aprova. */
export class StoreOrders1784300000000 implements MigrationInterface {
  name = "StoreOrders1784300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "store_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "company_id" uuid NOT NULL,
        "customer_id" uuid,
        "customer_name" character varying(160) NOT NULL,
        "customer_phone" character varying(30) NOT NULL,
        "customer_email" character varying(180),
        "delivery_address" character varying(255),
        "notes" text,
        "items" jsonb NOT NULL DEFAULT '[]',
        "total" numeric(12,2) NOT NULL DEFAULT 0,
        "status" character varying(16) NOT NULL DEFAULT 'PENDING',
        "mp_preference_id" character varying(120),
        "mp_payment_id" character varying(120),
        "event_id" uuid,
        CONSTRAINT "PK_store_orders" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_store_orders_company_status" ON "store_orders" ("company_id", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "ix_store_orders_company_status"`);
    await queryRunner.query(`DROP TABLE "store_orders"`);
  }
}
