import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Console do gestor da plataforma: controle de acesso das empresas (plano/trial +
 * suspensão + último acesso) e a tabela de gestores (`platform_admins`).
 * Empresas já existentes viram ACTIVE (não bloquear quem já usa).
 */
export class PlatformConsole1784100000000 implements MigrationInterface {
  name = "PlatformConsole1784100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "plan" character varying(16) NOT NULL DEFAULT 'TRIAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "first_access_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "trial_ends_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "suspended" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "last_seen_at" TIMESTAMP WITH TIME ZONE`,
    );

    // Empresas que já existiam continuam liberadas (sem prazo), com o histórico
    // preenchido a partir da própria criação/atualização.
    await queryRunner.query(
      `UPDATE "companies" SET "plan" = 'ACTIVE', "first_access_at" = "created_at", "trial_ends_at" = "created_at" + interval '7 days', "last_seen_at" = "updated_at"`,
    );

    await queryRunner.query(
      `CREATE TABLE "platform_admins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying(180) NOT NULL, "name" character varying(160) NOT NULL, "firebase_uid" character varying(128), "role" character varying(16) NOT NULL DEFAULT 'SUPPORT', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_platform_admins" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_platform_admins_email" ON "platform_admins" ("email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_platform_admins_firebase_uid" ON "platform_admins" ("firebase_uid") WHERE "firebase_uid" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."uq_platform_admins_firebase_uid"`);
    await queryRunner.query(`DROP INDEX "public"."uq_platform_admins_email"`);
    await queryRunner.query(`DROP TABLE "platform_admins"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "last_seen_at"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "suspended"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "trial_ends_at"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "first_access_at"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "plan"`);
  }
}
