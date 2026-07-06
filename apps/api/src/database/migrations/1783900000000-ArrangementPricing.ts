import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Buquê precificado por política: modo (FIXED / PROFIT_VALUE / MARGIN_PCT) + o
 * lucro em R$ ou a margem % alvo. O preço passa a ser derivado do custo + política
 * (acompanha o custo). Compat: buquês existentes ficam FIXED, mantendo o sale_price.
 */
export class ArrangementPricing1783900000000 implements MigrationInterface {
  name = "ArrangementPricing1783900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "arrangements" ADD COLUMN "pricing_mode" character varying(20) NOT NULL DEFAULT 'FIXED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangements" ADD COLUMN "profit_value" numeric(12,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangements" ADD COLUMN "profit_pct" numeric(5,2) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "arrangements" DROP COLUMN "profit_pct"`);
    await queryRunner.query(`ALTER TABLE "arrangements" DROP COLUMN "profit_value"`);
    await queryRunner.query(`ALTER TABLE "arrangements" DROP COLUMN "pricing_mode"`);
  }
}
