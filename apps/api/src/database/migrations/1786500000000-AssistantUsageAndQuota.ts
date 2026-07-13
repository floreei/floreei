import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Medição de uso e cota do assistente de IA (tokens/mês):
 * - `plan_definitions.assistant_token_quota`: cota-padrão por plano (editável).
 * - `companies.assistant_token_quota`: override por empresa (o "plus"), NULL = usa a do plano.
 * - `assistant_usage`: um registro por chamada ao provedor (tokens), para somar por mês/empresa.
 */
export class AssistantUsageAndQuota1786500000000 implements MigrationInterface {
  name = "AssistantUsageAndQuota1786500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plan_definitions" ADD COLUMN "assistant_token_quota" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `UPDATE "plan_definitions" SET "assistant_token_quota" = 100000 WHERE "tier" = 'ESSENCIAL'`,
    );
    await queryRunner.query(
      `UPDATE "plan_definitions" SET "assistant_token_quota" = 300000 WHERE "tier" = 'LOJA'`,
    );
    await queryRunner.query(
      `UPDATE "plan_definitions" SET "assistant_token_quota" = 1000000 WHERE "tier" = 'COMPLETO'`,
    );

    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "assistant_token_quota" integer`,
    );

    await queryRunner.query(`
      CREATE TABLE "assistant_usage" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "company_id" uuid NOT NULL,
        "input_tokens" integer NOT NULL DEFAULT 0,
        "output_tokens" integer NOT NULL DEFAULT 0,
        "cache_read_tokens" integer NOT NULL DEFAULT 0,
        "cache_creation_tokens" integer NOT NULL DEFAULT 0,
        CONSTRAINT "pk_assistant_usage" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_assistant_usage_company_created" ON "assistant_usage" ("company_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "assistant_usage"`);
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "assistant_token_quota"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_definitions" DROP COLUMN "assistant_token_quota"`,
    );
  }
}
