import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Assinaturas recorrentes (Mercado Pago preapproval), uma linha por preapproval
 * (histórico). Em `companies`, o estado corrente fica denormalizado
 * (`subscription_status` + `payment_failed_at`) para o guard de acesso não
 * precisar de join a cada request.
 */
export class Subscriptions1784500000000 implements MigrationInterface {
  name = "Subscriptions1784500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "company_id" uuid NOT NULL,
        "tier" character varying(16) NOT NULL,
        "mp_preapproval_id" character varying(120) NOT NULL,
        "status" character varying(16) NOT NULL DEFAULT 'PENDING',
        "amount" numeric(12,2) NOT NULL DEFAULT 0,
        "billed_users" integer NOT NULL DEFAULT 0,
        "payment_failed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_subscriptions_preapproval" UNIQUE ("mp_preapproval_id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_subscriptions_company" ON "subscriptions" ("company_id", "created_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "subscription_status" character varying(16)`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "payment_failed_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "payment_failed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "subscription_status"`,
    );
    await queryRunner.query(`DROP INDEX "ix_subscriptions_company"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
  }
}
