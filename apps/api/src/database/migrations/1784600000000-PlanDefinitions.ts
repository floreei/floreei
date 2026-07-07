import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Definições dos planos deixam de ser fixas no código: preço-base, preço por
 * usuário e features moram aqui e são editáveis pelo console do gestor.
 * Semente = valores que estavam em PLAN_TIERS.
 */
export class PlanDefinitions1784600000000 implements MigrationInterface {
  name = "PlanDefinitions1784600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "plan_definitions" (
        "tier" character varying(16) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying(40) NOT NULL,
        "tagline" character varying(80) NOT NULL DEFAULT '',
        "base_price" numeric(12,2) NOT NULL DEFAULT 0,
        "user_price" numeric(12,2) NOT NULL DEFAULT 16,
        "features" jsonb NOT NULL DEFAULT '[]',
        CONSTRAINT "PK_plan_definitions" PRIMARY KEY ("tier")
      )`,
    );
    await queryRunner.query(
      `INSERT INTO "plan_definitions" ("tier", "name", "tagline", "base_price", "user_price", "features") VALUES
        ('ESSENCIAL', 'Essencial', 'Venda direta', 79, 16, '["SALES","QUOTES"]'),
        ('LOJA', 'Loja', 'Lojinha online', 149, 16, '["SALES","QUOTES","STORE","INVENTORY","ARRANGEMENTS","FINANCE"]'),
        ('COMPLETO', 'Completo', 'Varejista', 229, 16, '["SALES","QUOTES","INVENTORY","ARRANGEMENTS","FINANCE","REPORTS","STORE"]')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "plan_definitions"`);
  }
}
