import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Planos de preço (tiers) + entitlements por empresa: plano contratado e
 * overrides de feature (controlados pelo backoffice/assinatura). Usuários são
 * cobrados por cabeça (R$16), sem cap — por isso não há coluna de assentos.
 */
export class Plans1784400000000 implements MigrationInterface {
  name = "Plans1784400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "tier" character varying(16)`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "feature_overrides" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "feature_overrides"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "tier"`);
  }
}
