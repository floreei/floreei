import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Régua de cobrança: config por empresa (dunning_settings) e log de disparos
 * (dunning_log, com dedupe por empresa+evento+passo).
 */
export class Dunning1786200000000 implements MigrationInterface {
  name = "Dunning1786200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "dunning_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "company_id" uuid NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "steps" jsonb NOT NULL DEFAULT '[]',
        "payment_method" varchar(16) NOT NULL DEFAULT 'NONE',
        "pix_key" varchar(200),
        "mp_link" varchar(500),
        "extra_line" varchar(300),
        CONSTRAINT "pk_dunning_settings" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ux_dunning_settings_company" ON "dunning_settings" ("company_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "dunning_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "company_id" uuid NOT NULL,
        "event_id" uuid,
        "customer_name" varchar(160),
        "step" integer NOT NULL,
        "status" varchar(16) NOT NULL,
        "channel" varchar(32) NOT NULL,
        "message" text NOT NULL,
        "sent_at" TIMESTAMPTZ NOT NULL,
        "error" text,
        CONSTRAINT "pk_dunning_log" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ux_dunning_log_event_step" ON "dunning_log" ("company_id", "event_id", "step")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_dunning_log_company" ON "dunning_log" ("company_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "dunning_log"`);
    await queryRunner.query(`DROP TABLE "dunning_settings"`);
  }
}
