import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adiciona a feature INVOICING ao plano COMPLETO — e corrige de passagem um
 * gap real: WHOLESALE (lançado antes) nunca tinha sido adicionado à lista de
 * features do COMPLETO nesta tabela (`plan_definitions`, fonte real em
 * runtime — `PLAN_TIERS` em packages/types é só semente/fallback). Sem essa
 * correção, nenhuma empresa paga (fora do trial, que ignora esta tabela)
 * tinha WHOLESALE de fato liberado.
 */
export class InvoicingFeature1785600000000 implements MigrationInterface {
  name = "InvoicingFeature1785600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "plan_definitions" SET "features" = '["SALES","QUOTES","INVENTORY","ARRANGEMENTS","FINANCE","REPORTS","STORE","WHOLESALE","INVOICING"]' WHERE "tier" = 'COMPLETO'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "plan_definitions" SET "features" = '["SALES","QUOTES","INVENTORY","ARRANGEMENTS","FINANCE","REPORTS","STORE"]' WHERE "tier" = 'COMPLETO'`,
    );
  }
}
